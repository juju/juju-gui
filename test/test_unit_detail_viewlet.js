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
    var db, service, unit, unitDetails, Y;
    var requirements = ['juju-models', 'viewlet-unit-details'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        var models = Y.namespace('juju.models');
        var viewlets = Y.namespace('juju.viewlets');
        db = new models.Database();
        service = db.services.add({id: 'haproxy'});
        unit = db.units.add({
          id: 'haproxy/42',
          annotations: {'landscape-computer': '+unit:haproxy-42'},
          public_address: 'public-address',
          private_address: 'private-address',
          open_ports: [80, 443]
        });
        unitDetails = viewlets.unitDetails;
        done();
      });
    });

    it('correctly generates the viewlet template context', function() {
      var context = unitDetails.getContext(db, service, unit);
      var expectedKeys = [
        'unit', 'unitIPDescription', 'relations', 'landscapeURL'];
      assert.deepEqual(Y.Object.keys(context), expectedKeys);
    });

    it('includes the unit in the template context', function() {
      var context = unitDetails.getContext(db, service, unit);
      assert.deepEqual(context.unit, unit);
    });

    it('includes the unit description in the template context', function() {
      var context = unitDetails.getContext(db, service, unit);
      assert.equal(
          context.unitIPDescription,
          'public-address | private-address | 80, 443'
      );
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

    it('includes the unit Landscape URL in the template context', function() {
      db.environment.set('annotations', {
        'landscape-url': 'http://landscape.example.com',
        'landscape-computers': '/computers/criteria/environment:test'
      });
      var context = unitDetails.getContext(db, service, unit);
      assert.deepEqual(
          context.landscapeURL,
          'http://landscape.example.com/computers/criteria/environment' +
          ':test+unit:haproxy-42/'
      );
    });

  });

})();
