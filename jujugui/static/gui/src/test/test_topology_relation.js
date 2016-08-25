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
  var Y, utils, views, view, container, topo, models, relationUtils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-tests-utils', 'juju-topology', 'node', 'relation-utils',
          'node-event-simulate', 'juju-models'],
        function(Y) {
          views = Y.namespace('juju.views');
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
          relationUtils = window.juju.utils.RelationUtils;
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    view = new views.RelationModule({container: container});
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
      update: function() {},
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

  it('gracefully handles errors on creation', function() {
    var stubNotification = utils.makeStubFunction();
    var topo = {
      get: function() {
        return {
          get: function() {
            return {
              relations: {
                remove: function() {},
                getById: function() {}
              },
              notifications: {
                add: stubNotification
              }
            };
          },
          vis: {
            select: function() {
              return {
                remove: function() {}
              };
            }
          },
          update: function() {},
          bindAllD3Events: function() {}
        };
      }
    };
    view._addRelationCallback(topo, 'foo', {err: 'Oh no!'});
    assert.equal(stubNotification.calledOnce(), true,
        'Notification of error not created');
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
      },
      fire: function() {}
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
        requestedSelector, '#' + relationUtils.generateSafeDOMId(relationId));
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

  describe('updateRelationVisibility', function() {
    it('is called on update', function() {
      var updateVis = utils.makeStubMethod(view, 'updateRelationVisibility');
      this._cleanups.push(updateVis.reset);
      var decorate = utils.makeStubMethod(view, 'decorateRelations');
      this._cleanups.push(decorate.reset);
      var update = utils.makeStubMethod(view, 'updateLinks');
      this._cleanups.push(update.reset);
      var updateSubs = utils.makeStubMethod(
          view, 'updateSubordinateRelationsCount');
      this._cleanups.push(updateSubs.reset);
      view.set('component', {
        get: function() {
          return {
            relations: {
              toArray: function() {}
            }
          };
        }});
      view.update.call(view);
      assert.equal(updateVis.callCount(), 1);
    });

    it('categorizes and calls the appropriate vis method', function() {
      var fade = utils.makeStubMethod(view, 'fade');
      var hide = utils.makeStubMethod(view, 'hide');
      var show = utils.makeStubMethod(view, 'show');
      this._cleanups.concat([fade.reset, hide.reset, show.reset]);
      var serviceList = new models.ServiceList();
      serviceList.add([{
        id: 'foo1',
        fade: true
      }, {
        id: 'foo2',
        hide: true
      }, {
        id: 'foo3'
      }, {
        id: 'foo4',
        fade: true,
        hide: true
      }]);
      view.set('component', {
        get: function() {
          return {
            services: serviceList
          };
        }});
      view.updateRelationVisibility();
      assert.equal(fade.callCount(), 1);
      assert.equal(hide.callCount(), 1);
      assert.equal(show.callCount(), 1);
      assert.deepEqual(fade.lastArguments()[0], {
        serviceNames: ['foo1', 'foo4']
      });
      assert.deepEqual(hide.lastArguments()[0], {
        serviceNames: ['foo2', 'foo4']
      });
      assert.deepEqual(show.lastArguments()[0], { serviceNames: ['foo3'] });
    });
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
          relation.get('relation_id'), 'pending-service1service2dbdb');
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

  describe('ambiguousAddRelationCheck', function() {
    var addRelationEnd, getDisplayName, menuStub, relSelect, posMenu;
    function stubThemAll(context) {
      addRelationEnd = utils.makeStubMethod(view, 'addRelationEnd');
      context._cleanups.push(addRelationEnd.reset);
      getDisplayName = utils.makeStubMethod(view, '_getServiceDisplayName');
      context._cleanups.push(getDisplayName.reset);
      menuStub = utils.makeStubMethod(view, '_renderAmbiguousRelationMenu');
      context._cleanups.push(menuStub.reset);
      relSelect = utils.makeStubMethod(view, '_attachAmbiguousReleationSelect');
      context._cleanups.push(relSelect.reset);
      posMenu = utils.makeStubMethod(view, '_positionAmbiguousRelationMenu');
      context._cleanups.push(posMenu.reset);
    }

    it('calls addRelationEnd if relation is not ambiguous', function() {
      stubThemAll(this);
      view.set('addRelationStart_possibleEndpoints', {
        'mysql': [[{
          name: 'db', service: 'wordpress', type: 'mysql'
        }, {
          name: 'db', service: 'mysql', type: 'mysql'
        }]]
      });
      view.ambiguousAddRelationCheck({id: 'mysql'}, view);
      assert.equal(addRelationEnd.callCount(), 1);
      assert.equal(getDisplayName.callCount(), 0);
      assert.equal(menuStub.callCount(), 0);
      assert.equal(relSelect.callCount(), 0);
      assert.equal(posMenu.callCount(), 0);
    });

    it('calls the util methods to show ambiguous select menu', function() {
      stubThemAll(this);
      view.set('addRelationStart_possibleEndpoints', {
        'postgresql': [[{
          service: 'python-django', name: 'pgsql', type: 'pgsql'
        },{
          service: 'postgresql', name: 'db-admin', type: 'pgsql'
        }], [{
          service: 'python-django', name: 'pgsql', type: 'pgsql'
        },{
          service: 'postgresql', name: 'db', type: 'pgsql'
        }], [{
          service: 'python-django',
          name: 'django-settings',
          type: 'directory-path'
        }, {
          service: 'postgresql',
          name: 'persistent-storage',
          type: 'directory-path'
        }]]
      });
      view.ambiguousAddRelationCheck({id: 'postgresql'}, view);
      assert.equal(addRelationEnd.callCount(), 0);
      assert.equal(getDisplayName.callCount(), 1);
      assert.equal(menuStub.callCount(), 1);
      assert.equal(relSelect.callCount(), 1);
      assert.equal(posMenu.callCount(), 1);
      // The endpoints need to be sorted alphabetically
      assert.deepEqual(getDisplayName.lastArguments()[0], [[{
        service: 'python-django', name: 'pgsql', type: 'pgsql'
      },{
        service: 'postgresql', name: 'db-admin', type: 'pgsql'
      }], [{
        service: 'python-django', name: 'pgsql', type: 'pgsql'
      },{
        service: 'postgresql', name: 'db', type: 'pgsql'
      }], [{
        service: 'python-django',
        name: 'django-settings',
        type: 'directory-path'
      },{
        service: 'postgresql',
        name: 'persistent-storage',
        type: 'directory-path'
      }]]);
    });

    it('shows correct name for ghost and deployed services', function() {
      var endpoints = [[{
        name: 'db', service: '97813654$', type: 'mysql'
      }, {
        name: 'db', service: 'mysql', type: 'mysql'
      }]];
      var db = new models.Database();
      db.services.add({
        id: '97813654$',
        displayName: '(wordpress)'
      });
      db.services.add({
        id: 'mysql',
        displayName: 'mysql'
      });
      var topo = {
        get: function() {
          return db;
        }
      };
      var newEndpoints = view._getServiceDisplayName(endpoints, topo);
      assert.deepEqual(newEndpoints, [[{
        name: 'db',
        service: '97813654$',
        type: 'mysql',
        displayName: 'wordpress'
      }, {
        name: 'db', service: 'mysql', type: 'mysql', displayName: 'mysql'
      }]]);
    });

    it('renders the ambiguous relation menu', function() {
      var endpoints = [[{
        name: 'db',
        service: '97813654$',
        type: 'mysql',
        displayName: 'wordpress'
      }, {
        name: 'db', service: 'mysql', type: 'mysql', displayName: 'mysql'
      }], [{
        name: 'db',
        service: '97813654$',
        type: 'mysql',
        displayName: 'wordpress'
      }, {
        name: 'db', service: 'mysql', type: 'mysql', displayName: 'mysql'
      }]];
      container.append(
        '<div id="ambiguous-relation-menu">' +
          '<div id="ambiguous-relation-menu-content"></div>' +
        '</div>');
      var menu = view._renderAmbiguousRelationMenu.call({
        get: function() {
          return container;
        }
      }, endpoints);
      assert.isNotNull(menu.one('.menu'));
      assert.equal(menu.all('li').size(), 2);
    });

    it('attaches the click events for the menu', function() {
      var delegate = utils.makeStubFunction();
      var on = utils.makeStubFunction();
      var menu = {
        one: function() {
          return {
            delegate: delegate,
            on: on
          };
        }
      };
      view._attachAmbiguousReleationSelect(menu);
      assert.equal(delegate.callCount(), 1);
      assert.equal(on.callCount(), 1);
    });

    it('calls to position the menu to the terminating endpoint', function() {
      var setStyle = utils.makeStubFunction();
      var addClass = utils.makeStubFunction();
      var set = utils.makeStubFunction();
      var menu = {
        setStyle: setStyle,
        addClass: addClass
      };
      var topo = {
        zoom: {
          translate: utils.makeStubFunction('translate'),
          scale: utils.makeStubFunction('scale')
        },
        set: set,
        fire: utils.makeStubFunction()
      };
      var locate = utils.makeStubMethod(
          Y.juju.topology.utils, 'locateRelativePointOnCanvas',
          ['locate1', 'locate2']);
      this._cleanups.push(locate.reset);

      view._positionAmbiguousRelationMenu(menu, topo, 'm', 'context');

      assert.equal(locate.callCount(), 1, 'locateRelativePointOnCanvas');
      assert.deepEqual(locate.lastArguments(), ['m', 'translate', 'scale']);
      assert.equal(setStyle.callCount(), 2);
      assert.deepEqual(setStyle.allArguments(), [
        ['left', 'locate1'],
        ['top', 'locate2']
      ]);
      assert.equal(addClass.callCount(), 1, 'addClass');
      assert.equal(addClass.lastArguments()[0], 'active');
      assert.equal(set.callCount(), 2);
      assert.deepEqual(set.allArguments(), [
        ['active_service', 'm'],
        ['active_context', 'context']
      ]);
      assert.equal(topo.fire.callCount(), 1, 'fire');
      assert.equal(topo.fire.lastArguments()[0], 'resized');
    });
  });

});
