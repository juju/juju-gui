/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const jsyaml = require('js-yaml');
const utils = require('../../../test/utils');

const EnvironmentView = require('./environment');

describe('service module annotations', function() {
  let db, models, view, viewContainer, serviceModule;
  let called, location;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    called = false;
    location = { 'gui-x': 0, 'gui-y': 0};
    const env = {
      update_annotations: function(name, type, data) {
        called = true;
        location['gui-x'] = data['gui-x'];
        location['gui-y'] = data['gui-y'];},
      get: function() {}};
    view = new EnvironmentView({
      container: viewContainer,
      db: db,
      env: env,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.useTransitions = false;
  });

  afterEach(function() {
    view.destructor();
    viewContainer.remove();
  });

  // Test the drag end handler.
  it('should set location annotations on service block drag end',
    function() {
      const d =
           { id: 'wordpress',
             inDrag: serviceModule.DRAG_ACTIVE,
             x: 100.1,
             y: 200.2};
      serviceModule.dragend(d, serviceModule);
      assert.isTrue(called);
      location['gui-x'].should.equal(100.1);
      location['gui-y'].should.equal(200.2);
    });

  it('should not set annotations on drag end if building a relation',
    function() {
      const d =
           { id: 'wordpress',
             x: 100.1,
             y: 200.2};
      const topo = serviceModule.topo;
      topo.buildingRelation = true;
      serviceModule.dragend(d, serviceModule);
      assert.isFalse(called);
      location['gui-x'].should.equal(0);
      location['gui-y'].should.equal(0);
    });

  it('should clear the state when the event is fired', function() {
    const topo = serviceModule.topo;
    const changeState = sinon.stub();
    topo.state = {changeState: changeState};
    serviceModule.clearStateHandler();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
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
  let db, models, view, viewContainer, serviceModule;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    view = new EnvironmentView(
      { container: viewContainer,
        db: db,
        env: {
          update_annotations: function() {}
        },
        state: {changeState: sinon.stub()}
      });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
  });

  afterEach(function() {
    view.destructor();
    viewContainer.remove();
  });

  it('should resize when subordinate status changes', function() {
    db.services.add({
      id: 'foo',
      subordinate: false
    });
    serviceModule.update();
    const service = serviceModule.topo.vis.select('.service');
    assert.equal(service.select('.service-block').attr('cx'), 95);
    db.services.item(0).set('subordinate', true);
    serviceModule.update();
    assert.equal(service.select('.service-block').attr('cx'), 65);
  });

  it('should center on first load', function(done) {
    let callCount = 0;
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


describe('service module events', function() {
  let cleanups, db, charm, fakeStore, models, serviceModule, topo,
      view, viewContainer, Y;

  beforeAll(function(done) {
    Y = YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      window.models = models;
      done();
    });
  });

  beforeEach(function(done) {
    cleanups = [];
    fakeStore = new window.jujulib.charmstore('http://1.2.3.4/');
    fakeStore.getIconPath = function() {
      return 'charm icon url';
    };
    viewContainer = utils.makeContainer(this, 'content');
    const charmData = utils.loadFixture('data/haproxy-api-response.json', true);
    charm = new models.Charm(charmData.charm);
    db = new models.Database();
    db.services.add({id: 'haproxy', charm: 'cs:precise/haproxy-18'});
    db.charms.add(charm);
    view = new EnvironmentView({
      container: viewContainer,
      db: db,
      env: {
        update_annotations: function() {},
        get: function() {}
      },
      charmstore: fakeStore,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    topo = view.topo;
    serviceModule = topo.modules.ServiceModule;
    done();
  });

  afterEach(function() {
    cleanups.forEach(cleanup => cleanup());
    charm.destroy();
    db.destroy();
    topo.destructor();
    view.destructor();
    viewContainer.remove();
  });

  it('should notify modules when service type is changed', function(done) {
    // This test will time out if the event is not fired.
    const listener = e => {
      document.removeEventListener('topo.rerenderRelations', listener);
      done();
    };
    document.addEventListener('topo.rerenderRelations', listener);
    topo.service_boxes.haproxy.model.set('highlighted', true);
    serviceModule.update();
  });

  // XXX: d3.mouse does not seem to work correctly inside the test.
  xit('must not process service clicks after a dragend', function() {
    // Test the work-around that prevents serviceClick from doing its work if
    // called after dragend.  Behaviour-driven testing via a tool such as
    // Selenium will add more coverage.
    const topo = view.topo;
    let called = false;
    const d = {
      id: 'wordpress',
      containsPoint: function() {return true;}
    };
    serviceModule.fake = function() {called = true;};
    serviceModule.currentServiceClickAction = 'fake';
    topo.ignoreServiceClick = true;
    serviceModule.serviceClick(d, serviceModule);
    assert.equal(called, true);
    // The flag is reset when encountered and ignored.
    assert.equal(topo.ignoreServiceClick, true);
  });

  it('should show only visible services', function() {
    db.services.add([
      {id: 'rails', life: 'dying'},
      {id: 'mysql', life: 'dead'}
    ]);
    db.services.add({id: 'django'});
    db.services.add({
      id: 'wordpress',
      life: 'dying',
      aggregated_status: {error: 42}
    });
    const unhighlight = sinon.stub(serviceModule, 'unhighlight');
    cleanups.push(unhighlight.restore);
    serviceModule.update();
    const boxes = topo.service_boxes;
    // There are five services in total.
    assert.strictEqual(5, db.services.size(), 'total');
    // But only three of those are actually displayed.
    assert.strictEqual(4, Object.keys(boxes).length, 'displayed');
    // And they are the visible ones.
    assert.isNotNull(boxes.haproxy);
    assert.isObject(boxes.haproxy);
    assert.isNotNull(boxes.django);
    assert.isObject(boxes.django);
    // Service wordpress is displayed because it has units in an error state.
    assert.isNotNull(boxes.wordpress);
    assert.isObject(boxes.wordpress);
  });

  //XXX: this functionality is not currently used and is not working.
  xit('should highlight and unhighlight services', function() {
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

  it('should pan to a deployed bundle', function() {
    const stubFindCentroid = sinon.stub(serviceModule, 'findCentroid');
    cleanups.push(stubFindCentroid.restore);
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
    serviceModule.panToBundle({services: [db.services.item(0)]});
    assert.equal(stubFindCentroid.calledOnce, true,
      'findCentroid not called');
  });

  it('should deploy a service on charm token drop events', function(done) {
    const src = '/static/gui/build/app/assets/svgs/service_health_mask.svg';
    const fakeEventObject = {
      dataTransfer: {
        getData: function(name) {
          return JSON.stringify({
            data: '{"id": "cs:xenial/bar-1"}',
            dataType: 'token-drag-and-drop',
            iconSrc: src
          });
        }
      },
      target: {},
      clientX: 155,
      clientY: 153,
      preventDefault: sinon.stub()
    };
    const listener = e => {
      document.removeEventListener('initiateDeploy', listener);
      // After the translation and calculations the above x and y coords should
      // place the element at -245, -18
      assert.deepEqual(e.detail.ghostAttributes, {
        coordinates: [52.5, -52],
        icon: src
      });
      // Make sure that the drag and drop was properly prevented.
      assert.equal(fakeEventObject.preventDefault.callCount, 1);
      done();
    };
    document.addEventListener('initiateDeploy', listener);
    serviceModule.topo = topo;
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('should deploy a bundle on bundle token drop events', function(done) {
    const src = '/static/gui/build/app/assets/svgs/service_health_mask.svg';
    const fakeEventObject = {
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
      clientY: 153,
      preventDefault: sinon.stub()
    };

    view.topo.charmstore = {
      getBundleYAML: function(id, callback) {
        callback(null, {target: {responseText: 'bundle: BUNDLE DATA'}});
      }
    };
    view.topo.bundleImporter = {
      importBundleYAML: function(e) {
        assert.equal(e.target.responseText, 'bundle: BUNDLE DATA');
        done();
      }
    };
    serviceModule.topo = view.topo;
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('should deploy a bundle on file drop events', function(done) {
    const file = { name: '', type: '' };
    const fakeEventObject = {
      dataTransfer: {
        // All we need to fake things out is to have a file.
        files: [file]
      },
      preventDefault: sinon.stub()
    };
    view.topo.bundleImporter = {
      importBundleFile: function(files) {
        assert.deepEqual(files, file);
        done();
      }
    };
    serviceModule.topo = view.topo;
    serviceModule.canvasDropHandler(fakeEventObject);
  });

  it('calls to extract local charm on .zip file drop events', function() {
    const fakeFile = {
      // Using a complex name to make sure the extension filtering works
      name: 'foo-bar.baz.zip',
      // This MIME type is used in Chrome and Firefox, see the
      // following test for uploading a charm zip using IE11.
      type: 'application/zip'
    };
    const fakeEventObject = {
      dataTransfer: {
        // All we need to fake things out is to have a file.
        files: [fakeFile]
      },
      preventDefault: sinon.stub()
    };

    serviceModule.topo = view.topo;
    const extractCharmMetadata = sinon.stub(
      serviceModule, '_extractCharmMetadata');
    cleanups.push(extractCharmMetadata.restore);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce, true);
    const args = extractCharmMetadata.lastCall.args;
    assert.deepEqual(args[0], fakeFile);
    assert.deepEqual(args[1], topo);
    assert.deepEqual(args[2], topo.env);
    assert.deepEqual(args[3], topo.db);
  });

  it('calls to extract local charm on .zip file drop events (IE)', function() {
    const fakeFile = {
      // Using a complex name to make sure the extension filtering works
      name: 'foo-bar.baz.zip',
      // This MIME type is used only in IE11 see the above test
      // for the MIME type used in Firefox and Chrome.
      type: 'application/x-zip-compressed'
    };
    const fakeEventObject = {
      dataTransfer: {
        // All we need to fake things out is to have a file.
        files: [fakeFile]
      },
      preventDefault: sinon.stub()
    };

    serviceModule.topo = view.topo;
    const extractCharmMetadata = sinon.stub(
      serviceModule, '_extractCharmMetadata');
    cleanups.push(extractCharmMetadata.restore);

    serviceModule.canvasDropHandler(fakeEventObject);

    assert.equal(extractCharmMetadata.calledOnce, true);
    const args = extractCharmMetadata.lastCall.args;
    assert.deepEqual(args[0], fakeFile);
    assert.deepEqual(args[1], topo);
    assert.deepEqual(args[2], topo.env);
    assert.deepEqual(args[3], topo.db);
  });

  // XXX: can't stub internal module.
  xit('_extractCharmMetadata: calls ziputils.getEntries()', function() {
    const fileObj = { file: '' },
        topoObj = { topo: '' },
        envObj = { env: '' },
        dbObj = { db: '' };
    const getEntries = sinon.stub(Y.juju.ziputils, 'getEntries');
    cleanups.push(getEntries.restore);
    const findCharmEntries = sinon.stub(
      serviceModule, '_findCharmEntries');
    cleanups.push(findCharmEntries.restore);
    const zipExtractionError = sinon.stub(
      serviceModule, '_zipExtractionError');
    cleanups.push(zipExtractionError);

    serviceModule._extractCharmMetadata(fileObj, topoObj, envObj, dbObj);

    assert.equal(getEntries.calledOnce, true);
    const getEntriesArgs = getEntries.lastCall.args;
    assert.equal(getEntriesArgs[0], fileObj);
    assert.isFunction(getEntriesArgs[1]);
    assert.isFunction(getEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    getEntriesArgs[1]();
    const findCharmArgs = findCharmEntries.lastCall.args;
    assert.deepEqual(findCharmArgs[0], fileObj);
    assert.deepEqual(findCharmArgs[1], topoObj);
    assert.deepEqual(findCharmArgs[2], envObj);
    assert.deepEqual(findCharmArgs[3], dbObj);
    //Call the fail callback
    getEntriesArgs[2]();
    const zipErrorArgs = zipExtractionError.lastCall.args;
    assert.deepEqual(zipErrorArgs[0], dbObj);
  });

  describe('_findCharmEntries', function() {
    let dbObj, envObj, fileObj, topoObj, notificationParams;

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

    // XXX: can't stub internal module.
    xit('finds the files in the zip', function() {
      const entries = { metadata: 'foo' };
      const findEntries = sinon.stub(
        Y.juju.ziputils, 'findCharmEntries').returns(entries);
      cleanups.push(findEntries.restore);
      const readEntries = sinon.stub(
        serviceModule, '_readCharmEntries');
      cleanups.push(readEntries.restore);

      serviceModule._findCharmEntries(fileObj, topoObj, envObj, dbObj, {});

      assert.equal(findEntries.calledOnce, true);
      assert.deepEqual(findEntries.lastCall.args[0], {});
      assert.equal(readEntries.calledOnce, true);
      const readEntriesArgs = readEntries.lastCall.args;
      assert.deepEqual(readEntriesArgs[0], fileObj);
      assert.deepEqual(readEntriesArgs[1], topoObj);
      assert.deepEqual(readEntriesArgs[2], envObj);
      assert.deepEqual(readEntriesArgs[3], dbObj);
      assert.deepEqual(readEntriesArgs[4], entries);
    });

    // XXX: can't stub internal module.
    xit('shows an error notification if there is no metadata.yaml', function() {
      const entries = { foo: 'bar' };
      const findEntries = sinon.stub(
        Y.juju.ziputils, 'findCharmEntries').returns(entries);
      cleanups.push(findEntries.restore);
      const readEntries = sinon.stub(
        serviceModule, '_readCharmEntries');
      cleanups.push(readEntries.restore);

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

  // XXX: can't stub internal module.
  xit('_readCharmEntries: calls ziputils.readCharmEntries', function() {
    const fileObj = { file: '' },
        topoObj = { topo: '' },
        envObj = { env: '' },
        dbObj = { db: '' };
    const readEntries = sinon.stub(Y.juju.ziputils, 'readCharmEntries');
    cleanups.push(readEntries.restore);
    const existingServices = sinon.stub(
      serviceModule, '_checkForExistingServices');
    cleanups.push(existingServices);
    const extractionError = sinon.stub(
      serviceModule, '_zipExtractionError');

    serviceModule._readCharmEntries(fileObj, topoObj, envObj, dbObj, {});

    assert.equal(readEntries.calledOnce, true);
    const readEntriesArgs = readEntries.lastCall.args;
    assert.deepEqual(readEntriesArgs[0], {});
    assert.isFunction(readEntriesArgs[1]);
    assert.isFunction(readEntriesArgs[2]);
    // Check that the callbacks have the proper data bound to them
    // Call the success callback
    readEntriesArgs[1]();
    const existingServicesArgs = existingServices.lastCall.args;
    assert.deepEqual(existingServicesArgs[0], fileObj);
    assert.deepEqual(existingServicesArgs[1], topoObj);
    assert.deepEqual(existingServicesArgs[2], envObj);
    assert.deepEqual(existingServicesArgs[3], dbObj);
    //Call the fail callback
    readEntriesArgs[2]();
    const zipErrorArgs = extractionError.lastCall.args;
    assert.deepEqual(zipErrorArgs[0], dbObj);
    assert.deepEqual(zipErrorArgs[1], fileObj);
  });

  describe('_checkForExistingService', function() {
    let dbObj, deployCharm, contentsObj, envObj, fileObj, getServicesStub,
        jsYamlMock, showInspector, topochangeState, topoObj;

    beforeEach(function() {
      fileObj = { name: 'foo' };
      topochangeState = sinon.stub();
      topoObj = { fire: topochangeState };
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
      assert.equal(topochangeState.calledOnce, true);
    }

    // XXX: can't stub internal module.
    xit('calls to show the upgrade or new inspector', function() {
      setup(this);

      getServicesStub = sinon.stub().returns(['service']);
      dbObj = { services: { getServicesFromCharmName: getServicesStub }};

      serviceModule._checkForExistingServices(
        fileObj, topoObj, envObj, dbObj, contentsObj);

      sharedAssert();

      assert.equal(showInspector.calledOnce, true);
      assert.equal(deployCharm.calledOnce, false);
    });

    // XXX: can't stub internal module.
    xit('calls to deploy the local charm', function() {
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
    let notificationParams;
    const dbObj = {
      notifications: {
        add: function(info) {
          notificationParams = info;
        }
      }
    };
    const fileObj = { name: 'foo' };
    const fadeHelpIndicator = sinon.stub();
    const topo = {
      environmentView: {
        fadeHelpIndicator: fadeHelpIndicator
      }
    };
    serviceModule._zipExtractionError(dbObj, topo, fileObj);

    assert.deepEqual(notificationParams, {
      title: 'Import failed',
      message: 'Import from "' + fileObj.name + '" failed. See console for ' +
          'error object',
      level: 'error'
    });
    assert.equal(fadeHelpIndicator.callCount, 1);
  });

  it('_showUpgradeOrNewInspector: shows the inspector', function() {
    const dbObj = { db: 'db' };
    const fileObj = { name: 'foo' };
    const envObj = { env: 'env' };
    const services = [{ getAttrs: function() {} }];
    const changeState = serviceModule.topo.state.changeState;

    serviceModule._showUpgradeOrNewInspector(services, fileObj, envObj, dbObj);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.lastCall.args[0], {
      gui: {
        inspector: {
          id: null,
          localType: 'update'
        }
      }
    });
  });

  it('_deployLocalCharm: calls to show the inspector', function() {
    const dbObj = { db: 'db' };
    const fileObj = { name: 'foo' };
    const envObj = { env: 'env' };
    const changeState = serviceModule.topo.state.changeState;

    serviceModule._deployLocalCharm(fileObj, envObj, dbObj);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.lastCall.args[0], {
      gui: {
        inspector: {
          id: null,
          localType: 'new'
        }
      }
    });
  });
});

describe('canvasDropHandler', function() {
  let models, serviceModule, view, viewContainer;

  // Requiring this much setup (beforeAll() and beforeEach() to call a single
  // method on a single object is obscene.
  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    const db = new models.Database();
    const env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    view = new EnvironmentView({
      container: viewContainer,
      db: db,
      env: env,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.useTransitions = false;
  });

  afterEach(function() {
    view.destructor();
    viewContainer.remove();
  });

  it('defers its implementatino to _canvasDropHandler', function() {
    const files = {length: 2};
    const evt = {
      dataTransfer: {files: files},
      preventDefault: sinon.stub()
    };
    // Calling both functions with arguments that result in an early-out is the
    // easiest way to show that the one is just a shim around the other.
    assert.equal(
      serviceModule.canvasDropHandler(evt),
      serviceModule._canvasDropHandler(files));
  });

  it('halts the event so FF does not try to reload the page', function(done) {
    const evt = {
      dataTransfer: {files: {length: 2}},
      preventDefault: () => {done();}
    };
    serviceModule.canvasDropHandler(evt);
  });

});

describe('_canvasDropHandler', function() {
  let models, serviceModule, view, viewContainer;

  // Requiring this much setup (beforeAll() and beforeEach() to call a single
  // method on a single object is obscene.
  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    const db = new models.Database();
    const env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    view = new EnvironmentView({
      container: viewContainer,
      db: db,
      env: env,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.useTransitions = false;
  });

  afterEach(function() {
    view.destructor();
    viewContainer.remove();
  });

  it('ignores drop events that contain more than one file', function() {
    const files = {length: 2};
    assert.equal(serviceModule._canvasDropHandler(files), 'event ignored');
  });

  it('deploys charms dropped from the sidebar', function(done) {
    const files = {};
    const self = {
      _deployFromCharmbrowser: function() {done();}
    };
    serviceModule._canvasDropHandler.call(self, files);
  });

  it('extracts a zipped charm directory when dropped', function(done) {
    const file = {name: 'charm.zip', type: 'application/zip'};
    const self = {
      _extractCharmMetadata: function() {done();}
    };
    serviceModule._canvasDropHandler.call(self, [file]);
  });

  it('recognizes zip files of type x-zip-compressed', function(done) {
    const file = {name: 'charm.zip', type: 'application/x-zip-compressed'};
    const files = {length: 1, 0: file};
    const self = {
      _extractCharmMetadata: function() {done();}
    };
    serviceModule._canvasDropHandler.call(self, files);
  });

});

describe('updateElementVisibility', function() {
  let cleanups, models, serviceModule, view, viewContainer;

  beforeAll(function(done) {
    YUI(GlobalConfig).use(['juju-models'], function(Y) {
      models = Y.namespace('juju.models');
      window.yui = Y;
      done();
    });
  });

  beforeEach(function() {
    cleanups = [];
    viewContainer = utils.makeContainer(this);
    const db = new models.Database();
    const env = {
      update_annotations: function(name, type, data) {},
      get: function() {}};
    view = new EnvironmentView({
      container: viewContainer,
      db: db,
      env: env,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    serviceModule = view.topo.modules.ServiceModule;
    serviceModule.useTransitions = false;
  });

  afterEach(() => {
    cleanups.forEach(cleanup => cleanup());
    cleanups = null;
    view.destructor();
    viewContainer.remove();
  });

  it('is called on update', function() {
    serviceModule.rendered = true;
    serviceModule.service_scale = true;
    serviceModule.dragBehaviour = true;
    const update = sinon.stub(serviceModule, 'updateElementVisibility');
    const updateData = sinon.stub(serviceModule, 'updateData');
    cleanups.push(updateData.restore);
    cleanups.push(update.restore);
    serviceModule.update();
    assert.equal(update.callCount, 1);
  });

  it('categorizes and calls the appropriate vis method', function() {
    const fade = sinon.stub(serviceModule, 'fade');
    const hide = sinon.stub(serviceModule, 'hide');
    const show = sinon.stub(serviceModule, 'show');
    const highlight = sinon.stub(serviceModule, 'highlight');
    const unhighlight = sinon.stub(serviceModule, 'unhighlight');
    cleanups.concat([
      fade.restore, hide.restore, show.restore, highlight.restore,
      unhighlight.restore
    ]);
    const serviceList = new models.ServiceList();
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
    serviceModule.topo.db.services = serviceList;
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
