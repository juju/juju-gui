/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const relationUtils = require('./relation-utils');

/**
  Get the series for a service. Pending subordinates should return all the
  available series from the charm.

  @method _getSeries
  @param {Object} db A reference to the application database.
  @param {Object} app An application object.
  @return {Array} A list of available series.
*/
const _getSeries = (db, app) => {
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
};

/**
  Find available relation targets for an application.
  @param {Object} application An application object.
  @param {Object} controller The endpoints controller.
  @return {Object} A mapping with keys of valid relation application targets
    and values consisting of a list of valid endpoints for each.
*/
const getEndpoints = (application, controller) => {
  const targets = {};
  const appId = application.get('id');
  const db = controller.db;
  const endpointsMap = controller.endpointsMap;
  const appEndpoints = endpointsMap[appId];
  const appIsSubordinate = application.get('subordinate');
  const appSeries = _getSeries(db, application);
  // Bail out if the map doesn't yet exist for this application. The charm may
  // not be loaded yet.
  if (!appEndpoints) {
    return {};
  }
  /**
    Convert an application name and its relation endpoint info into a
    valid relation target endpoint, ie. including application name.
  */
  function convert(applicationName, relInfo) {
    return {
      service: applicationName,
      name: relInfo.name,
      type: relInfo['interface']
    };
  }
  /**
    Store endpoints for a relation to target the given application.
    @param {Object} targetEndpoint Target endpoint.
    @param {Object} originEndpoint Origin endpoint.
  */
  function add(applicationName, originEndpoint, targetEndpoint) {
    if (!targets.hasOwnProperty(applicationName)) {
      targets[applicationName] = [];
    }
    targets[applicationName].push([originEndpoint, targetEndpoint]);
  }
  // First we process all the endpoints of the origin application to use a
  // legacy format because this is what other legacy utils require.
  const requires = appEndpoints.requires.map(rdata => convert(appId, rdata));
  const provides = appEndpoints.provides.map(pdata => convert(appId, pdata));
  // Every non subordinate service implicitly provides this.
  if (!appIsSubordinate) {
    provides.push(convert(
      appId, {'interface': 'juju-info', 'name': 'juju-info'}));
  }
  // Now check every other application to see if it can be a valid target.
  db.services.each(target => {
    const targetId = target.get('id');
    let targetProvides = [];
    // TODO frankban: it's not clear why a target should not be included in
    // the endpoints map. But it happens. This needs investigation.
    if (endpointsMap[targetId] && endpointsMap[targetId].provides) {
      targetProvides = endpointsMap[targetId].provides.concat();
    }
    const targetIsSubordinate = target.get('subordinate');
    // Ignore ourselves, peer relations are automatically established when an
    // application is deployed. The GUI only needs to concern itself with
    // client/server relations.
    if (targetId === appId) { return; }
    // Process each of the application's required endpoints.
    endpointsMap[targetId].requires.forEach(rdata => {
      const endpoint = convert(targetId, rdata);
      // Subordinate relations are handled differently because they can be
      // installed on the target machine depending on the defined scope.
      if (targetIsSubordinate && relationUtils.isSubordinateRelation(rdata)) {
        // In addition to checking if the relation is of type `subordinate`
        // The `isSubordinateRelation` function also checks that the
        // subordinate relation is of scope 'container' which means that
        // the series must match between the target and source.
        const targetSeries = _getSeries(db, target);
        if (!appSeries.some(series => targetSeries.indexOf(series) > -1)) {
          return;
        }
      }
      // A relation between two applications can only be completed once on
      // the same interface.
      if (db.relations.has_relation_for_endpoint(endpoint, appId)) {
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

module.exports = {getEndpoints};
