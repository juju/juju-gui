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

describe('topology bundle module', function() {
  var utils, views, Y, bundleModule;
  var bundle, container, factory, fakebackend;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-topology',
      'juju-view-bundle',
      'charmstore-api',
      'juju-models',
      'juju-tests-utils',
      'juju-tests-factory',
      'node-event-simulate'
    ],
    function(Y) {
      utils = Y.namespace('juju-tests.utils');
      factory = Y.namespace('juju-tests.factory');
      views = Y.namespace('juju.views');
      done();
    });
  });

  afterEach(function() {
    if (bundle) { bundle.destroy(); }
  });

  function promiseBundle(context, options, visableContainer) {
    container = utils.makeContainer(context, 'canvas', true);
    fakebackend = factory.makeFakeBackend();
    fakebackend.db.environment.set('defaultSeries', 'precise');

    options = options || {};
    return fakebackend.promiseImport(
        utils.loadFixture('data/wp-deployer.yaml'),
        'wordpress-prod')
        .then(function() {
          bundle = new views.BundleTopology(Y.mix({
            db: fakebackend.db,
            container: container,
            store: fakebackend.get('store'),
            charmstore: new Y.juju.charmstore.APIv4({})
          }, options)).render();
          bundleModule = bundle.topology.modules.BundleModule;
          bundleModule.set('useTransitions', false);
          return bundle;
        });
  }

  function normalizeTranslate(translateStr) {
    return translateStr.replace(',', ' ');
  }

  it('should create a proper service for each model', function(done) {
    promiseBundle(this)
    .then(function(bundle) {
          // The size of the element should reflect the passed in params
          var selection = d3.select(container.getDOMNode());
          var svg = selection.select('svg');
          assert.equal(svg.attr('width'), 640);
          assert.equal(svg.attr('height'), 480);

          // We should have the two rendered services
          assert.equal(container.all('.service').size(), 2);
          var service = svg.select('.service');

          // Sizing
          assert.equal(service.attr('width'), '96');
          assert.equal(service.attr('height'), '96');
          // Annotations
          assert.equal(normalizeTranslate(service.attr('transform')),
              'translate(115 89)');
          // Ensure that we've exposed one service
          assert.equal(container.all('.exposed-indicator').size(), 1);
          var indicator = selection.select('.exposed-indicator');
          assert.equal(indicator.attr('width'), '32');
          assert.equal(indicator.attr('height'), '32');
          assert.equal(indicator.attr('x'), '64');
          assert.equal(indicator.attr('y'), '64');
          done();
        }).then(undefined, done);
  });


  it('should set pan/zoom to fit the whole view', function(done) {
    promiseBundle(this, {size: [240, 180]})
    .then(function(bundle) {
          var selection = d3.select(container.getDOMNode());
          var svg = selection.select('svg');
          assert.equal(svg.attr('width'), 240);
          assert.equal(svg.attr('height'), 180);

          // The positions within the import are larger than 240,180. Verify
          // that we've scaled the canvas as expected.  In the model.
          assert.equal(
              parseFloat(bundle.topology.get('scale'), 10).toFixed(2),
              0.39);
          // and on the canvas.
          var scaleAttr = svg.select('g').attr('transform');
          var match = /scale\(([\d\.]+)\)/.exec(scaleAttr);
          assert.equal(parseFloat(match[1]).toFixed(2), 0.39);
          done();
        }).then(undefined, done);
  });

  it('show details for selected item', function(done) {
    promiseBundle(this, {size: [240, 180]})
    .then(function(bundle) {
          var service = container.one('.service');
          // Click the service.
          service.simulate('click');

          var details = container.one('.topo-info');
          // Verify the template contains expected details.
          assert.match(details.getHTML(), /cs:precise\/mysql\-51/);
          assert.match(details.getHTML(), /Units: 1/);
          done();
        }).then(undefined, done);
  });


});

