'use strict';

describe('topology relation module', function() {
  var Y, views, view, container, topo, db;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-topology', 'node', 'node-event-simulate'],
        function(Y) {
          views = Y.namespace('juju.views');
          done();
        });
  });

  beforeEach(function() {
    container = Y.Node.create('<div/>')
      .setStyle('visibility', 'hidden');
    view = new views.RelationModule();
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

  it('exposes events', function() {
    // The RelationModule's events are wired into the topology view by
    // addModule.  Three types of events are supported: "scene", "yui", and
    // "d3".
    assert.deepProperty(view, 'events.scene');
    assert.deepProperty(view, 'events.yui');
    assert.deepProperty(view, 'events.d3');
  });

  it('fires a "clearState" event if a drag line is clicked', function() {
    var firedEventName;
    var fauxTopo = {
      fire: function(eventName) {
        firedEventName = eventName;
      }
    };
    view.set('component', fauxTopo);
    view.draglineClicked(undefined, view);
    assert.equal(firedEventName, 'clearState');
  });

  it('has a list of relations', function() {
    assert.deepEqual(view.relations, []);
  });

  it('has a chainable render function', function() {
    assert.equal(view.render(), view);
  });

});
