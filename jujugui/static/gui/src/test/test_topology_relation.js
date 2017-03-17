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
      ['juju-tests-utils', 'juju-topology', 'node', 'relation-utils',
        'node-event-simulate', 'juju-models'],
        function(Y) {
          views = Y.namespace('juju.views');
          utils = Y.namespace('juju-tests.utils');
          models = Y.namespace('juju.models');
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

  it('has a list of relations', function() {
    assert.deepEqual(view.relations, []);
  });

  it('has a chainable render function', function() {
    assert.equal(view.render(), view);
  });

  it('has a rerender method which removes and updates relations', function() {
    var stubRemove = sinon.stub();
    var topo = {
      vis: {
        selectAll: function() {
          return { remove: stubRemove };
        }
      }
    };
    view.set('component', topo);
    var stubUpdate = sinon.stub(view, 'update');
    this._cleanups.push(stubUpdate.restore);
    view.rerender();
    assert.equal(stubRemove.calledOnce, true, 'Remove was not called');
    assert.equal(stubUpdate.calledOnce, true, 'Update was not called');
  });

  it('fires "changeState" topo event for clicking a relation endpoint',
      function() {
        const state = {
          changeState: sinon.stub()
        };
        var topo = {
          get: sinon.stub().withArgs('state').returns(state)
        };
        view.set('component', topo);
        view.inspectRelationClick.call(container, undefined, view);
        assert.equal(state.changeState.callCount, 1);
        assert.deepEqual(state.changeState.args[0][0], {
          gui: {
            inspector: { id: container.get('text').split(':')[0].trim() }
          }});
      });

  describe('updateRelationVisibility', function() {
    it('is called on update', function() {
      var updateVis = sinon.stub(view, 'updateRelationVisibility');
      this._cleanups.push(updateVis.restore);
      var decorate = sinon.stub(view, 'decorateRelations');
      this._cleanups.push(decorate.restore);
      var update = sinon.stub(view, 'updateLinks');
      this._cleanups.push(update.restore);
      var updateSubs = sinon.stub(
          view, 'updateSubordinateRelationsCount');
      this._cleanups.push(updateSubs.restore);
      view.set('component', {
        get: function() {
          return {
            relations: {
              toArray: function() {}
            }
          };
        }});
      view.update.call(view);
      assert.equal(updateVis.callCount, 1);
    });

    it('categorizes and calls the appropriate vis method', function() {
      var fade = sinon.stub(view, 'fade');
      var hide = sinon.stub(view, 'hide');
      var show = sinon.stub(view, 'show');
      this._cleanups.concat([fade.restore, hide.restore, show.restore]);
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
      assert.equal(fade.callCount, 1);
      assert.equal(hide.callCount, 1);
      assert.equal(show.callCount, 1);
      assert.deepEqual(fade.lastCall.args[0], {
        serviceNames: ['foo1', 'foo4']
      });
      assert.deepEqual(hide.lastCall.args[0], {
        serviceNames: ['foo2', 'foo4']
      });
      assert.deepEqual(show.lastCall.args[0], { serviceNames: ['foo3'] });
    });
  });

  describe('ambiguousAddRelationCheck', function() {
    var addRelationEnd, getDisplayName, menuStub, relSelect, posMenu;
    function stubThemAll(context) {
      addRelationEnd = sinon.stub(view, 'addRelationEnd');
      context._cleanups.push(addRelationEnd.restore);
      getDisplayName = sinon.stub(view, '_getServiceDisplayName');
      context._cleanups.push(getDisplayName.restore);
      menuStub = sinon.stub(view, '_renderAmbiguousRelationMenu');
      context._cleanups.push(menuStub.restore);
      relSelect = sinon.stub(view, '_attachAmbiguousReleationSelect');
      context._cleanups.push(relSelect.restore);
      posMenu = sinon.stub(view, '_positionAmbiguousRelationMenu');
      context._cleanups.push(posMenu.restore);
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
      assert.equal(addRelationEnd.callCount, 1);
      assert.equal(getDisplayName.callCount, 0);
      assert.equal(menuStub.callCount, 0);
      assert.equal(relSelect.callCount, 0);
      assert.equal(posMenu.callCount, 0);
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
      assert.equal(addRelationEnd.callCount, 0);
      assert.equal(getDisplayName.callCount, 1);
      assert.equal(menuStub.callCount, 1);
      assert.equal(relSelect.callCount, 1);
      assert.equal(posMenu.callCount, 1);
      // The endpoints need to be sorted alphabetically
      assert.deepEqual(getDisplayName.lastCall.args[0], [[{
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
      var delegate = sinon.stub();
      var on = sinon.stub();
      var menu = {
        one: function() {
          return {
            delegate: delegate,
            on: on
          };
        }
      };
      view._attachAmbiguousReleationSelect(menu);
      assert.equal(delegate.callCount, 1);
      assert.equal(on.callCount, 1);
    });

    it('calls to position the menu to the terminating endpoint', function() {
      var setStyle = sinon.stub();
      var addClass = sinon.stub();
      var set = sinon.stub();
      var menu = {
        setStyle: setStyle,
        addClass: addClass
      };
      var topo = {
        zoom: {
          translate: sinon.stub().returns('translate'),
          scale: sinon.stub().returns('scale')
        },
        set: set,
        fire: sinon.stub()
      };
      var locate = sinon.stub(
          Y.juju.topology.utils, 'locateRelativePointOnCanvas').returns(
          ['locate1', 'locate2']);
      this._cleanups.push(locate.restore);

      view._positionAmbiguousRelationMenu(menu, topo, 'm', 'context');

      assert.equal(locate.callCount, 1, 'locateRelativePointOnCanvas');
      assert.deepEqual(locate.lastCall.args, ['m', 'translate', 'scale']);
      assert.equal(setStyle.callCount, 2);
      assert.deepEqual(setStyle.args, [
        ['left', 'locate1'],
        ['top', 'locate2']
      ]);
      assert.equal(addClass.callCount, 1, 'addClass');
      assert.equal(addClass.lastCall.args[0], 'active');
      assert.equal(set.callCount, 2);
      assert.deepEqual(set.args, [
        ['active_service', 'm'],
        ['active_context', 'context']
      ]);
      assert.equal(topo.fire.callCount, 1, 'fire');
      assert.equal(topo.fire.lastCall.args[0], 'resized');
    });
  });

});
