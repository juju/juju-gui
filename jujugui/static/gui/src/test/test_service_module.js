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

describe('service module annotations', function() {
  var db, models, utils, viewContainer, views, serviceModule;
  var called, location;

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-gui',
      'juju-models',
      'juju-tests-utils',
      'juju-views',
      'juju-view-environment',
      'node',
      'node-event-simulate'],
    function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    called = false;
    location =
        { 'gui-x': 0,
          'gui-y': 0};
    var env = {
      update_annotations: function(name, type, data) {
        called = true;
        location['gui-x'] = data['gui-x'];
        location['gui-y'] = data['gui-y'];},
      get: function() {}};
    var view = new views.environment(
        { container: viewContainer,
          db: db,
          env: env});
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.set('useTransitions', false);
  });

  afterEach(function() {
    serviceModule.destroy();
  });

  afterEach(function() {
    serviceModule.destroy();
  });

  // Test the drag end handler.
  it('should set location annotations on service block drag end',
     function() {
       var d =
           { id: 'wordpress',
             inDrag: views.DRAG_ACTIVE,
             x: 100.1,
             y: 200.2};
       serviceModule.dragend(d, serviceModule);
       assert.isTrue(called);
       location['gui-x'].should.equal(100.1);
       location['gui-y'].should.equal(200.2);
     });

  it('should not set annotations on drag end if building a relation',
     function() {
       var d =
           { id: 'wordpress',
             x: 100.1,
             y: 200.2};
       var topo = serviceModule.get('component');
       topo.buildingRelation = true;
       serviceModule.dragend(d, serviceModule);
       assert.isFalse(called);
       location['gui-x'].should.equal(0);
       location['gui-y'].should.equal(0);
     });

  it('should clear the state when the event is fired', function() {
    const topo = serviceModule.get('component');
    const changeState = sinon.stub();
    topo.set('state', {changeState: changeState});
    topo.fire('clearState');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      root: null,
      user: null,
      gui: {
        machines: null,
        inspector: null
      },
      search: null,
      store: null
    });
  });
});

describe('service updates', function() {
  var db, models, utils, viewContainer, views, serviceModule;

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-gui',
      'juju-models',
      'juju-tests-utils',
      'juju-views',
      'juju-view-environment',
      'node',
      'node-event-simulate'],
    function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    var view = new views.environment(
        { container: viewContainer,
          db: db,
          env: {
            update_annotations: function() {}
          }});
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
  });

  it('should resize when subordinate status changes', function() {
    db.services.add({
      id: 'foo',
      subordinate: false
    });
    serviceModule.update();
    var service = serviceModule.get('component').vis.select('.service');
    assert.equal(service.select('.service-block').attr('cx'), 95);
    db.services.item(0).set('subordinate', true);
    serviceModule.update();
    assert.equal(service.select('.service-block').attr('cx'), 65);
  });

  it('should center on first load', function(done) {
    var callCount = 0;
    serviceModule.panToCenter = function() {
      callCount += 1;
      if (callCount > 1) {
        assert.fail('panToCenter should only be called once on load');
        done();
      }
      assert.equal(serviceModule.centerOnLoad, false);
      done();
    };
    db.services.add({
      id: 'foo',
      subordinate: false
    });
    serviceModule.update();
    // Call it a second time to see if it fails.
    serviceModule.update();
  });
});


