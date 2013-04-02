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

  models.endpoints_map = {};

  /**
   * Find available relation targets for a service.
   *
   * @method getEndpoints
   * @param {Object} svc A service object.
   * @param {Object} ep_map A mapping of service name to available endpoints
   *   for the service in the form [{'interface':x, 'name':y, 'role': z}, ...].
   * @param {Object} db The application database.
   *
   * @return {Object} A mapping with keys of valid relation service targets
   *   and values consisting of a list of valid endpoints for each.
   */
  models.getEndpoints = function(svc, ep_map, db) {
    var targets = {},
        requires = [],
        provides = [],
        sid = svc.get('id');

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

  /**
   * Setup on('load') handler for a charm.
   *
   * @method setupCharmOnLoad
   * @param {Object} charm The charm to watch.
   * @param {String} svcName The name of the service the charm is attached.
   * @return {undefined} Nothing.
   */
  var setupCharmOnLoad = function(charm, svcName) {
    charm.on('load', Y.bind(function(svcName, evt) {
      addServiceToEndpointsMap(svcName, evt.currentTarget);
    }, null, svcName));
  };

  /**
   * Handle event for a service being added to the services modellist.
   *
   * @method serviceAddHandler
   * @param {Object} evt The event, containing a model object.
   * @return {undefined} Nothing.
   */
  models.serviceAddHandler = function(evt) {
    var svcName = evt.model.get('id');
    var charm_id = evt.model.get('charm'),
        self = this,
        charm = this.db.charms.getById(charm_id);

    // If the charm doesn't exist, add and load it.
    if (!Y.Lang.isValue(charm)) {
      charm = this.db.charms.add({id: charm_id})
        .load(this.env,
          // If views are bound to the charm model, firing "update" is
          // unnecessary, and potentially even mildly harmful.
          function(err, result) { self.db.fire('update'); });
    }

    // If the service is not a ghost (i.e. 'pending' is false), process it.
    if (!evt.model.get('pending')) {
      if (charm.loaded) {
        addServiceToEndpointsMap(svcName, charm);
      } else {
        setupCharmOnLoad(charm, svcName);
      }
    }
  };

  /**
   * Handle event for a service transitioning from a ghost to a corporeal
   * object as indicated by the 'pending' attribute becoming false.  Also
   * handles changes in the service's charm.
   *
   * @method serviceChangeHandler
   * @param {Object} evt The event, containing the service as the target.
   * @return {undefined} Nothing.
   */
  models.serviceChangeHandler = function(evt) {
    var charm_id = evt.target.get('charm'),
        charm = this.db.charms.getById(charm_id),
        service = evt.target,
        svcName = service.get('id');
    // Ensure the service is no longer pending.
    if (service.get('pending')) {
      return;
    }
    if (charm.loaded) {
      addServiceToEndpointsMap(svcName, charm);
    } else {
      setupCharmOnLoad(charm, svcName);
    }
  };

  /**
   * Handle event for a service removal.
   *
   * @method serviceRemoveHandler
   * @param {Object} evt The event, containing the service as the target.
   * @return {undefined} Nothing.
   */
  models.serviceRemoveHandler = function(evt) {
    var svcName = evt.model.get('id');
    delete(models.endpoints_map[svcName]);
  };

  /**
   * Flatten the relation metadata.
   *
   * @method flatten
   * @param {Object} meta The relation metadata.
   * @return {List} A list of objects, where each entry is a hash with a
   *   'name' key and the key value pairs from the metadata.
   */
  var flatten = function(meta) {
    var result = [];
    if (Y.Lang.isValue(meta)) {
      for (var k in meta) {
        if (true) { // Avoid lint warning.
          var rel = {};
          rel.name = k;
          for (var j in meta[k]) {
            if (true) { // Avoid lint warning.
              rel[j] = meta[k][j];
            }
          }
          result.push(rel);
        }
      }
    }
    return result;
  };

  var addServiceToEndpointsMap = function(svcName, charm) {
    models.endpoints_map[svcName] = {};
    models.endpoints_map[svcName].provides = flatten(charm.get('provides'));
    models.endpoints_map[svcName].requires = flatten(charm.get('requires'));
  };

  models.addServiceToEndpointsMap = addServiceToEndpointsMap;

});
