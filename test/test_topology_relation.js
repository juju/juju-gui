/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012  Canonical Ltd.
Copyright (C) 2013  Canonical Ltd.

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
  var Y, utils, views, view, container, topo, db;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['juju-tests-utils', 'juju-topology', 'node',
          'node-event-simulate', 'juju-view-utils'],
        function(Y) {
          views = Y.namespace('juju.views');
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer();
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
    var topo = {
      fire: function(eventName) {
        firedEventName = eventName;
      }
    };
    view.set('component', topo);
    view.draglineClicked(undefined, view);
    assert.equal(firedEventName, 'clearState');
  });

  it('has a list of relations', function() {
    assert.deepEqual(view.relations, []);
  });

  it('has a chainable render function', function() {
    assert.equal(view.render(), view);
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

});
