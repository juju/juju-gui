/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Provide the database endpoints handling.
 *
 * @module models
 * @submodule models.endpoints
 */

YUI.add('juju-endpoints', function(Y) {

  const models = Y.namespace('juju.models');
  const relationUtils = window.juju.utils.RelationUtils;

  /**
    Get the series for a service. Pending subordinates should return all the
    available series from the charm.

    @method _getSeries
    @param {Object} db A reference to the application database.
    @param {Object} app An application object.
    @return {Array} A list of available series.
  */
  models._getSeries = function(db, app) {
    let series = app.get('series');
    // Pending subordinates should be checked against all their available
    // series.
    if (app.get('subordinate') && app.get('pending')) {
      series = db.charms.getById(app.get('charm')).get('series');
    }
    if (!Array.isArray(series)) {
      series = [series];
    }
    return series;
  },

  /**
   * Find available relation targets for a service.
   *
   * @method getEndpoints
   * @param {Object} application A service object.
   * @param {Object} controller The endpoints controller.
   *
   * @return {Object} A mapping with keys of valid relation service targets
   *   and values consisting of a list of valid endpoints for each.
   */
  models.getEndpoints = function(application, controller) {
    const targets = {},
        requires = [],
        provides = [],
        appId = application.get('id'),
        db = controller.get('db'),
        endpointsMap = controller.endpointsMap;
    const appIsSubordinate = application.get('subordinate');
    const appSeries = models._getSeries(db, application);

    // Bail out if the map doesn't yet exist for this service.  The charm may
    // not be loaded yet.
    if (!endpointsMap[appId]) {
      return targets;
    }
    /**
     * Convert a service name and its relation endpoint info into a
     * valid relation target endpoint, ie. including service name.
     *
     * @method getEndpoints.convert
     */
    function convert(applicationName, relInfo) {
      return {
        service: applicationName,
        name: relInfo.name,
        type: relInfo['interface']
      };
    }

    /**
     * Store endpoints for a relation to target the given service.
     *
     * @method getEndpoints.add
     * @param {Object} targetEndpoint Target endpoint.
     * @param {Object} originEndpoint Origin endpoint.
     */
    function add(applicationName, originEndpoint, targetEndpoint) {
      if (!targets.hasOwnProperty(applicationName)) {
        targets[applicationName] = [];
      }
      targets[applicationName].push([originEndpoint, targetEndpoint]);
    }

    // First we process all the endpoints of the origin service.
    //
    // For required interfaces, we consider them valid for new relations
    // only if they are not already satisfied by an existing relation.
    endpointsMap[appId].requires.forEach(rdata => {
      const endpoint = convert(appId, rdata);
      // Subordinate relations are slightly different:
      // a subordinate typically acts as a client to many services,
      // against the implicitly provided juju-info interface.
      if (application.get('subordinate') &&
        relationUtils.isSubordinateRelation(rdata)) {
        return requires.push(endpoint);
      }
      if (db.relations.has_relation_for_endpoint(endpoint)) {
        return;
      }
      requires.push(endpoint);
    });

    // Process origin provides endpoints, a bit simpler, as they are
    // always one to many.
    endpointsMap[appId].provides.forEach(pdata => {
      provides.push(convert(appId, pdata));
    });

    // Every non subordinate service implicitly provides this.
    if (!appIsSubordinate) {
      provides.push(convert(
          appId, {'interface': 'juju-info', 'name': 'juju-info'}));
    }

    // Now check every other service to see if it can be a valid target.
    db.services.each(target => {
      const targetId = target.get('id'),
          targetProvides = endpointsMap[targetId].provides.concat();
      const targetIsSubordinate = target.get('subordinate');
      const targetSeries = models._getSeries(db, target);

      // Ignore ourselves, peer relations are automatically
      // established when a service is dendpointloyed. The gui only needs to
      // concern itself with client/server relations.
      if (targetId === appId) {
        return;
      }
      // If the provided service is a subordinate it should only match targets
      // with the same series. Or, if the target is a subordinate it needs to
      // have a matching series to the provided app.
      if (targetIsSubordinate || appIsSubordinate) {
        // If there is no match beween the app and target series then exit out
        // so this target does not get included in the list.
        if (!appSeries.some(series => targetSeries.indexOf(series) > -1)) {
          return;
        }
      }
      // Process each of the service's required endpoints. It is only
      // considered a valid target if it is not satisfied by an existing
      // relation.
      endpointsMap[targetId].requires.forEach(rdata => {
        const endpoint = convert(targetId, rdata);
        // Subordinates are excendpointtions again as they are a client
        // to many services. We check if a subordinate relation
        // exists between this subordinate endpoint and the origin
        // service.
        if (targetIsSubordinate &&
          relationUtils.isSubordinateRelation(rdata)) {
          if (db.relations.has_relation_for_endpoint(endpoint, appId)) {
            return;
          }
        } else if (db.relations.has_relation_for_endpoint(endpoint)) {
          return;
        }
        // If the origin provides it then it is a valid target.
        provides.filter(originEndpoint => {
          if (originEndpoint.type === endpoint.type) {
            add(targetId, originEndpoint, endpoint);
          }
        });
      });

      // Check against the implicit interface juju-info, but not for
      // subordinates.
      if (!target.get('subordinate')) {
        targetProvides.push({'interface': 'juju-info', 'name': 'juju-info'});
      }
      targetProvides.forEach(pdata => {
        const endpoint = convert(targetId, pdata);
        requires.forEach(originEndpoint => {
          if (originEndpoint.type !== endpoint.type ||
              db.relations.has_relation_for_endpoint(endpoint, appId)) {
            return;
          }
          add(targetId, originEndpoint, endpoint);
        });
      });
    });
    return targets;
  };

}, '', {
  requires: [
    'relation-utils'
  ]
});
