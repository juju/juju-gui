'use strict';

YUI.add('juju-endpoints', function(Y) {

  var models = Y.namespace('juju.models');
  models.getEndpoints = function(svc, ep_map, db) {
    var targets = [],
        requires = [],
        provides = [],
        sid = svc.get('id');

    console.group("Endpoints for", sid);
    console.time("Endpoint Match");

    function epic(svcName, relInfo) {
      return {service: svcName,
        name: relInfo.name,
        type: relInfo['interface']};
    }

    Y.each(
        ep_map[sid]['requires'],
        function(rdata) {
          var ep = epic(sid, rdata);
          if (svc.get('subordinate') &&
             rdata.scope === 'container') {
             return requires.push(ep);
          }
          if (db.relations.has_relation_for_endpoint(ep)) {
            return;
          }
          requires.push(ep);
        });

    Y.each(
        ep_map[sid]['provides'],
        function(pdata) {
          provides.push(epic(sid, pdata));
        });

    // Every non subordinate implicitly provides this.
      if (!svc.get('subordinate')) {
      provides.push(epic(sid, {'interface': 'juju-info', 'name': 'juju-info'}));
    }

    console.log("Available requires", requires, "provides", provides);

    db.services.each(function(tgt) {
      var tid = tgt.get('id');
      if (tid === sid) {
        return;
      }

      console.log(
         'Matching against service', tid,
         ep_map[tid]['requires'], ep_map[tid]['provides']);

      Y.each(
          ep_map[tid]['requires'],
          function(rdata) {
            var ep = epic(tid, rdata);
            //console.log(" checking required", ep);

            // This block is handling a strange case, that probably
            // never happens. A subordinate relation where the
            // subordinate provides to the container.
            if (tgt.get('subordinate') && rdata.scope === 'container') {
              // TODO: sid isn't used by the has_relation implementation
              if (db.relations.has_relation_for_endpoint(ep, sid)) {
                return;
              }
              return targets.push(ep);
            }

            if (db.relations.has_relation_for_endpoint(ep)) {
              return;
            }

            Y.Array.each(provides, function(oep) {
              if (oep.type === ep.type) {
                targets.push(ep);
              }
            });
       });

       Y.each(
         ep_map[tid]['provides'],
         function(pdata) {
           var ep = epic(tid, pdata);
           //console.log(" checking provided", ep);
           Y.Array.each(requires,
             function(oep) {
               if (oep.type === ep.type) {
                 targets.push(ep);
               }
           });
       });

       // Check if we're a subordinate matching to other services.
       // TODO: Think through again with more sleep.
       // TODO: we need to match on name for ep, else we'll end up not allowing
       //       more than one subordinate relation.
       var ep = epic(tid, {'interface': 'juju-info', 'name': 'juju-info'});
       Y.Array.each(requires,
         function(oep) {
           if (oep.type === ep.type) {
             // Filter existing subordinates
             if (db.relations.has_relation_for_endpoint(ep, sid)) {
                return;
             }
             targets.push(ep);
           }
       });

    });
    console.timeEnd("Endpoint Match");
    console.groupEnd();
    return targets;
  }
});

