/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PanZoomModule = require('./panzoom');
const RelationModule = require('./relation');
const ServiceModule = require('./service');
const Topology = require('./topology');
const ViewportModule = require('./viewport');

const utils = require('../../../test/utils');
const viewUtils = require('../../views/utils');


describe('topology', function() {
  let TestModule, container, db, models, state, topo;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
    const button1 = document.createElement('button');
    button1.classList.add('thing');
    container.appendChild(button1);
    const button2 = document.createElement('button');
    button2.classList.add('target');
    container.appendChild(button2);
    TestModule = class {
      constructor(options={}) {
        this.name = 'TestModule';
        this.container = container;
        this.events = {
          scene: { '.thing': {click: 'decorateThing'}},
          d3: {'.target': {click: 'targetTarget'}},
          topo: {
            cancel: 'cancelHandler'
          }
        };
      }

      decorateThing(evt) {
        state.thing = 'decorated';
      }

      targetTarget(evt) {
        state.targeted = true;
      }

      cancelHandler(evt) {
        state.cancelled = true;
      }

      destroy() {}
    };
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
    topo = new Topology();
    topo.container = container;
    topo.addModule(TestModule);
    topo.render();

    // Verify that we have built the default scene.
    viewUtils.isValue(topo.vis).should.equal(true);
  });

  function createStandardTopo() {
    db = new models.Database();
    topo = new Topology();
    topo.container = container;
    topo.db = db;
    topo.addModule(ServiceModule);
    topo.addModule(RelationModule);
    topo.addModule(PanZoomModule);
    topo.addModule(ViewportModule);
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
      topo = new Topology();
      topo.container = container;
      topo.servicePadding = padding;
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
      topo = new Topology({
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
