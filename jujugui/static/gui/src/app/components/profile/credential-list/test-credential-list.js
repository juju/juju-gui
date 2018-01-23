/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

const ProfileCredentialList = require('./credential-list');
const BasicTable = require('../../basic-table/basic-table');
const GenericButton = require('../../generic-button/generic-button');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('ProfileCredentialList', () => {
  let cloudData, credentialData, modelData;

  beforeEach(() => {
    cloudData = {
      aws: {cloudType: 'ec2'},
      azure: {cloudType: 'azure'},
      google: {cloudType: 'gce'}
    };

    credentialData = [{
      names: ['aws_foo@external_cred1', 'aws_foo@external_testcred'],
      displayNames: ['cred1', 'testcred']
    }, {
      names: ['azure_foo@external_cred1'],
      displayNames: ['cred1']
    }, {
      names: ['google_foo@external_admin'],
      displayNames: ['admin']
    }];

    modelData = [{
      owner: 'foo@external',
      credential: credentialData[0].names[0],
      name: 'testmodel1'
    }, {
      owner: 'foo@external',
      credential: credentialData[1].names[0],
      name: 'testmodel2'
    }, {
      owner: 'bar@external',
      credential: 'some other credential',
      name: 'sharedmodel1'
    }];
  });

  function renderComponentToDOM(options = {}) {
    const controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback(null, modelData)
    };
    const component = ReactTestUtils.renderIntoDocument(
      <ProfileCredentialList
        addNotification={options.addNotification || sinon.stub()}
        controllerAPI={options.controllerAPI || controllerAPI}
        username={options.username || 'foo@external'} />);
    return component;
  }

  function shallowRenderComponent(options = {}) {
    const controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback(null, modelData)
    };
    return jsTestUtils.shallowRender(
      <ProfileCredentialList
        addNotification={options.addNotification || sinon.stub()}
        controllerAPI={options.controllerAPI || controllerAPI}
        credential="azure_foo@external_cred1"
        username={options.username || 'foo@external'} />, true);
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
  function loopCheck(component, callback, duration=10) {
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
    const component = renderComponentToDOM();
    loopCheck(component, () => {
      assert.equal(component.state.loading, false);
      // Check that the map has the proper values.
      const map = component.state.credentialMap;
      assert.deepEqual(
        map.get('aws_foo@external_cred1'),
        {cloud: 'aws', displayName: 'cred1', models: ['testmodel1']});
      assert.deepEqual(
        map.get('aws_foo@external_testcred'),
        {cloud: 'aws', displayName: 'testcred'});
      assert.deepEqual(
        map.get('azure_foo@external_cred1'),
        {cloud: 'azure', displayName: 'cred1', models: ['testmodel2']});
      assert.deepEqual(
        map.get('google_foo@external_admin'),
        {cloud: 'google', displayName: 'admin'});
      removeComponent(component);
      done();
    });
  });

  function testRequestErrorNotification(controllerAPI, done) {
    const addNotification = sinon.stub();
    const component = renderComponentToDOM({addNotification, controllerAPI});
    loopCheck(component, () => {
      const errorMsg = 'Unable to fetch credential data';
      assert.equal(addNotification.callCount, 1);
      assert.deepEqual(addNotification.args[0][0], {
        title: errorMsg,
        message: errorMsg,
        level: 'error'
      });
      removeComponent(component);
      done();
    });
  }

  it('throws a notification if listClouds request fail', done => {
    const controllerAPI = {
      listClouds: callback => callback('error', null),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback(null, modelData)
    };
    testRequestErrorNotification(controllerAPI, done);
  });

  it('throws a notification if getCloudCredentialNames request fail', done => {
    const controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback('error', credentialData),
      listModelsWithInfo: callback => callback(null, modelData)
    };
    testRequestErrorNotification(controllerAPI, done);
  });

  it('throws a notification if listModelsWithInfo request fail', done => {
    const controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback('error', modelData)
    };
    testRequestErrorNotification(controllerAPI, done);
  });

  it('can render', done => {
    const renderer = shallowRenderComponent();
    const instance = renderer.getMountedInstance();
    instance.componentDidMount().then(() => {
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="profile-credential-list">
          <div className="four-col">
            <h2 className="profile__title">
              My credentials
              <span className="profile__title-count">
                (4)
              </span>
            </h2>
          </div>
          <div className="push-four four-col">
            <div className="profile-credential-list__add">
              <GenericButton>Add credentials</GenericButton>
            </div>
          </div>
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Name',
              columnSize: 6
            }, {
              content: 'Provider',
              columnSize: 2
            }, {
              content: 'Used by',
              columnSize: 3
            }, {
              content: 'Action',
              columnSize: 1
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={[{
              classes: null,
              columns: [{
                content: 'cred1',
                columnSize: 6
              }, {
                content: 'aws',
                columnSize: 2
              }, {
                content: 'testmodel1',
                columnSize: 2
              }, {
                content: '...',
                columnSize: 1
              }],
              key: 'aws_foo@external_cred1'
            }, {
              classes: null,
              columns: [{
                content: 'testcred',
                columnSize: 6
              }, {
                content: 'aws',
                columnSize: 2
              }, {
                content: '-',
                columnSize: 2
              }, {
                content: '...',
                columnSize: 1
              }],
              key: 'aws_foo@external_testcred'
            }, {
              classes: ['profile-credential-list--highlighted'],
              columns: [{
                content: 'cred1',
                columnSize: 6
              }, {
                content: 'azure',
                columnSize: 2
              }, {
                content: 'testmodel2',
                columnSize: 2
              }, {
                content: '...',
                columnSize: 1
              }],
              key: 'azure_foo@external_cred1'
            }, {
              classes: null,
              columns: [{
                content: 'admin',
                columnSize: 6
              }, {
                content: 'google',
                columnSize: 2
              }, {
                content: '-',
                columnSize: 2
              }, {
                content: '...',
                columnSize: 1
              }],
              key: 'google_foo@external_admin'
            }
            ]} />
        </div>
      );
      expect(output).toEqualJSX(expected);
      done();
    });
  });

});
