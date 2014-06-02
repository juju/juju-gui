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

(function() {

  describe('unit detail viewlet', function() {
    var db, service, unit, unitDetails, Y, updateAddress, ViewletManager,
        manager;
    var requirements = [
      'juju-models', 'unit-details-view', 'juju-viewlet-manager'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        var models = Y.namespace('juju.models');
        var viewlets = Y.namespace('juju.viewlets');
        updateAddress = viewlets.updateUnitAddress;
        ViewletManager = viewlets.ViewletManager;
        db = new models.Database();
        service = db.services.add({id: 'haproxy'});
        unit = db.addUnits({
          id: 'haproxy/42',
          service: 'haproxy',
          annotations: {'landscape-computer': '+unit:haproxy-42'},
          agent_state: 'peachy',
          agent_state_info: 'keen',
          public_address: 'public-address',
          private_address: 'private-address',
          open_ports: [80, 443]
        });
        unitDetails = new viewlets.UnitDetails();
        done();
      });
    });

    after(function() {
      if (manager) {
        manager.destroy();
      }
    });

    it('correctly generates the viewlet template context', function() {
      var context = unitDetails.getContext(db, service, unit);
      var expectedKeys = ['unit', 'relations'];
      assert.deepEqual(Y.Object.keys(context), expectedKeys);
      assert.deepEqual(context.unit, unit);
    });

    it('mutates a node without an address or ports', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node);
      assert.strictEqual(node.getHTML(), '');
    });

    it('mutates a node without an address', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, null, [80]);
      assert.strictEqual(node.getHTML(), '');
    });

    it('mutates a node with an address', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1');
      assert.strictEqual(node.getHTML(), '10.0.0.1');
    });

    it('mutates a node with an address and non-http[s] port', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', [8080]);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '), '10.0.0.1 | Ports 8080/tcp');
      assert.strictEqual(node.all('a').size(), 1);
      assert.strictEqual(node.one('a').get('href'), 'http://10.0.0.1:8080/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '8080/tcp');
    });

    it('mutates a node with an address and a port/tcp pair', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', ['8080/tcp']);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '), '10.0.0.1 | Ports 8080/tcp');
      assert.strictEqual(node.all('a').size(), 1);
      assert.strictEqual(node.one('a').get('href'), 'http://10.0.0.1:8080/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '8080/tcp');
    });

    it('mutates a node with an address and a port/udp pair', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', ['8080/udp']);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '), '10.0.0.1 | Ports 8080/udp');
      assert.strictEqual(node.all('a').size(), 0);
    });

    it('mutates a node with an address and http port', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', [80]);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '), '10.0.0.1 | Ports 80/tcp');
      assert.strictEqual(node.all('a').size(), 2);
      assert.strictEqual(node.one('a').get('href'), 'http://10.0.0.1/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '10.0.0.1');
    });

    it('mutates a node with an address and https port', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', [443]);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '), '10.0.0.1 | Ports 443/tcp');
      assert.strictEqual(node.all('a').size(), 2);
      assert.strictEqual(node.one('a').get('href'), 'https://10.0.0.1/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '10.0.0.1');
    });

    it('mutates a node with an address and multiple ports', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', [443, 8080]);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '),
          '10.0.0.1 | Ports 443/tcp, 8080/tcp');
      assert.strictEqual(node.all('a').size(), 3);
      assert.strictEqual(node.one('a').get('href'), 'https://10.0.0.1/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '10.0.0.1');
    });

    it('mutates a node with multiple port/protocol pairs', function() {
      var node = Y.Node.create('<span>Delete me</span>');
      updateAddress(node, '10.0.0.1', ['42/tcp', '47/udp']);
      assert.strictEqual(
          node.get('text').replace(/\s/g, ' '),
          '10.0.0.1 | Ports 42/tcp, 47/udp');
      assert.strictEqual(node.all('a').size(), 1);
      assert.strictEqual(node.one('a').get('href'), 'http://10.0.0.1:42/');
      assert.strictEqual(node.one('a').get('target'), '_blank');
      assert.strictEqual(node.one('a').get('text'), '42/tcp');
    });

    it.skip('instantiates correctly when bound', function() {
      db.environment.set('annotations', {
        'landscape-url': 'http://landscape.example.com',
        'landscape-computers': '/computers/criteria/environment:test'
      });
      manager = new ViewletManager(
          { interval: 0,
            enableDatabinding: true,
            template: '<div class="viewlet"></div>',
            container: Y.Node.create(
                '<div><div class="leftSlot"></div>' +
                '<div class="juju-inspector"></div></div>'),
            model: service,
            views: {'unitDetails': unitDetails},
            viewletContainer: '.viewlet',
            db: db
          });
      manager.slots['left-hand-panel'] = '.leftSlot';
      manager.render();
      manager.showViewlet('unitDetails', unit);
      var node = manager.views.unitDetails.get('container');
      assert.strictEqual(
          node.one('[data-bind="displayName"]').get('text'), 'haproxy/42');
      assert.strictEqual(
          node.one('[data-bind="agent_state"]').get('text'), 'peachy');
      assert.strictEqual(
          node.one('[data-bind="agent_state_info"]').get('text'),
          'Status Info: keen');
      assert.strictEqual(
          node.one('[data-bind="public_address"] a').get('text'),
          'public-address');
      assert.strictEqual(
          node.one('[data-bind="private_address"] a').get('text'),
          'private-address');
      assert.strictEqual(
          node.one(
              '[data-bind="annotations.landscape-computer"] a').get('href'),
          'http://landscape.example.com/computers/criteria/environment' +
          ':test+unit:haproxy-42/');
    });

    it('includes the service relations in the template context', function() {
      db.relations.add({
        relation_id: 'haproxy:reverseproxy wordpress:website',
        endpoints: [
          ['haproxy', {role: 'requirer', name: 'reverseproxy'}],
          ['wordpress', {role: 'provider', name: 'website'}]
        ]
      });
      var context = unitDetails.getContext(db, service, unit);
      assert.strictEqual(context.relations.length, 1);
      var relation = context.relations[0];
      var expectedNear = {
        name: 'reverseproxy',
        role: 'requirer',
        service: 'haproxy'
      };
      var expectedFar = {
        name: 'website',
        role: 'provider',
        service: 'wordpress'
      };
      assert.deepEqual(relation.near, expectedNear);
      assert.deepEqual(relation.far, expectedFar);
    });

  });

})();
