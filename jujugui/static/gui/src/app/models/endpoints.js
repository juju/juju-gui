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

  var models = Y.namespace('juju.models');
  var relationUtils = window.juju.utils.RelationUtils;

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
   * @param {Object} svc A service object.
   * @param {Object} controller The endpoints controller.
   *
   * @return {Object} A mapping with keys of valid relation service targets
   *   and values consisting of a list of valid endpoints for each.
   */
  models.getEndpoints = function(svc, controller) {
    var targets = {},
        requires = [],
        provides = [],
        sid = svc.get('id'),
        db = controller.get('db'),
        ep_map = controller.endpointsMap;
    const appIsSubordinate = svc.get('subordinate');
    const appSeries = models._getSeries(db, svc);

    // Bail out if the map doesn't yet exist for this service.  The charm may
    // not be loaded yet.
    if (!ep_map[sid]) {
      return targets;
    }
    /**
     * Convert a service name and its relation endpoint info into a
     * valid relation target endpoint, ie. including service name.
     *
     * @method getEndpoints.convert
     */
    function convert(svcName, relInfo) {
      return {
        service: svcName,
        name: relInfo.name,
        type: relInfo['interface']
      };
    }

    /**
     * Store endpoints for a relation to target the given service.
     *
     * @method getEndpoints.add
     * @param {Object} tep Target endpoint.
     * @param {Object} oep Origin endpoint.
     */
    function add(svcName, oep, tep) {
      if (!Y.Object.owns(targets, svcName)) {
        targets[svcName] = [];
      }
      targets[svcName].push([oep, tep]);
    }

    // First we process all the endpoints of the origin service.
    //
    // For required interfaces, we consider them valid for new relations
    // only if they are not already satisfied by an existing relation.
    Y.each(
        ep_map[sid].requires,
        function(rdata) {
          var ep = convert(sid, rdata);
          // Subordinate relations are slightly different:
          // a subordinate typically acts as a client to many services,
          // against the implicitly provided juju-info interface.
          if (svc.get('subordinate') &&
            relationUtils.isSubordinateRelation(rdata)) {
            return requires.push(ep);
          }
          if (db.relations.has_relation_for_endpoint(ep)) {
            return;
          }
          requires.push(ep);
        });

    // Process origin provides endpoints, a bit simpler, as they are
    // always one to many.
    Y.each(
        ep_map[sid].provides,
        function(pdata) {
          provides.push(convert(sid, pdata));
        });

    // Every non subordinate service implicitly provides this.
    if (!appIsSubordinate) {
      provides.push(convert(
          sid, {'interface': 'juju-info', 'name': 'juju-info'}));
    }

    // Now check every other service to see if it can be a valid target.
    Y.each(db.services, function(tgt) {
      var tid = tgt.get('id'),
          tprovides = ep_map[tid].provides.concat();
      const targetIsSubordinate = tgt.get('subordinate');
      const targetSeries = models._getSeries(db, tgt);

      // Ignore ourselves, peer relations are automatically
      // established when a service is deployed. The gui only needs to
      // concern itself with client/server relations.
      if (tid === sid) {
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
      Y.each(
          ep_map[tid].requires,
          function(rdata) {
            var ep = convert(tid, rdata);
            // Subordinates are exceptions again as they are a client
            // to many services. We check if a subordinate relation
            // exists between this subordinate endpoint and the origin
            // service.
            if (targetIsSubordinate &&
              relationUtils.isSubordinateRelation(rdata)) {
              if (db.relations.has_relation_for_endpoint(ep, sid)) {
                return;
              }
            } else if (db.relations.has_relation_for_endpoint(ep)) {
              return;
            }
            // If the origin provides it then it is a valid target.
            Y.Array.filter(provides, function(oep) {
              if (oep.type === ep.type) {
                add(tid, oep, ep);
              }
            });
          });

      // Check against the implicit interface juju-info, but not for
      // subordinates.
      if (!tgt.get('subordinate')) {
        tprovides.push({'interface': 'juju-info', 'name': 'juju-info'});
      }

      Y.each(
          tprovides,
          function(pdata) {
            var ep = convert(tid, pdata);
            Y.Array.each(requires,
               function(oep) {
                 if (oep.type !== ep.type ||
                     db.relations.has_relation_for_endpoint(ep, sid)) {
                   return;
                 }
                 add(tid, oep, ep);
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
