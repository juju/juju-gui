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

  var Y, utils, models, views, View, viewUtils, _addRelationsErrorState;

  var modules = [
    'node-event-simulate',
    'juju-templates',
    'service-relations-view',
    'juju-tests-utils',
    'juju-view-utils',
    'juju-viewlet-manager', // Required for utils.renderViewlet
    'lazy-model-list'
  ];

  before(function(done) {
    Y = YUI(GlobalConfig).use(modules, function(Y) {
      utils = Y.namespace('juju-tests.utils');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      viewUtils = views.utils;
      View = Y.juju.viewlets.Relations;
      _addRelationsErrorState = View.prototype.export._addRelationsErrorState;
      done();
    });
  });

  function ViewletGenerator(config) {
    // Ignore possible strict violation
    /* jshint -W040 */
    this.viewlet = config.viewlet || {};
    this.oldGRDFS = {};
    this.container = {};
    this.model = {};
    this.viewletManager = {};
    this.relationType = config.relationType || 0;
  }
  ViewletGenerator.prototype = {
    setup: function(context, options) {
      this.oldGRDFS = viewUtils.getRelationDataForService;
      var relationType = this.relationType,
          _relationData = this._relationData;
      // Stub out this method to return dummy relation data
      viewUtils.getRelationDataForService = function() {
        return _relationData(relationType);
      };
      this.container = utils.makeContainer(context);
      this.model = new Y.Model({});
      this.viewletManager = utils.renderViewlet(
          this.viewlet, this.model, this.container, options);
      return {
        viewletManager: this.viewletManager
      };
    },

    teardown: function() {
      this.viewletManager.destroy();
      this.model.destroy();
      viewUtils.getRelationDataForService = this.oldGRDFS;
    },

    _relationData: function(key) {
      // So....Many.....Mocks
      var relationData = {
        // no relation
        0: [],
        // single relation
        1: [{
          clientId: 'relation_59',
          id: 'wordpress:db mysql:db',
          relation_id: 'wordpress:db mysql:db',
          endpoints: [
            ['wordpress', {'role': 'client', 'name': 'db'}],
            ['mysql', {'role': 'server', 'name': 'db'}]
          ],
          pending: false,
          scope: 'global',
          display_name: 'db:db',
          'interface': 'mysql',
          near: { 'service': 'wordpress', 'role': 'client', 'name': 'db' },
          far: { 'service': 'mysql', 'role': 'server', 'name': 'db' },
          ident: 'wordpress:db mysql:db'
        }],
        // Double relation
        2: [{
          clientId: 'relation_54',
          id: 'wordpress:db mysql:db',
          relation_id: 'wordpress:db mysql:db',
          endpoints: [
            ['wordpress', {role: 'client', name: 'db' }],
            ['mysql', { role: 'server', name: 'db' }]
          ],
          pending: false,
          scope: 'global',
          display_name: 'db:db',
          'interface': 'mysql',
          near: { 'service': 'wordpress', 'role': 'client', 'name': 'db' },
          far: { 'service': 'mysql', 'role': 'server', 'name': 'db' },
          ident: 'wordpress:db mysql:db'
        }, {
          clientId: 'relation_149',
          id: 'apache2:reverseproxy wordpress:website',
          relation_id: 'apache2:reverseproxy wordpress:website',
          endpoints: [
            ['apache2', { role: 'client', name: 'reverseproxy' }],
            ['wordpress', { role: 'server', name: 'website' }]
          ],
          pending: false,
          scope: 'global',
          display_name: 'reverseproxy:website',
          'interface': 'http',
          near: { service: 'wordpress', role: 'server', name: 'website' },
          far: { service: 'apache2', role: 'client', name: 'reverseproxy' },
          ident: 'apache2:reverseproxy wordpress:website'
        }],
        // Peer relation
        'peer': [{
          'interface': 'reversenginx',
          clientId: 'relation_5',
          id: 'wordpress:loadbalancer',
          relation_id: 'wordpress:loadbalancer',
          endpoints: [
            ['wordpress', { role: 'peer', name: 'loadbalancer' }]
          ],
          pending: false,
          scope: 'global',
          display_name: 'loadbalancer',
          near: { service: 'wordpress', role: 'peer', name: 'loadbalancer' },
          ident: 'wordpress:loadbalancer'
        }],
        // Errored relation
        'error': [{
          clientId: 'relation_54',
          id: 'wordpress:db mysql:db',
          relation_id: 'wordpress:db mysql:db',
          endpoints: [
            ['wordpress', { role: 'client', name: 'db' }],
            ['mysql', { role: 'server', name: 'db' }]
          ],
          pending: false,
          scope: 'global',
          display_name: 'db:db',
          'interface': 'mysql',
          near: { service: 'wordpress', role: 'client', name: 'db' },
          far: { service: 'mysql', role: 'server', name: 'db' },
          ident: 'wordpress:db mysql:db',
          status: 'error',
          units: [{
            id: 'wordpress/69',
            agent_state: 'error',
            clientId: 'serviceUnit_323',
            service: 'wordpress',
            number: 69,
            urlName: 'wordpress-69',
            name: 'serviceUnit',
            displayName: 'wordpress/69',
            charmUrl: 'cs:precise/wordpress-21',
            machine: '71',
            agent_state_info: 'hook failed: \'db-relation-changed\'',
            agent_state_data: {
              hook: 'db-relation-changed',
              'relation-id': 1,
              'remote-unit': 'mysql/0'
            },
            open_ports: [],
            annotations: { 'landscape-computer': '+unit:wordpress-69' }
          }]
        }]
      };
      return relationData[key];
    }
  };

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
    // The relation object does not contain any service or unit objects.
    // The units object is pushed into the relation object for units
    // which are in error only.
    relation.units = units;
    assert.deepEqual(result, [relation]);
  });


  // Requires DOM
  it('shows a "No Relations" message when there are no relations', function() {
    var vg = new ViewletGenerator({
      viewlet: View
    });

    var vm = vg.setup(this).viewletManager;

    assert.equal(
        vm.get('container').one('.view-content').getHTML(),
        'This service doesn\'t have any relations. Build relationships ' +
        'between services and find out about them here.');

    vg.teardown();
  });

  it('shows single relation details', function() {
    var vg = new ViewletGenerator({
      viewlet: View,
      relationType: 1
    });

    var vm = vg.setup(this).viewletManager,
        vmContainer = vm.get('container');

    assert.equal(vmContainer.one('h2').getHTML(), 'Relations');
    assert.equal(vmContainer.one('.relation-label h3').getHTML(), 'mysql');

    var details = vmContainer.all('h4');
    assert.equal(details.item(0).getHTML(), 'Interface: mysql');
    assert.equal(details.item(1).getHTML(), 'Name: db');
    assert.equal(details.item(2).getHTML(), 'Role: client');
    assert.equal(details.item(3).getHTML(), 'Scope: global');

    vg.teardown();
  });

  it('shows multiple relations details', function() {
    var vg = new ViewletGenerator({
      viewlet: View,
      relationType: 2
    });

    var vm = vg.setup(this).viewletManager,
        vmContainer = vm.get('container');

    assert.equal(vmContainer.one('h2').getHTML(), 'Relations');
    var labels = vmContainer.all('.relation-label h3');

    assert.equal(labels.item(0).getHTML(), 'mysql');
    assert.equal(labels.item(1).getHTML(), 'apache2');

    var details = vmContainer.all('h4');
    assert.equal(details.item(0).getHTML(), 'Interface: mysql');
    assert.equal(details.item(1).getHTML(), 'Name: db');
    assert.equal(details.item(2).getHTML(), 'Role: client');
    assert.equal(details.item(3).getHTML(), 'Scope: global');

    assert.equal(details.item(4).getHTML(), 'Interface: http');
    assert.equal(details.item(5).getHTML(), 'Name: website');
    assert.equal(details.item(6).getHTML(), 'Role: server');
    assert.equal(details.item(7).getHTML(), 'Scope: global');

    vg.teardown();
  });

  it('shows peer relation details', function() {
    var vg = new ViewletGenerator({
      viewlet: View,
      relationType: 'peer'
    });

    var vm = vg.setup(this).viewletManager,
        vmContainer = vm.get('container');

    assert.equal(vmContainer.one('h2').getHTML(), 'Relations');
    assert.equal(vmContainer.one('.relation-label h3').getHTML(), 'wordpress');

    var details = vmContainer.all('h4');
    assert.equal(details.item(0).getHTML(), 'Interface: reversenginx');
    assert.equal(details.item(1).getHTML(), 'Name: loadbalancer');
    assert.equal(details.item(2).getHTML(), 'Role: peer');
    assert.equal(details.item(3).getHTML(), 'Scope: global');

    vg.teardown();
  });

  it('shows the units which have relation hooks in error', function() {
    var vg = new ViewletGenerator({
      viewlet: View,
      relationType: 'error'
    });

    var vm = vg.setup(this).viewletManager,
        vmContainer = vm.get('container');

    assert.equal(vmContainer.one('h2').getHTML(), 'Relations');
    // Make sure the error icon is visible
    assert.equal(
        vmContainer.one('.relation-label.error h3').getHTML(), 'mysql');

    var details = vmContainer.all('h4');
    assert.equal(details.item(0).getHTML(), 'Interface: mysql');
    assert.equal(details.item(1).getHTML(), 'Name: db');
    assert.equal(details.item(2).getHTML(), 'Role: client');
    assert.equal(details.item(3).getHTML(), 'Scope: global');

    assert.equal(
        vmContainer.one('.status-unit-content ul li').getHTML(),
        'wordpress/69');

    vg.teardown();
  });

  it('shows a remove relations button when units are in error', function() {
    var vg = new ViewletGenerator({
      viewlet: View,
      relationType: 'error'
    });

    var relationStub = utils.makeStubFunction();
    var getAttrsStub = utils.makeStubFunction('fooRelation');

    var vm = vg.setup(this, {
      db: {
        relations: {
          getById: utils.makeStubFunction({ getAttrs: getAttrsStub }) }},
      topo: {
        modules: {
          RelationModule: {
            removeRelation: relationStub }}}
    }).viewletManager,
        vmContainer = vm.get('container'),
        button = vmContainer.one('button.remove-relation');

    assert.isNotNull(button, 'No remove relation button found');
    assert.equal(button.getData('relation'), 'wordpress:db mysql:db');

    button.simulate('click');
    assert.equal(relationStub.calledOnce(), true);

    vg.teardown();
  });

});
