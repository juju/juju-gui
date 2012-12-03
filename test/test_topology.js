
'use strict';

describe.only('topology', function() {
  var Y, NS, views,
      TestModule, modA, state,
      container, topo,
      models,
      db;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-topology',
                               'd3-components',
                               'node',
                               'node-event-simulate'],
    function(Y) {
      NS = Y.namespace('d3');
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');

      TestModule = Y.Base.create('TestModule', NS.Module, [], {
        events: {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          yui: {
            cancel: 'cancelHandler'
          }
        },

        decorateThing: function(evt) {
          state.thing = 'decorated';
        },

        targetTarget: function(evt) {
          state.targeted = true;
        },

        cancelHandler: function(evt) {
          state.cancelled = true;
        }
      });

      done();
    });
  });

  beforeEach(function() {
    container = Y.Node.create('<div id="test" style="visibility: hidden">' +
                              '<button class="thing"></button>' +
                              '<button class="target"></button>' +
                              '</div>');
    state = {};
  });

  afterEach(function() {
    container.remove();
    container.destroy();
    if (topo) {
      topo.unbind();
    }
    if (db) {
      db.destroy();
    }
  });

  it('should be able to create a topology with default modules', function() {
    topo = new views.Topology();
    topo.setAttrs({container: container});
    topo.addModule(TestModule);
    topo.render();

    // Verify that we have built the default scene.
    Y.Lang.isValue(topo.svg).should.equal(true);
  });

  function createStandardTopo() {
    db = new models.Database();
    topo = new views.Topology();
    topo.setAttrs({container: container, db: db});
    topo.addModule(views.MegaModule);
    return topo;
  }

  it('should be able to create a topology with standard env view modules',
     function() {
       topo = createStandardTopo();
       topo.render();
       // Verify that we have built the default scene.
       Y.Lang.isValue(topo.svg).should.equal(true);
     });

});


