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

describe('topology', function() {
  var NS, TestModule, container, db, factory, modA, models, state, topo,
      utils, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-topology',
                               'd3-components',
                               'juju-tests-factory',
                               'juju-view-bundle',
                               'node',
                               'node-event-simulate'],
    function(Y) {
      NS = Y.namespace('d3');
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = window.jujuTestUtils.utils;
      factory = Y.namespace('juju-tests.factory');

      TestModule = Y.Base.create('TestModule', NS.Module, [], {
        events: {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          yui: {
            cancel: 'cancelHandler'
          }
        },

        decorateThing: function(evt) {
          state.thing = 'decorated';
        },

        targetTarget: function(evt) {
          state.targeted = true;
        },

        cancelHandler: function(evt) {
          state.cancelled = true;
        }
      });

      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    container.append(Y.Node.create('<button/>')
             .addClass('thing'))
             .append(Y.Node.create('<button/>')
             .addClass('target'));
    state = {};
  });

  afterEach(function() {
    if (topo) {
      topo.unbind();
    }
    if (db) {
      db.destroy();
    }
  });

  it('should be able to create a topology with default modules', function() {
    topo = new views.Topology();
    topo.setAttrs({container: container});
    topo.addModule(TestModule);
    topo.render();

    // Verify that we have built the default scene.
    Y.Lang.isValue(topo.vis).should.equal(true);
  });

  function createStandardTopo() {
    db = new models.Database();
    topo = new views.Topology();
    topo.setAttrs({container: container, db: db});
    topo.addModule(views.ServiceModule);
    topo.addModule(views.RelationModule);
    topo.addModule(views.PanZoomModule);
    topo.addModule(views.ViewportModule);
    return topo;
  }

  it('should be able to create a topology with standard env view modules',
     function() {
       topo = createStandardTopo();
       topo.render();
       // Verify that we have built the default scene.
       Y.Lang.isValue(topo.vis).should.equal(true);
     });

  it('should be able to create a bundle display topology', function(done) {
    container.destroy(true);
    container = utils.makeContainer(this);

    utils.promiseImport(
        'data/wp-deployer.yaml',
        'wordpress-prod',
        factory.makeFakeBackend()
    ).then(function(resolve) {
      // Init the topo with the db at this point and ...
      var fakebackend = resolve.backend;
      var bundle = new views.BundleTopology({
        container: container,
        size: [320, 240],
        db: fakebackend.db,
        store: fakebackend.get('store'),
        charmstore: {
          getIconPath: function() {}
        }}).render();

      // The size of the element should reflect the passed in params
      var svg = d3.select(container.getDOMNode()).select('svg');
      assert.equal(svg.attr('width'), 320);
      assert.equal(svg.attr('height'), 240);

      // We should have the two rendered services
      assert.equal(container.all('.service').size(), 2);
      // and the one relation between them
      assert.equal(container.all('.relation').size(), 1);

      bundle.destroy();
      done();
    }).then(undefined, done);
  });

  describe('servicePointOutside', function() {
    var padding = 200;

    beforeEach(function() {
      topo = new views.Topology();
      topo.setAttrs({container: container, servicePadding: padding});
    });

    it('calculates the proper coordinates with no services', function() {
      var coords = topo.servicePointOutside();
      assert.deepEqual(coords, [padding, padding]);
    });

    it('calculates the proper coordinates with services', function() {
      topo.service_boxes = [{x: 10, y: 20, center: [5, 10]}];
      var coords = topo.servicePointOutside();
      assert.deepEqual(coords, [padding + 5, 10]);
    });

    it('calculates the coordinates including the given coords', function() {
      var coords = topo.servicePointOutside([[150, 20]]);
      assert.deepEqual(coords, [padding + 150, 20]);
    });

  });

});
