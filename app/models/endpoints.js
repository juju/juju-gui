'use strict';
/*

*/

YUI.add('juju-endpoints', function(Y) {

  var models = Y.namespace('juju.models');

  /* Find available relation targets for a service.

     :param svc: A service object.
     :param ep_map: An mapping of service name to available endpoints
       for the service in the form [{'interface':x, 'name':y, 'role': z}, ...].
     :param db: The application database
 
     Returns a mapping with keys of valid relation service targets and
     values consisting of a list of valid endpoints for each.
     
  */
  models.getEndpoints = function(svc, ep_map, db) {
    var targets = {},
        requires = [],
        provides = [],
        sid = svc.get('id');

    console.groupCollapsed("Relation endpoints for", sid);
    console.time("Endpoint Match");

    /* Convert a service name and its relation endpoint info into a
       valid relation target endpoint, ie. including service name. */
    function convert(svcName, relInfo) {
      return {
        service: svcName,
        name: relInfo.name,
        type: relInfo['interface']};
    }

    /* Store a new relation endpoint target for the given service. */
    function add(svcName, ep) {
        if (!Y.Object.owns(targets, svcName)) {
            targets[svcName] = [];
        }
        targets[svcName].push(ep);
    }

    // First we process all the endpoints of the origin service.

    // For required interfaces, we only consider them valid for
    // new relations, if their not already satisified by an existing
    // relation.
    Y.each(
        ep_map[sid].requires,
        function(rdata) {
          var ep = convert(sid, rdata);
	  /* Subordinate relations are slightly different, a
	     subordinate typically acts as a client to many services,
	     against the implicitly provided juju-info interface. we
	     explicitly check for a subordinate via the scope
	     parameter of a relation. */
          if (svc.get('subordinate') &&
             rdata.scope === 'container') {
            return requires.push(ep);
          }
          if (db.relations.has_relation_for_endpoint(ep)) {
            return;
          }
          requires.push(ep);
    });

    // Process origin provides endpoints, a bit simpler, as their
    // always one to many.
    Y.each(
      ep_map[sid]['provides'],
      function(pdata) {
        provides.push(convert(sid, pdata));
    });

    // Every non subordinate service implicitly provides this.
    if (!svc.get('subordinate')) {
      provides.push(convert(sid, {'interface': 'juju-info', 'name': 'juju-info'}));
    }

    console.log("Available origin requires", requires, "provides", provides);

    // Now check every other service to see if it can be a valid target.
    db.services.each(function(tgt) {
      var tid = tgt.get('id'),
          tprovides = ep_map[tid]['provides'];
 
      // Ignore ourselves, peer relations are automatically
      // established when a service is deployed. The gui only needs to
      // concern itself with client/server relations.
      if (tid === sid) {
        return;
      }

      console.log(
         "Matching against service", tid,
         "requires", ep_map[tid]['requires'], 
	 "provides", ep_map[tid]['provides']);

      // Process each of the service's required endpoints, its only
      // considered a valid target if its unsatisified by an existing
      // relation.
      Y.each(
          ep_map[tid].requires,
          function(rdata) {
            var ep = convert(tid, rdata);
            // Subordinates are exceptions again as they are a client
            // to many services. We check if a subordinate relation
            // exists between this subordinate endpoint and the origin
            // service.
            if (tgt.get('subordinate') && rdata.scope === 'container') {              
              if (db.relations.has_relation_for_endpoint(ep, sid)) {
                return;
              }
            } else if (db.relations.has_relation_for_endpoint(ep)) {
              return;
            }
	    // If the origin provides it then its a valid target.
            Y.Array.filter(provides, function(oep) {
              if (oep.type === ep.type) {
                add(tid, ep);
              }
            });
          });

      // Check against the implicit interface juju-info, but not for subordinates.
      if (!tgt.get('subordinate')) {
          tprovides.push({'interface': 'juju-info', 'name': 'juju-info'});
      }

      Y.each(
        tprovides,
        function(pdata) {
          var ep = convert(tid, pdata);
          Y.Array.each(requires,
            function(oep) {
              if (oep.type != ep.type || 
                  db.relations.has_relation_for_endpoint(ep, sid)) {
                return;
	      }	    
              add(tid, ep);
          });
      });
    });
    console.timeEnd('Endpoint Match');
    console.groupEnd();
    return targets;
  };
});

