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

describe('topology relation module', function() {
  var Y, utils, views, view, container, topo, models;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-tests-utils', 'juju-topology', 'node',
          'node-event-simulate', 'juju-view-utils', 'juju-models'],
        function(Y) {
          views = Y.namespace('juju.views');
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    view = new views.RelationModule();
  });

  afterEach(function() {
    if (topo) {
      topo.unbind();
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
    var topo = {
      fire: function(eventName) {
        firedEventName = eventName;
      }
    };
    view.set('component', topo);
    view.draglineClicked(undefined, view);
    assert.equal(firedEventName, 'clearState');
  });

  it('fires \'addRelationStart\' event when making a relation', function() {
    var flags = {
      hideServiceMenu: 0,
      addRelationStart: 0
    };
    var topo = {
      fire: function(e) {
        flags[e] = 1;
      },
      // stubs
      get: function(val) {
        if (val === 'container') {
          return {
            one: function() {
              return {
                hasClass: function() { return false; }
              };
            }
          };
        }
      }
    };
    // stubs
    var context = {
      get: function(val) {
        if (val === 'component') { return topo; }
        if (val === 'container') {
          return {
            one: function() {
              return {
                hasClass: function() { return false; },
                getDOMNode: function() { return; }
              };
            }
          };
        }
      },
      addRelationDragStart: function() { return; },
      mousemove: function() { return; },
      addRelationStart: function() { return; }
    };
    view.addRelButtonClicked(null, context);
    assert.deepEqual(flags, {
      hideServiceMenu: 1,
      addRelationStart: 1
    });
  });

  it('fires \'addRelationEnd\' event when done making a relation', function() {
    var counter = 0;
    var topo = {
      fire: function(e) {
        // Other events are fired along side this which we do not care about
        if (e !== 'addRelationEnd') { return; }
        assert.equal(e, 'addRelationEnd');
        counter += 1;
      },
      // stubs
      get: function(val) { return true; },
      vis: {
        selectAll: function() {
          return {
            classed: function() { return; }
          };
        }
      }
    };
    // stubs
    var context = {
      get: function(val) {
        if (val === 'component') { return topo; }
        return true;
      },
      set: function() { return; },
      ambiguousAddRelationCheck: function() { return; }
    };
    view.addRelationDragEnd.call(context);
    view.cancelRelationBuild.call(context);
    assert.equal(counter, 2, 'Event should be fired if a relation line is ' +
        'canceled or completed');
  });

  it('has a list of relations', function() {
    assert.deepEqual(view.relations, []);
  });

  it('has a chainable render function', function() {
    assert.equal(view.render(), view);
  });

  it('has a rerender method which removes and updates relations', function() {
    var stubRemove = utils.makeStubFunction();
    var topo = {
      vis: {
        selectAll: function() {
          return { remove: stubRemove };
        }
      }
    };
    view.set('component', topo);
    var stubUpdate = utils.makeStubMethod(view, 'update');
    this._cleanups.push(stubUpdate.reset);
    view.rerender();
    assert.equal(stubRemove.calledOnce(), true, 'Remove was not called');
    assert.equal(stubUpdate.calledOnce(), true, 'Update was not called');
  });

  it('retrieves the current relation DOM element when removing', function() {
    var requestedSelector;
    var container = {
      one: function(selector) {
        requestedSelector = selector;
      }
    };
    var env = {
      remove_relation: function() {}
    };
    var topo = {
      get: function() {
        return env;
      }
    };
    var fauxView = {
      get: function(name) {
        if (name === 'component') {
          return topo;
        } else if (name === 'container') {
          return container;
        }
      }
    };
    var relationId = 'the ID of this relation';
    var relation = {
      relation_id: relationId,
      endpoints: [null, null]
    };
    view.removeRelation.call(fauxView, relation, fauxView, undefined);
    assert.equal(
        requestedSelector, '#' + views.utils.generateSafeDOMId(relationId));
  });

  it('fires "changeState" topo event for clicking a relation endpoint',
      function() {
        var topo = {
          fire: utils.makeStubFunction()
        };
        view.set('component', topo);
        view.inspectRelationClick.call(container, undefined, view);
        assert.equal(topo.fire.lastArguments()[0], 'changeState');
        assert.deepEqual(topo.fire.lastArguments()[1], {
          sectionA: {
            component: 'inspector',
            metadata: { id: container.get('text').split(':')[0].trim() }
          }});
      });

  describe('_addPendingRelation', function() {
    var db, endpoints, mockAddRelation1, mockAddRelation2, models;

    before(function() {
      models = Y.namespace('juju.models');
    });

    beforeEach(function() {
      // Create a mock topology object.
      mockAddRelation1 = utils.makeStubFunction();
      mockAddRelation2 = utils.makeStubFunction();
      var service1 = {relations: {add: mockAddRelation1}};
      var service2 = {relations: {add: mockAddRelation2}};
      db = new models.Database();
      db.services.add({
        id: 'service1',
        charm: 'cs:precise/wordpress-0'
      });
      db.services.add({
        id: 'service2',
        charm: 'cs:precise/mysql-0'
      });
      db.charms.add({
        id: 'cs:precise/wordpress-0',
        provides: {
          website: {
            interface: 'http' }
        },
        requires: {
          cache: {
            interface: 'memcache' },
          db: {
            interface: 'mysql' },
          nfs: {
            interface: 'mount' }
        }
      });
      db.charms.add({
        id: 'cs:precise/mysql-0',
        requires: {
          ceph: {
            interface: 'ceph-client' }
        },
        provides: {
          db: {
            interface: 'mysql' }
        }
      });
      var topo = {
        get: utils.makeStubFunction(db),
        service_boxes: {service1: service1, service2: service2}
      };
      view.set('component', topo);
      // Create the endpoints.
      endpoints = [
        ['service1', { name: 'db', role: 'server' }],
        ['service2', { name: 'db', role: 'client' }]
      ];
    });

    afterEach(function() {
      db.destroy();
    });

    // Ensure the given relation includes the expected fields.
    var assertRelation = function(relation) {
      assert.strictEqual(
          relation.get('relation_id'), 'pending-service1service2');
      assert.strictEqual(relation.get('display_name'), 'pending');
      assert.deepEqual(relation.get('endpoints'), endpoints);
      assert.strictEqual(relation.get('pending'), true);
    };

    it('adds the pending relation to the database', function() {
      view._addPendingRelation(endpoints);
      assert.strictEqual(db.relations.size(), 1);
      assertRelation(db.relations.item(0));
    });

    it('adds the pending relation to the services', function() {
      view._addPendingRelation(endpoints);
      // The relation has been added to the first service.
      assert.strictEqual(mockAddRelation1.callCount(), 1);
      assertRelation(mockAddRelation1.lastArguments()[0]);
      // The relation has been added to the second service.
      assert.strictEqual(mockAddRelation2.callCount(), 1);
      assertRelation(mockAddRelation2.lastArguments()[0]);
    });

    it('returns the newly created relation object', function() {
      var relation = view._addPendingRelation(endpoints);
      assertRelation(relation);
    });

  });

});
