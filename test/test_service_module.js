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
  var db, juju, models, utils, viewContainer, views, Y, serviceModule;
  var called, location;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-gui',
      'juju-models',
      'juju-tests-utils',
      'juju-views',
      'node',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
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
});


describe('service module events', function() {
  var db, charm, fakeStore, juju, models, serviceModule, topo, utils,
      view, viewContainer, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-tests-utils',
      'juju-landscape',
      'juju-models',
      'juju-views',
      'juju-gui',
      'node-event-simulate',
      'slider'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function(done) {
    fakeStore = new Y.juju.charmworld.APIv3({});
    fakeStore.iconpath = function() {
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
      nsRouter: {
        url: function() { return; }
      },
      store: fakeStore
    });
    view.render();
    view.rendered();
    topo = view.topo;
    serviceModule = topo.modules.ServiceModule;
    done();
  });

  afterEach(function() {
    fakeStore.destroy();
    charm.destroy();
    db.destroy();
    topo.destroy();
    view.destroy();
  });

  it('should show the service menu', function() {
    var box = topo.service_boxes.haproxy;
    var menu = viewContainer.one('#service-menu');

    assert.isFalse(menu.hasClass('active'));
    serviceModule.showServiceMenu(box);
    assert(menu.hasClass('active'));
    // Check no-op.
    serviceModule.showServiceMenu(box);
    assert(menu.hasClass('active'));
  });

  it('should hide the service menu',
     function() {
       var box = topo.service_boxes.haproxy;
       var menu = viewContainer.one('#service-menu');
       serviceModule.showServiceMenu(box);
       assert(menu.hasClass('active'));
       serviceModule.hideServiceMenu();
       assert.isFalse(menu.hasClass('active'));
       // Check no-op.
       serviceModule.hideServiceMenu();
       assert.isFalse(menu.hasClass('active'));
     });

  // Click the provided service so that the service menu is shown.
  // Return the service menu.
  var clickService = function(service) {
    // Monkeypatch to avoid the click event handler bailing out early.
    topo.service_boxes.haproxy.containsPoint = function() {
      return true;
    };
    // Click the service.
    service.simulate('click');
    return viewContainer.one('#service-menu');
  };

  it('should not show the service menu after the service is double-clicked',
     function() {
       var service = viewContainer.one('.service');
       var menu = clickService(service);

       // Ideally the browser would not send the click event right away...
       assert(menu.hasClass('active'));
       service.simulate('dblclick');
       assert.isFalse(menu.hasClass('active'));
     });

  it('should handle touch/click events properly', function() {
    var service = viewContainer.one('.service');
    var menu = viewContainer.one('#service-menu');
    assert.isFalse(menu.hasClass('active'));
    serviceModule._touchstartServiceTap({
      currentTarget: service,
      touches: [{PageX: 0, PageY: 0}]
    }, topo);
    // Touch events should also fire click events, which will be ignored.
    // Fire one manually here.
    clickService(service);
    assert(menu.hasClass('active'));
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
    assert.isFalse(called);
    // The flag is reset when encountered and ignored.
    assert.isFalse(topo.ignoreServiceClick);
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
    serviceModule.update();
    var boxes = topo.service_boxes;
    // There are five services in total.
    assert.strictEqual(5, db.services.size(), 'total');
    // But only three of those are actually displayed.
    assert.strictEqual(4, Y.Object.size(boxes), 'displayed');
    // And they are the visible ones.
    assert.deepPropertyVal(boxes, 'haproxy.model', haproxy);
    assert.deepPropertyVal(boxes, 'django.model', django);
    // Service wordpress is displayed because it has units in an error state.
    assert.deepPropertyVal(boxes, 'wordpress.model', wordpress);
  });

  it('should fade pending services but not deployed services', function() {
    db.services.add([
      {id: 'rails', pending: true}
    ]);
    serviceModule.update();
    assert.isTrue(topo.service_boxes.rails.pending);
    assert.isFalse(topo.service_boxes.haproxy.pending);
    // Assert that there are two services on the canvas, but only one is
    // classed pending.
    assert.equal(topo.vis.selectAll('.service')[0].length, 2);
    assert.equal(topo.vis.selectAll('.service.pending')[0].length, 1);
  });

  it('should deploy a service on charm token drop events', function(done) {
    var src = '/juju-ui/assets/svgs/service_health_mask.svg',
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
      // place the element at 320, 392
      assert.deepEqual(ghostAttributes, {
        coordinates: [320, 392],
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
    var src = '/juju-ui/assets/svgs/service_health_mask.svg',
        preventCount = 0,
        fakeEventObject = {
          halt: function() {
            preventCount += 1;
          },
          _event: {
            dataTransfer: {
              getData: function(name) {
                return JSON.stringify({
                  data: '{"basket_name": "foo", "data": "BUNDLE DATA",' +
                        ' "id": "~jorge/basket/thing"}',
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

    // mock out the Y.BundleHelpers call.
    var _deployBundle = juju.BundleHelpers.deployBundle;
    juju.BundleHelpers.deployBundle = function(deployerData, id, env, db) {
      assert.include(deployerData, 'BUNDLE DATA');
      assert.equal(id, '~jorge/basket/thing');
      // Restore the deployBundle call for future tests.
      juju.BundleHelpers.deployBundle = _deployBundle;
      done();
    };

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

    // mock out the Y.BundleHelpers call.
    var _deployBundleFiles = juju.BundleHelpers.deployBundleFiles;
    juju.BundleHelpers.deployBundleFiles = function(files, env, db) {
      assert.deepEqual(files, file);
      // Restore the deployBundleFiles call for future tests.
      juju.BundleHelpers.deployBundleFiles = _deployBundleFiles;
      done();
    };

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
    var extractCharmMetadata = utils.makeStubMethod(
        serviceModule, '_extractCharmMetadata');
    this._cleanups.push(extractCharmMetadata.reset);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce(), true);
    var args = extractCharmMetadata.lastArguments();
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
    var extractCharmMetadata = utils.makeStubMethod(
        serviceModule, '_extractCharmMetadata');
    this._cleanups.push(extractCharmMetadata.reset);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce(), true);
    var args = extractCharmMetadata.lastArguments();
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
    var getEntries = utils.makeStubMethod(Y.juju.ziputils, 'getEntries');
    this._cleanups.push(getEntries.reset);
    var findCharmEntries = utils.makeStubMethod(
        serviceModule, '_findCharmEntries');
    this._cleanups.push(findCharmEntries.reset);
    var zipExtractionError = utils.makeStubMethod(
        serviceModule, '_zipExtractionError');
    this._cleanups.push(zipExtractionError);

    serviceModule._extractCharmMetadata(fileObj, topoObj, envObj, dbObj);

    assert.equal(getEntries.calledOnce(), true);
    var getEntriesArgs = getEntries.lastArguments();
    assert.equal(getEntriesArgs[0], fileObj);
    assert.isFunction(getEntriesArgs[1]);
    assert.isFunction(getEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    getEntriesArgs[1]();
    var findCharmArgs = findCharmEntries.lastArguments();
    assert.deepEqual(findCharmArgs[0], fileObj);
    assert.deepEqual(findCharmArgs[1], topoObj);
    assert.deepEqual(findCharmArgs[2], envObj);
    assert.deepEqual(findCharmArgs[3], dbObj);
    //Call the fail callback
    getEntriesArgs[2]();
    var zipErrorArgs = zipExtractionError.lastArguments();
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
      var findEntries = utils.makeStubMethod(
          Y.juju.ziputils, 'findCharmEntries', entries);
      this._cleanups.push(findEntries.reset);
      var readEntries = utils.makeStubMethod(
          serviceModule, '_readCharmEntries');
      this._cleanups.push(readEntries.reset);

      serviceModule._findCharmEntries(fileObj, topoObj, envObj, dbObj, {});

      assert.equal(findEntries.calledOnce(), true);
      assert.deepEqual(findEntries.lastArguments()[0], {});
      assert.equal(readEntries.calledOnce(), true);
      var readEntriesArgs = readEntries.lastArguments();
      assert.deepEqual(readEntriesArgs[0], fileObj);
      assert.deepEqual(readEntriesArgs[1], topoObj);
      assert.deepEqual(readEntriesArgs[2], envObj);
      assert.deepEqual(readEntriesArgs[3], dbObj);
      assert.deepEqual(readEntriesArgs[4], entries);
    });

    it('shows an error notification if there is no metadata.yaml', function() {
      var entries = { foo: 'bar' };
      var findEntries = utils.makeStubMethod(
          Y.juju.ziputils, 'findCharmEntries', entries);
      this._cleanups.push(findEntries.reset);
      var readEntries = utils.makeStubMethod(
          serviceModule, '_readCharmEntries');
      this._cleanups.push(readEntries.reset);

      serviceModule._findCharmEntries(fileObj, topoObj, envObj, dbObj, {});

      assert.equal(findEntries.calledOnce(), true);
      assert.deepEqual(findEntries.lastArguments()[0], {});
      assert.deepEqual(notificationParams, {
        title: 'Import failed',
        message: 'Import from "' + fileObj.name + '" failed. Invalid charm ' +
            'file, missing metadata.yaml',
        level: 'error'
      });
      assert.equal(readEntries.calledOnce(), false);
    });
  });

  it('_readCharmEntries: calls ziputils.readCharmEntries', function() {
    var fileObj = { file: '' },
        topoObj = { topo: '' },
        envObj = { env: '' },
        dbObj = { db: '' };
    var readEntries = utils.makeStubMethod(Y.juju.ziputils, 'readCharmEntries');
    this._cleanups.push(readEntries.reset);
    var existingServices = utils.makeStubMethod(
        serviceModule, '_checkForExistingServices');
    this._cleanups.push(existingServices);
    var extractionError = utils.makeStubMethod(
        serviceModule, '_zipExtractionError');

    serviceModule._readCharmEntries(fileObj, topoObj, envObj, dbObj, {});

    assert.equal(readEntries.calledOnce(), true);
    var readEntriesArgs = readEntries.lastArguments();
    assert.deepEqual(readEntriesArgs[0], {});
    assert.isFunction(readEntriesArgs[1]);
    assert.isFunction(readEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    readEntriesArgs[1]();
    var existingServicesArgs = existingServices.lastArguments();
    assert.deepEqual(existingServicesArgs[0], fileObj);
    assert.deepEqual(existingServicesArgs[1], topoObj);
    assert.deepEqual(existingServicesArgs[2], envObj);
    assert.deepEqual(existingServicesArgs[3], dbObj);
    //Call the fail callback
    readEntriesArgs[2]();
    var zipErrorArgs = extractionError.lastArguments();
    assert.deepEqual(zipErrorArgs[0], dbObj);
    assert.deepEqual(zipErrorArgs[1], fileObj);
  });

  describe('_checkForExistingService', function() {
    var dbObj, deployCharm, contentsObj, envObj, fileObj, getServicesStub,
        jsYamlMock, showInspector, topoFireStub, topoObj, notificationParams;

    beforeEach(function() {
      fileObj = { name: 'foo' };
      topoFireStub = utils.makeStubFunction();
      topoObj = { fire: topoFireStub };
      envObj = { env: 'foo' };
      contentsObj = { metadata: 'foo' };
    });

    function setup(context) {
      jsYamlMock = utils.makeStubMethod(jsyaml, 'safeLoad', { name: 'ghost' });
      context._cleanups.push(jsYamlMock.reset);
      showInspector = utils.makeStubMethod(
          serviceModule, '_showUpgradeOrNewInspector');
      context._cleanups.push(showInspector.reset);
      deployCharm = utils.makeStubMethod(serviceModule, '_deployLocalCharm');
      context._cleanups.push(deployCharm.reset);
    }

    function sharedAssert() {
      assert.equal(jsYamlMock.calledOnce(), true);
      assert.equal(getServicesStub.calledOnce(), true);
      assert.equal(topoFireStub.calledOnce(), true);
      assert.equal(topoFireStub.lastArguments()[0], 'destroyServiceInspector');
    }

    it('calls to show the upgrade or new inspector', function() {
      setup(this);

      getServicesStub = utils.makeStubFunction(['service']);
      dbObj = { services: { getServicesFromCharmName: getServicesStub }};

      serviceModule._checkForExistingServices(
          fileObj, topoObj, envObj, dbObj, contentsObj);

      sharedAssert();

      assert.equal(showInspector.calledOnce(), true);
      assert.equal(deployCharm.calledOnce(), false);
    });

    it('calls to deploy the local charm', function() {
      setup(this);

      getServicesStub = utils.makeStubFunction(['service']);
      dbObj = { services: { getServicesFromCharmName: getServicesStub }};

      serviceModule._checkForExistingServices(
          fileObj, topoObj, envObj, dbObj, contentsObj);

      sharedAssert();

      assert.equal(showInspector.calledOnce(), true);
      assert.equal(deployCharm.calledOnce(), false);
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

    serviceModule._zipExtractionError(dbObj, fileObj);

    assert.deepEqual(notificationParams, {
      title: 'Import failed',
      message: 'Import from "' + fileObj.name + '" failed. See console for' +
          'error object',
      level: 'error'
    });
  });

  it('_showUpgradeOrNewInspector: shows the inspector', function() {
    var ViewletManager, renderStub, showViewletStub;
    var dbObj = { db: 'db' };
    var fileObj = { name: 'foo' };
    var envObj = { env: 'env' };
    var services = [{ getAttrs: function() {} }];

    ViewletManager = utils.makeStubMethod(
        Y.namespace('juju.viewlets'), 'ViewletManager');
    this._cleanups.push(ViewletManager.reset);
    renderStub = utils.makeStubMethod(ViewletManager.prototype, 'render');
    showViewletStub = utils.makeStubMethod(
        ViewletManager.prototype, 'showViewlet');

    serviceModule._showUpgradeOrNewInspector(services, fileObj, envObj, dbObj);

    assert.equal(ViewletManager.calledOnce(), true);
    var vmArgs = ViewletManager.lastArguments();
    assert.equal(
        vmArgs[0].views.localNewUpgradeView instanceof
        Y.juju.viewlets.LocalNewUpgradeView, true);
    assert.equal(renderStub.calledOnce(), true);
    assert.equal(showViewletStub.callCount(), 2);
    var showArgs = showViewletStub.allArguments();
    assert.equal(showArgs[0][0], 'requestSeries');
    assert.equal(showArgs[1][0], 'localNewUpgradeView');
  });
});

describe('canvasDropHandler', function() {
  var Y, views, utils, models, serviceModule;

  // Requiring this much setup (before() and beforeEach() to call a single
  // method on a single object is obscene.
  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'juju-models',
      'juju-tests-utils',
      'juju-views'],
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
      'juju-views'],
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

