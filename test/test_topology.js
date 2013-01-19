'use strict';

describe('topology', function() {
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
    container = Y.Node.create('<div/>')
                 .setStyle('visibility', 'hidden')
                 .append(Y.Node.create('<button/>')
                 .addClass('thing'))
                 .append(Y.Node.create('<button/>')
                 .addClass('target'));
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
    Y.Lang.isValue(topo.vis).should.equal(true);
  });

  function createStandardTopo() {
    db = new models.Database();
    topo = new views.Topology();
    topo.setAttrs({container: container, db: db});
    topo.addModule(views.ServiceModule);
    topo.addModule(views.RelationModule);
    topo.addModule(views.PanZoomModule);
    topo.addModule(views.ViewportModule);
    return topo;
  }

  it('should be able to create a topology with standard env view modules',
     function() {
       topo = createStandardTopo();
       topo.render();
       // Verify that we have built the default scene.
       Y.Lang.isValue(topo.vis).should.equal(true);
     });

  it('should prevent the Juju GUI service from being destroyed', function() {
    var service = {
      charm: 'cs:precise/juju-gui-7'
    };
    var fauxTopo = {
      get: function() {
        return null;
      },
      serviceForBox: function() {
        return service;
      }
    };
    // The context is used to do the destroying, so if it does not have the
    // destroy method, an exception will be raised if the service would be
    // destroyed.
    var context = {
      get: function(name) {
        if (name === 'component') {
          return fauxTopo;
        }
      },
      service_click_actions: {
        toggleControlPanel: function() {},
        destroyServiceConfirm: function() {}
      }
    };
    topo.modules.ServiceModule.destroyServiceClick(undefined, context);
  });
});

describe('service menu', function() {
  var Y, views;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-topology'], function(Y) {
      views = Y.namespace('juju.views');
      done();
    });
  });

  it('should disable the "Destroy" menu for the Juju GUI service', function() {
    var service = {
      charm: 'cs:precise/juju-gui-7'
    };
    var addedClassName;
    var menu = {
      hasClass: function() {
        return false;
      },
      addClass: function() {},
      one: function() {
        return {
          addClass: function(className) {
            addedClassName = className;
          }
        };
      }
    };
    var fauxView = {
      get: function(name) {
        if (name === 'container') {
          return {one: function() { return menu; }};
        } else if (name === 'component') {
          return {set: function() {}};
        }
      },
      updateServiceMenuLocation: function() {}
    };
    var view = new views.ServiceModule();
    view.service_click_actions.toggleControlPanel(
        service, fauxView, undefined);
    assert.equal(addedClassName, 'disabled');
  });

});
