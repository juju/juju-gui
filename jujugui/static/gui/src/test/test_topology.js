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
  var NS, TestModule, container, db, models, state, topo,
      utils, views, viewUtils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-topology',
                               'd3-components',
                               'juju-tests-utils',
                               'juju-view-utils',
                               'node',
                               'node-event-simulate'],
    function(Y) {
      NS = Y.namespace('d3-components');
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      viewUtils = Y.namespace('juju.views.utils');

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
    viewUtils.isValue(topo.vis).should.equal(true);
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
       viewUtils.isValue(topo.vis).should.equal(true);
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

  describe('annotateBoxPosition', function() {
    var annotations, update_annotations;

    beforeEach(function() {
      update_annotations = sinon.stub();
      var env = {
        update_annotations: update_annotations
      };
      annotations = {};
      var db = {
        services: {
          getById: function() {
            return {
              get: function() {
                return annotations;
              },
              set: function(_, newAnnotations) {
                annotations = newAnnotations;
              }
            };
          }
        }
      };
      topo = new views.Topology({
        db: db,
        env: env
      });
    });

    it('updates annotations on pending services', function() {
      topo.annotateBoxPosition({x: 1, y: 1, pending: true});
      assert.deepEqual(annotations, {'gui-x': 1, 'gui-y': 1});
      assert.equal(update_annotations.called, false);
    });

    it('updates annotations on committed services', function() {
      topo.annotateBoxPosition({x: 1, y: 1});
      assert.equal(update_annotations.calledOnce, true);
    });
  });

});