// Aug 21 2015 - Jeff - These tests fail spuriously in phantomjs. Skipping
// until we can revisit and dedicate time to tracking down the issue.
describe.skip('service module events', function() {
  var db, charm, fakeStore, models, serviceModule, topo, utils,
      view, viewContainer, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-tests-utils',
      'juju-landscape',
      'charmstore-api',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-view-environment',
      'juju-topology-service',
      'node-event-simulate'],
    function(Y) {
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function(done) {
    fakeStore = new window.jujulib.charmstore('http://1.2.3.4/');
    fakeStore.getIconPath = function() {
      return 'charm icon url';
    };
    viewContainer = utils.makeContainer(this, 'content');
    var charmData = utils.loadFixture('data/haproxy-api-response.json', true);
    charm = new models.Charm(charmData.charm);
    db = new models.Database();
    db.services.add({id: 'haproxy', charm: 'cs:precise/haproxy-18'});
    db.charms.add(charm);
    view = new views.environment({
      container: viewContainer,
      db: db,
      env: {
        update_annotations: function() {},
        get: function() {}
      },
      charmstore: fakeStore
    });
    view.render();
    view.rendered();
    topo = view.topo;
    serviceModule = topo.modules.ServiceModule;
    done();
  });

  afterEach(function() {
    charm.destroy();
    db.destroy();
    topo.destroy();
    view.destroy();
  });

  it('should notify modules when service type is changed', function(done) {
    topo.on('rerenderRelations', function() {
      done();
    });
    topo.service_boxes.haproxy.model.set('subordinate', true);
    serviceModule.update();
  });

  it('must not process service clicks after a dragend', function() {
    // Test the work-around that prevents serviceClick from doing its work if
    // called after dragend.  Behaviour-driven testing via a tool such as
    // Selenium will add more coverage.
    var topo = view.topo;
    var called = false;
    var d =
        { id: 'wordpress',
          containsPoint: function() { return true; }
        };
    serviceModule.fake = function() { called = true; };
    serviceModule.set('currentServiceClickAction', 'fake');
    topo.ignoreServiceClick = true;
    serviceModule.serviceClick(d, serviceModule);
    assert.equal(called, true);
    // The flag is reset when encountered and ignored.
    assert.equal(topo.ignoreServiceClick, true);
  });

  it('should show only visible services', function() {
    var haproxy = db.services.getById('haproxy'); // Added in beforeEach.
    db.services.add([
      {id: 'rails', life: 'dying'},
      {id: 'mysql', life: 'dead'}
    ]);
    var django = db.services.add({id: 'django'});
    var wordpress = db.services.add({
      id: 'wordpress',
      life: 'dying',
      aggregated_status: {error: 42}
    });
    var unhighlight = sinon.stub(serviceModule, 'unhighlight');
    this._cleanups.push(unhighlight.restore);
    serviceModule.update();
    var boxes = topo.service_boxes;
    // There are five services in total.
    assert.strictEqual(5, db.services.size(), 'total');
    // But only three of those are actually displayed.
    assert.strictEqual(4, Object.keys(boxes).length, 'displayed');
    // And they are the visible ones.
    assert.deepPropertyVal(boxes, 'haproxy.model', haproxy);
    assert.deepPropertyVal(boxes, 'django.model', django);
    // Service wordpress is displayed because it has units in an error state.
    assert.deepPropertyVal(boxes, 'wordpress.model', wordpress);
  });

  it('should highlight and unhighlight services', function() {
    serviceModule.highlight({serviceName: 'haproxy'});
    assert.equal(topo.service_boxes.haproxy.highlighted, true);
    assert.equal(topo.vis.select('.service-block-image').attr('href'),
        '/static/gui/build/app/assets/svgs/service_module_selected.svg');
    assert.notEqual(topo.vis.select('.service.highlight')[0][0],
        null, 'Highlight class not found');
    serviceModule.unhighlight({serviceName: 'haproxy'});
    assert.equal(topo.service_boxes.haproxy.highlighted, false);
    assert.equal(topo.vis.select('.service-block-image').attr('href'),
        '/static/gui/build/app/assets/svgs/service_module.svg');
    assert.notEqual(topo.vis.select('.service.unhighlight')[0][0],
        null, 'Unhighlight class not found');
  });

  it('should highlight and unhighlight related services', function() {
    db.services.add({id: 'wordpress'});
    db.relations.add({
      'interface': 'proxy',
      scope: 'global',
      endpoints: [
        ['haproxy', {role: 'server', name: 'haproxy'}],
        ['wordpress', {role: 'client', name: 'wordpress'}]
      ],
      'id': 'relation1'
    });
    serviceModule.update();
    serviceModule.highlight({serviceName: 'haproxy',
      highlightRelated: true});
    assert.equal(topo.service_boxes.wordpress.highlighted, true);
    serviceModule.unhighlight({serviceName: 'haproxy',
      unhighlightRelated: true});
    assert.equal(topo.service_boxes.wordpress.highlighted, false);
  });

  it('can generate a selection from a list of service names', function() {
    assert.deepEqual(serviceModule.selectionFromServiceNames(['haproxy']),
        topo.vis.selectAll('.service'));
  });

  it('should display an indicator for pending services', function() {
    db.services.add([
      {id: 'apache2', pending: true}
    ]);
    serviceModule.update();
    assert.equal(topo.service_boxes.apache2.pending, true);
    assert.isFalse(topo.service_boxes.haproxy.pending);
    // Assert that there are two services on the canvas, but only one has
    // the pending indicator.
    assert.equal(topo.vis.selectAll('.service')[0].length, 2);
    assert.equal(topo.vis.selectAll('.pending-indicator')[0].length, 1);
  });

  it('should pan to a deployed bundle', function() {
    var stubFindCentroid = sinon.stub(serviceModule, 'findCentroid');
    this._cleanups.push(stubFindCentroid.restore);
    db.services.add([
      {
        id: 'apache2',
        pending: true,
        annotations: {
          'gui-x': 100,
          'gui-y': 100
        }
      }
    ]);
    serviceModule.update();
    db.fire('bundleImportComplete', {services: [db.services.item(0)]});
    assert.equal(stubFindCentroid.calledOnce, true,
        'findCentroid not called');
  });

  it('should deploy a service on charm token drop events', function(done) {
    var src = '/static/gui/build/app/assets/svgs/service_health_mask.svg',
        preventCount = 0,
        fakeEventObject = {
          halt: function() {
            preventCount += 1;
          },
          _event: {
            dataTransfer: {
              getData: function(name) {
                return JSON.stringify({
                  data: '{"id": "cs:foo/bar-1"}',
                  dataType: 'token-drag-and-drop',
                  iconSrc: src
                });
              }
            },
            target: {},
            clientX: 155,
            clientY: 153
          }
        };

    var eventHandle = Y.on('initiateDeploy', function(charm, ghostAttributes) {
      eventHandle.detach();
      // After the translation and calculations the above x and y coords should
      // place the element at -245, -18
      assert.deepEqual(ghostAttributes, {
        coordinates: [170, 317],
        icon: src
      });
      // Make sure that the drag and drop was properly prevented.
      assert.equal(preventCount, 1);
      done();
    });
    serviceModule.set('component', topo);
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('should deploy a bundle on bundle token drop events', function(done) {
    var src = '/static/gui/build/app/assets/svgs/service_health_mask.svg',
        fakeEventObject = {
          halt: function() {},
          _event: {
            dataTransfer: {
              getData: function(name) {
                return JSON.stringify({
                  data: '{"data": "BUNDLE DATA",' +
                        ' "id": "~jorge/bundle/thing"}',
                  dataType: 'token-drag-and-drop',
                  iconSrc: src
                });
              }
            },
            target: {},
            clientX: 155,
            clientY: 153
          }
        };

    view.topo.set('charmstore', {
      getBundleYAML: function(id, callback) {
        callback({target: {responseText: 'bundle: BUNDLE DATA'}});
      }
    });
    view.topo.set('bundleImporter', {
      importBundleYAML: function(e) {
        assert.equal(e.target.responseText, 'bundle: BUNDLE DATA');
        done();
      }
    });
    serviceModule.set('component', view.topo);
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('should deploy a bundle on file drop events', function(done) {
    var file = { name: '', type: '' };
    var fakeEventObject = {
      halt: function() {},
      _event: {
        dataTransfer: {
          // All we need to fake things out is to have a file.
          files: [file]
        }
      }
    };
    view.topo.set('bundleImporter', {
      importBundleFile: function(files) {
        assert.deepEqual(files, file);
        done();
      }
    });
    serviceModule.set('component', view.topo);
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('calls to extract local charm on .zip file drop events', function() {
    var fakeFile = {
      // Using a complex name to make sure the extension filtering works
      name: 'foo-bar.baz.zip',
      // This MIME type is used in Chrome and Firefox, see the
      // following test for uploading a charm zip using IE11.
      type: 'application/zip'
    };
    var fakeEventObject = {
      halt: function() {},
      _event: {
        dataTransfer: {
          // All we need to fake things out is to have a file.
          files: [fakeFile]
        }
      }
    };

    serviceModule.set('component', view.topo);
    var extractCharmMetadata = sinon.stub(
        serviceModule, '_extractCharmMetadata');
    this._cleanups.push(extractCharmMetadata.restore);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce, true);
    var args = extractCharmMetadata.lastCall.args;
    assert.deepEqual(args[0], fakeFile);
    assert.deepEqual(args[1], topo);
    assert.deepEqual(args[2], topo.get('env'));
    assert.deepEqual(args[3], topo.get('db'));
  });

  it('calls to extract local charm on .zip file drop events (IE)', function() {
    var fakeFile = {
      // Using a complex name to make sure the extension filtering works
      name: 'foo-bar.baz.zip',
      // This MIME type is used only in IE11 see the above test
      // for the MIME type used in Firefox and Chrome.
      type: 'application/x-zip-compressed'
    };
    var fakeEventObject = {
      halt: function() {},
      _event: {
        dataTransfer: {
          // All we need to fake things out is to have a file.
          files: [fakeFile]
        }
      }
    };

    serviceModule.set('component', view.topo);
    var extractCharmMetadata = sinon.stub(
        serviceModule, '_extractCharmMetadata');
    this._cleanups.push(extractCharmMetadata.restore);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce, true);
    var args = extractCharmMetadata.lastCall.args;
    assert.deepEqual(args[0], fakeFile);
    assert.deepEqual(args[1], topo);
    assert.deepEqual(args[2], topo.get('env'));
    assert.deepEqual(args[3], topo.get('db'));
  });

  it('_extractCharmMetadata: calls ziputils.getEntries()', function() {
    var fileObj = { file: '' },
        topoObj = { topo: '' },
        envObj = { env: '' },
        dbObj = { db: '' };
    var getEntries = sinon.stub(Y.juju.ziputils, 'getEntries');
    this._cleanups.push(getEntries.restore);
    var findCharmEntries = sinon.stub(
        serviceModule, '_findCharmEntries');
    this._cleanups.push(findCharmEntries.restore);
    var zipExtractionError = sinon.stub(
        serviceModule, '_zipExtractionError');
    this._cleanups.push(zipExtractionError);

    serviceModule._extractCharmMetadata(fileObj, topoObj, envObj, dbObj);

    assert.equal(getEntries.calledOnce, true);
    var getEntriesArgs = getEntries.lastCall.args;
    assert.equal(getEntriesArgs[0], fileObj);
    assert.isFunction(getEntriesArgs[1]);
    assert.isFunction(getEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    getEntriesArgs[1]();
    var findCharmArgs = findCharmEntries.lastCall.args;
    assert.deepEqual(findCharmArgs[0], fileObj);
    assert.deepEqual(findCharmArgs[1], topoObj);
    assert.deepEqual(findCharmArgs[2], envObj);
    assert.deepEqual(findCharmArgs[3], dbObj);
    //Call the fail callback
    getEntriesArgs[2]();
    var zipErrorArgs = zipExtractionError.lastCall.args;
    assert.deepEqual(zipErrorArgs[0], dbObj);
  });

  describe('_findCharmEntries', function() {
    var dbObj, envObj, fileObj, topoObj, notificationParams;

    beforeEach(function() {
      fileObj = { name: 'foo' };
      topoObj = { topo: '' };
      envObj = { env: '' };
      dbObj = {
        notifications: {
          add: function(info) {
            notificationParams = info;
          }
        }
      };
    });

    it('finds the files in the zip', function() {
      var entries = { metadata: 'foo' };
      var findEntries = sinon.stub(
          Y.juju.ziputils, 'findCharmEntries').returns(entries);
      this._cleanups.push(findEntries.restore);
      var readEntries = sinon.stub(
          serviceModule, '_readCharmEntries');
      this._cleanups.push(readEntries.restore);

      serviceModule._findCharmEntries(fileObj, topoObj, envObj, dbObj, {});

      assert.equal(findEntries.calledOnce, true);
      assert.deepEqual(findEntries.lastCall.args[0], {});
      assert.equal(readEntries.calledOnce, true);
      var readEntriesArgs = readEntries.lastCall.args;
      assert.deepEqual(readEntriesArgs[0], fileObj);
      assert.deepEqual(readEntriesArgs[1], topoObj);
      assert.deepEqual(readEntriesArgs[2], envObj);
      assert.deepEqual(readEntriesArgs[3], dbObj);
      assert.deepEqual(readEntriesArgs[4], entries);
    });

    it('shows an error notification if there is no metadata.yaml', function() {
      var entries = { foo: 'bar' };
      var findEntries = sinon.stub(
          Y.juju.ziputils, 'findCharmEntries').returns(entries);
      this._cleanups.push(findEntries.restore);
      var readEntries = sinon.stub(
          serviceModule, '_readCharmEntries');
      this._cleanups.push(readEntries.restore);

      serviceModule._findCharmEntries(fileObj, topoObj, envObj, dbObj, {});

      assert.equal(findEntries.calledOnce, true);
      assert.deepEqual(findEntries.lastCall.args[0], {});
      assert.deepEqual(notificationParams, {
        title: 'Import failed',
        message: 'Import from "' + fileObj.name + '" failed. Invalid charm ' +
            'file, missing metadata.yaml',
        level: 'error'
      });
      assert.equal(readEntries.calledOnce, false);
    });
  });

  it('_readCharmEntries: calls ziputils.readCharmEntries', function() {
    var fileObj = { file: '' },
        topoObj = { topo: '' },
        envObj = { env: '' },
        dbObj = { db: '' };
    var readEntries = sinon.stub(Y.juju.ziputils, 'readCharmEntries');
    this._cleanups.push(readEntries.restore);
    var existingServices = sinon.stub(
        serviceModule, '_checkForExistingServices');
    this._cleanups.push(existingServices);
    var extractionError = sinon.stub(
        serviceModule, '_zipExtractionError');

    serviceModule._readCharmEntries(fileObj, topoObj, envObj, dbObj, {});

    assert.equal(readEntries.calledOnce, true);
    var readEntriesArgs = readEntries.lastCall.args;
    assert.deepEqual(readEntriesArgs[0], {});
    assert.isFunction(readEntriesArgs[1]);
    assert.isFunction(readEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    readEntriesArgs[1]();
    var existingServicesArgs = existingServices.lastCall.args;
    assert.deepEqual(existingServicesArgs[0], fileObj);
    assert.deepEqual(existingServicesArgs[1], topoObj);
    assert.deepEqual(existingServicesArgs[2], envObj);
    assert.deepEqual(existingServicesArgs[3], dbObj);
    //Call the fail callback
    readEntriesArgs[2]();
    var zipErrorArgs = extractionError.lastCall.args;
    assert.deepEqual(zipErrorArgs[0], dbObj);
    assert.deepEqual(zipErrorArgs[1], fileObj);
  });

  describe('_checkForExistingService', function() {
    var dbObj, deployCharm, contentsObj, envObj, fileObj, getServicesStub,
        jsYamlMock, showInspector, topoFireStub, topoObj;

    beforeEach(function() {
      fileObj = { name: 'foo' };
      topoFireStub = sinon.stub();
      topoObj = { fire: topoFireStub };
      envObj = { env: 'foo' };
      contentsObj = { metadata: 'foo' };
    });

    function setup(context) {
      jsYamlMock = sinon.stub(jsyaml, 'safeLoad').returns({ name: 'ghost' });
      context._cleanups.push(jsYamlMock.restore);
      showInspector = sinon.stub(
          serviceModule, '_showUpgradeOrNewInspector');
      context._cleanups.push(showInspector.restore);
      deployCharm = sinon.stub(serviceModule, '_deployLocalCharm');
      context._cleanups.push(deployCharm.restore);
    }

    function sharedAssert() {
      assert.equal(jsYamlMock.calledOnce, true);
      assert.equal(getServicesStub.calledOnce, true);
      assert.equal(topoFireStub.calledOnce, true);
    }

    it('calls to show the upgrade or new inspector', function() {
      setup(this);

      getServicesStub = sinon.stub().returns(['service']);
      dbObj = { services: { getServicesFromCharmName: getServicesStub }};

      serviceModule._checkForExistingServices(
          fileObj, topoObj, envObj, dbObj, contentsObj);

      sharedAssert();

      assert.equal(showInspector.calledOnce, true);
      assert.equal(deployCharm.calledOnce, false);
    });

    it('calls to deploy the local charm', function() {
      setup(this);

      getServicesStub = sinon.stub().returns(['service']);
      dbObj = { services: { getServicesFromCharmName: getServicesStub }};

      serviceModule._checkForExistingServices(
          fileObj, topoObj, envObj, dbObj, contentsObj);

      sharedAssert();

      assert.equal(showInspector.calledOnce, true);
      assert.equal(deployCharm.calledOnce, false);
    });
  });

  it('shows a notification if there is a zip error', function() {
    var notificationParams;
    var dbObj = {
      notifications: {
        add: function(info) {
          notificationParams = info;
        }
      }
    };
    var fileObj = { name: 'foo' };
    const fadeHelpIndicator = sinon.stub();
    const topo = {
      get: sinon.stub().returns({
        fadeHelpIndicator: fadeHelpIndicator
      })
    };
    serviceModule._zipExtractionError(dbObj, topo, fileObj);

    assert.deepEqual(notificationParams, {
      title: 'Import failed',
      message: 'Import from "' + fileObj.name + '" failed. See console for' +
          'error object',
      level: 'error'
    });
    assert.equal(fadeHelpIndicator.callCount, 1);
  });

  it('_showUpgradeOrNewInspector: shows the inspector', function() {
    var dbObj = { db: 'db' };
    var fileObj = { name: 'foo' };
    var envObj = { env: 'env' };
    var services = [{ getAttrs: function() {} }];

    serviceModule.set('component', {
      fire: sinon.stub()
    });

    var fireStub = serviceModule.get('component').fire;

    serviceModule._showUpgradeOrNewInspector(services, fileObj, envObj, dbObj);
    assert.equal(fireStub.callCount, 1);
    assert.equal(fireStub.lastCall.args[0], 'changeState');
    assert.deepEqual(fireStub.lastCall.args[1], {
      gui: {
        inspector: {
          id: null,
          localType: 'update',
          flash: {
            file: fileObj,
            services: services
          }}}
    });
  });

  it('_deployLocalCharm: calls to show the inspector', function() {
    var dbObj = { db: 'db' };
    var fileObj = { name: 'foo' };
    var envObj = { env: 'env' };

    serviceModule.set('component', {
      fire: sinon.stub()
    });

    var fireStub = serviceModule.get('component').fire;

    serviceModule._deployLocalCharm(fileObj, envObj, dbObj);
    assert.equal(fireStub.callCount, 1);
    assert.equal(fireStub.lastCall.args[0], 'changeState');
    assert.deepEqual(fireStub.lastCall.args[1], {
      gui: {
        inspector: {
          id: null,
          localType: 'new',
          flash: {
            file: fileObj
          }}}
    });
  });
});

describe('canvasDropHandler', function() {
  var views, utils, models, serviceModule;

  // Requiring this much setup (before() and beforeEach() to call a single
  // method on a single object is obscene.
  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-models',
      'juju-tests-utils',
      'juju-view-environment'],
    function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    var viewContainer = utils.makeContainer(this);
    var db = new models.Database();
    var env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    var view = new views.environment({
      container: viewContainer,
      db: db,
      env: env
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.set('useTransitions', false);
  });

  it('defers its implementatino to _canvasDropHandler', function() {
    var files = {length: 2};
    var evt = {
      _event: {dataTransfer: {files: files}},
      halt: function() {}
    };
    // Calling both functions with arguments that result in an early-out is the
    // easiest way to show that the one is just a shim around the other.
    assert.equal(
        serviceModule.canvasDropHandler(evt),
        serviceModule._canvasDropHandler(files));
  });

  it('halts the event so FF does not try to reload the page', function(done) {
    var evt = {
      _event: {dataTransfer: {files: {length: 2}}},
      halt: function() {done();}
    };
    serviceModule.canvasDropHandler(evt);
  });

});

describe('_canvasDropHandler', function() {
  var Y, views, utils, models, serviceModule;

  // Requiring this much setup (before() and beforeEach() to call a single
  // method on a single object is obscene.
  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-tests-utils',
      'juju-view-environment'],
    function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    var viewContainer = utils.makeContainer(this);
    var db = new models.Database();
    var env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    var view = new views.environment({
      container: viewContainer,
      db: db,
      env: env
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.set('useTransitions', false);
  });

  it('ignores drop events that contain more than one file', function() {
    var files = {length: 2};
    assert.equal(serviceModule._canvasDropHandler(files), 'event ignored');
  });

  it('deploys charms dropped from the sidebar', function(done) {
    var files = {};
    var self = {
      _deployFromCharmbrowser: function() {done();}
    };
    Y.bind(serviceModule._canvasDropHandler, self)(files);
  });

  it('extracts a zipped charm directory when dropped', function(done) {
    var file = {name: 'charm.zip', type: 'application/zip'};
    var self = {
      _extractCharmMetadata: function() {done();}
    };
    Y.bind(serviceModule._canvasDropHandler, self)([file]);
  });

  it('recognizes zip files of type x-zip-compressed', function(done) {
    var file = {name: 'charm.zip', type: 'application/x-zip-compressed'};
    var files = {length: 1, 0: file};
    var self = {
      _extractCharmMetadata: function() {done();}
    };
    Y.bind(serviceModule._canvasDropHandler, self)(files);
  });

});

describe('updateElementVisibility', function() {
  var views, utils, models, serviceModule;

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-models',
      'juju-tests-utils',
      'juju-view-environment'],
    function(Y) {
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju-tests.utils');
      views = Y.namespace('juju.views');
      done();
    });
  });

  beforeEach(function() {
    var viewContainer = utils.makeContainer(this);
    var db = new models.Database();
    var env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    var view = new views.environment({
      container: viewContainer,
      db: db,
      env: env
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.set('useTransitions', false);
  });

  it('is called on update', function() {
    serviceModule.rendered = true;
    serviceModule.service_scale = true;
    serviceModule.dragBehaviour = true;
    var update = sinon.stub(serviceModule, 'updateElementVisibility');
    var updateData = sinon.stub(serviceModule, 'updateData');
    this._cleanups.push(updateData.restore);
    this._cleanups.push(update.restore);
    serviceModule.update();
    assert.equal(update.callCount, 1);
  });

  it('categorizes and calls the appropriate vis method', function() {
    var fade = sinon.stub(serviceModule, 'fade');
    var hide = sinon.stub(serviceModule, 'hide');
    var show = sinon.stub(serviceModule, 'show');
    var highlight = sinon.stub(serviceModule, 'highlight');
    var unhighlight = sinon.stub(serviceModule, 'unhighlight');
    this._cleanups.concat([
      fade.restore, hide.restore, show.restore, highlight.restore,
      unhighlight.restore
    ]);
    var serviceList = new models.ServiceList();
    serviceList.add([{
      id: 'foo1',
      fade: true
    }, {
      id: 'foo2',
      hide: true
    }, {
      id: 'foo3',
      highlight: true
    }, {
      id: 'foo4'
    }]);
    serviceModule.set('component', {
      get: function() {
        return {
          services: serviceList
        };
      }});
    serviceModule.updateElementVisibility();
    assert.equal(fade.callCount, 1);
    assert.deepEqual(fade.lastCall.args[0], { serviceNames: ['foo1'] });
    assert.equal(hide.callCount, 1);
    assert.deepEqual(hide.lastCall.args[0], { serviceNames: ['foo2'] });
    assert.equal(show.callCount, 3);
    assert.deepEqual(show.args, [
      [{ serviceNames: ['foo1'] }],
      [{ serviceNames: ['foo3'] }],
      [{ serviceNames: ['foo4'] }]
    ]);
    assert.equal(highlight.callCount, 1);
    assert.deepEqual(highlight.lastCall.args[0], { serviceName: ['foo3'] });
    assert.equal(unhighlight.callCount, 3);
    assert.deepEqual(unhighlight.args, [
      [{ serviceName: ['foo1'] }],
      [{ serviceName: ['foo2'] }],
      [{ serviceName: ['foo4'] }]
    ]);
  });
});
