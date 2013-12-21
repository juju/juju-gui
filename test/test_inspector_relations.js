/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

describe('Inspector Relations Tab', function() {

  var Y, utils, models, views, viewlet, _addRelationsErrorState;

  var modules = [
    'juju-templates',
    'viewlet-service-relations',
    'lazy-model-list'
  ];

  before(function(done) {
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      viewlet = Y.namespace('juju.viewlets.relations');
      _addRelationsErrorState = viewlet.export._addRelationsErrorState;
      done();
    });
  });

  // Unit tests
  it('does not add status if no units are in relation error', function() {
    var relation = {};
    var result = _addRelationsErrorState(relation, {});
    // If there are no errors provided to this method then it
    // should not modify the data passed into it.
    assert.deepEqual(result, relation);
  });

  it('adds relation error data to relation', function() {
    // stubs
    var relation = { far: { service: 'mysql' } };
    var error = { wordpress: 'db-relation-changed' };
    var units = new Y.LazyModelList({
      items: [{
        id: 'wordpress/0',
        agent_state: 'error',
        agent_state_data: { hook: 'db-relation-changed' }
      }]
    });
    var service = {
      get: function() { // returning the units
        return units;
      }
    };

    var result = _addRelationsErrorState([relation], error, service);
    // modify to compare
    relation.status = 'error';
    relation.units = units;
    assert.deepEqual(result, [relation]);
  });

});
