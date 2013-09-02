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

describe('bundle module', function() {
  var db, juju, models, utils, views, Y, bundleModule;
  var bundle, container, fakeStore;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-topology',
      'juju-view-bundle',
      'juju-charm-store',
      'juju-models',
      'juju-tests-utils'
    ],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer();
    db = new models.Database();
  });

  afterEach(function() {
    if (container) { container.remove(true); }
    if (bundle) { bundle.destroy(); }

  });

  function promiseBundle() {
    db.environment.set('defaultSeries', 'precise');
    var fakeStore = utils.makeFakeStore(db.charms);
    fakeStore.iconpath = function() { return 'fake.svg'; };

    return db.importDeployer(
        jsyaml.safeLoad(utils.loadFixture('data/wp-deployer.yaml')),
        fakeStore, {useGhost: true, targetBundle: 'wordpress-prod'})
        .then(function() {
          bundle = new views.BundleTopology({
            db: db,
            container: container,
            store: fakeStore
          }).render();
          bundleModule = bundle.topology.modules.BundleModule;
          bundleModule.set('useTransitions', false);
          return bundle;
        });
  }

  it('should create a proper service for each model', function(done) {
    promiseBundle()
    .then(function(bundle) {
          // The size of the element should reflect the passed in params
          var selection = d3.select(container.getDOMNode());
          var svg = selection.select('svg');
          assert.equal(svg.attr('width'), 640);
          assert.equal(svg.attr('height'), 480);

          // We should have the two rendered services
          assert.equal(container.all('.service').size(), 2);
          assert.deepEqual(container.all('tspan.name').get('text'), [
            'mysql', 'wordpress']);
          var service = svg.select('.service');

          // Sizing
          assert.equal(service.attr('width'), '96');
          assert.equal(service.attr('height'), '96');
          // Annotations
          assert.equal(service.attr('transform'), 'translate(115,89)');
          // Ensure that we've exposed one service
          assert.equal(container.all('.exposed-indicator').size(), 1);
          var indicator = selection.select('.exposed-indicator');
          assert.equal(indicator.attr('width'), '32');
          assert.equal(indicator.attr('height'), '32');
          assert.equal(indicator.attr('x'), '64');
          assert.equal(indicator.attr('y'), '64');

          container.remove(true);
          bundle.destroy();
          done();
        }).then(undefined, done);
  });

});

