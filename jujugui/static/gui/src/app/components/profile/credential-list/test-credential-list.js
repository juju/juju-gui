/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');
const deepmerge = require('deepmerge');
const enzyme = require('enzyme');

const jujulibTestHelper = require('jujulib/api/test-helpers');
const jujulibCloudFacade = require('jujulib/api/facades/cloud-v2.js');
const jujulibModelManager = require('jujulib/api/facades/model-manager-v4.js');
const cloudResponse = require('jujulib/tests/data/cloud-response');
const modelResponse = require('jujulib/tests/data/modelmanager-response');

const ProfileCredentialList = require('./credential-list');

describe('ProfileCredentialList', () => {
  let acl;

  let jujuConnection = null;
  let jujuWebsocket = null;

  beforeEach(done => {
    acl = {
      isReadOnly: sinon.stub()
    };
    const options = {
      facades: [
        jujulibCloudFacade,
        jujulibModelManager
      ]
    };

    const responseFacades = [{
      name: 'Cloud', versions: [2]
    }, {
      name: 'ModelManager', versions: [4]
    }];

    jujulibTestHelper.makeConnectionWithResponse(
      assert, options, responseFacades, (conn, ws) => {
        jujuConnection = conn;
        jujuWebsocket = ws;
        done();
      });
  });

  afterEach(() => {
    jujuConnection = null;
    jujuWebsocket = null;
  });

  function getComponent(options = {}) {
    return (
      <ProfileCredentialList
        acl={acl}
        addNotification={options.addNotification || sinon.stub()}
        cloudFacade={options.cloudFacade || jujuConnection.facades.cloud}
        modelManager={options.modelManager || jujuConnection.facades.modelManager}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        userName={options.username || 'foo@external'} />);
  }

  const renderComponentToDOM =
    options => ReactTestUtils.renderIntoDocument(getComponent(options));

  const shallowRenderComponent = options => enzyme.shallow(getComponent(options));

  function setupDefaultReplies() {
    jujuWebsocket.queueReplies(new Map([
      [2, cloudResponse.clouds],
      [3, cloudResponse.userCredentials],
      [4, modelResponse.listModelSummaries]
    ]));
  }

  /**
    Some tasks are done async in the component. This method checks to see when
    the component has registered that it has finished loading then calls
    the supplied callback to complete the assertions
    @param {Object} component The rendered React component.
    @param {Function} callback The callback to call once the state changes
      to loading: true.
    @param {Integer} duration How long to wait before each iteration. Default 10ms.
  */
  function loopCheck(component, callback, duration = 10) {
    let loopCount = 0;
    const timer = setInterval(() => {
      loopCount += 1;
      if (component.state.loading === true) {
        if (loopCount === 10) {
          // We have tried too long, quit.
          clearInterval(timer);
          removeComponent(component);
          assert.fail(null, null, `timeout, tried ${loopCount} times`);
        }
        return;
      }
      clearInterval(timer);
      callback();
    }, duration);
  }

  function removeComponent(component) {
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
  }

  it('fetches the necessary data on mount', done => {
    setupDefaultReplies();
    const component = renderComponentToDOM();
    loopCheck(component, () => {
      assert.equal(component.state.loading, false);
      expect(Array.from(component.state.credentialMap)).toMatchSnapshot();
      removeComponent(component);
      done();
    });
  });

  it('does not fail if models exist with unkonwn credentials', done => {
    // Add a non-shared model without a matching credential. This is not-shared
    // because the owner is the owner defined in these tests foo@external.
    const updatedModelSummaries = deepmerge({}, modelResponse.listModelSummaries);
    updatedModelSummaries.response.results.push({result: {
      owner: 'foo@external',
      credential: 'a missing credential',
      name: 'modelwithmissingcred'
    }});
    jujuWebsocket.queueReplies(new Map([
      [2, cloudResponse.clouds],
      [3, cloudResponse.userCredentials],
      [4, updatedModelSummaries]
    ]));
    const component = renderComponentToDOM();
    loopCheck(component, () => {
      assert.equal(component.state.loading, false);
      expect(Array.from(component.state.credentialMap)).toMatchSnapshot();
      removeComponent(component);
      done();
    });
  });

  it('throws a notification if transport requests fail', done => {
    // set the readystate in the websocket to something other than 1 so the
    // request fails.
    jujuWebsocket.readyState = 0;
    const addNotification = sinon.stub();
    const component = renderComponentToDOM({
      addNotification
    });
    loopCheck(component, () => {
      const errorMsg = 'Unable to fetch credential data';
      // As this is using renderIntoDocument then presumably child components
      // could also call addNotification.
      assert.equal(addNotification.callCount >= 1, true);
      assert.deepEqual(addNotification.args[addNotification.args.length - 1][0], {
        title: errorMsg,
        message: errorMsg,
        level: 'error'
      });
      removeComponent(component);
      done();
    });
  });

  it('can render', done => {
    setupDefaultReplies();
    const component = shallowRenderComponent();
    loopCheck(component, () => {
      component.update();
      expect(component).toMatchSnapshot();
      done();
    });
  });

  it('can show the add form', done => {
    setupDefaultReplies();
    const component = shallowRenderComponent();
    component.instance().componentDidMount();
    loopCheck(component, () => {
      component.find('Button').props().action();
      component.update();
      expect(component).toMatchSnapshot();
      done();
    });
  });

  it('can show the edit form', done => {
    setupDefaultReplies();
    const component = shallowRenderComponent();
    const instance = component.instance();
    loopCheck(component, () => {
      component.update();
      instance._setEditCredential('cloudcred-google_thedr@external_default');
      component.update();
      expect(component).toMatchSnapshot();
      done();
    });
  });

  it('can show the UI to delete a credential', done => {
    setupDefaultReplies();
    const component = shallowRenderComponent();
    const instance = component.instance();
    loopCheck(component, () => {
      component.update();
      instance._setDeleteCredential('cloudcred-google_thedr@external_default');
      component.update();
      expect(component).toMatchSnapshot();
      done();
    });

  });
});
