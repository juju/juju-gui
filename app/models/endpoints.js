'use strict';

/**
 * Provide the database endpoints handling.
 *
 * @module models
 * @submodule models.endpoints
 */

YUI.add('juju-endpoints', function(Y) {

  var models = Y.namespace('juju.models');
  var utils = Y.namespace('juju.views.utils');

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
          if (svc.get('subordinate') && utils.isSubordinateRelation(rdata)) {
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
    if (!svc.get('subordinate')) {
      provides.push(convert(
          sid, {'interface': 'juju-info', 'name': 'juju-info'}));
    }

    // Now check every other service to see if it can be a valid target.
    db.services.each(function(tgt) {
      var tid = tgt.get('id'),
          tprovides = ep_map[tid].provides.concat();

      // Ignore ourselves, peer relations are automatically
      // established when a service is deployed. The gui only needs to
      // concern itself with client/server relations.
      if (tid === sid) {
        return;
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
            if (tgt.get('subordinate') && utils.isSubordinateRelation(rdata)) {
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

});
