/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

const ProfileCredentialList = require('./credential-list');
const BasicTable = require('../../basic-table/basic-table');
const CredentialAddEdit = require('../../credential-add-edit/credential-add-edit');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('ProfileCredentialList', () => {
  let acl, cloudData, controllerAPI, credentialData, initUtils, modelData;

  beforeEach(() => {
    acl = {
      isReadOnly: sinon.stub()
    };
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
    controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback(null, modelData),
      updateCloudCredential: sinon.stub()
    };
    initUtils = {
      generateCloudCredentialName: sinon.stub(),
      getCloudProviderDetails: sinon.stub(),
      reshape: sinon.stub(),
      validateForm: sinon.stub()
    };
  });

  function renderComponentToDOM(options = {}) {
    const component = ReactTestUtils.renderIntoDocument(
      <ProfileCredentialList
        acl={acl}
        addNotification={options.addNotification || sinon.stub()}
        controllerAPI={options.controllerAPI || controllerAPI}
        controllerIsReady={options.controllerIsReady || sinon.stub()}
        initUtils={options.initUtils || initUtils}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        username={options.username || 'foo@external'} />);
    return component;
  }

  function shallowRenderComponent(options = {}) {
    return jsTestUtils.shallowRender(
      <ProfileCredentialList
        acl={acl}
        addNotification={options.addNotification || sinon.stub()}
        controllerAPI={options.controllerAPI || controllerAPI}
        credential="azure_foo@external_cred1"
        controllerIsReady={options.controllerIsReady || sinon.stub()}
        initUtils={options.initUtils || initUtils}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
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

  it('does not fail if models exist with unkonwn credentials', done => {
    // Add a non-shared model without a matching credential. This is not-shared
    // because the owner is the owner defined in these tests foo@external.
    modelData.push({
      owner: 'foo@external',
      credential: 'a missing credential',
      name: 'modelwithmissingcred'
    });
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
  }

  it('throws a notification if listClouds request fail', done => {
    controllerAPI.listClouds = callback => callback('error', null);
    testRequestErrorNotification(controllerAPI, done);
  });

  it('throws a notification if getCloudCredentialNames request fail', done => {
    controllerAPI.getCloudCredentialNames = (clouds, callback) =>
      callback('error', credentialData);
    testRequestErrorNotification(controllerAPI, done);
  });

  it('throws a notification if listModelsWithInfo request fail', done => {
    const controllerAPI = {
      listClouds: callback => callback(null, cloudData),
      getCloudCredentialNames: (clouds, callback) => callback(null, credentialData),
      listModelsWithInfo: callback => callback('error', modelData),
      updateCloudCredential: sinon.stub()
    };
    testRequestErrorNotification(controllerAPI, done);
  });

  it('can render', done => {
    const renderer = shallowRenderComponent();
    const instance = renderer.getMountedInstance();
    instance._getClouds().then(() => {
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
              <GenericButton
                action={sinon.stub()}
                type="inline-neutral">
                Add credentials
              </GenericButton>
            </div>
          </div>
          <ExpandingRow
            classes={{'twelve-col': true}}
            clickable={false}
            expanded={this.state.showAdd}>
            <div></div>
            <div className="twelve-col">
              <CredentialAddEdit
                key="deployment-credential-add"
                acl={acl}
                addNotification={sinon.stub()}
                controllerAPI={{
                  listClouds: sinon.stub(),
                  updateCloudCredential: sinon.stub()
                }}
                controllerIsReady={sinon.stub()}
                credential=""
                credentials={[]}
                initUtils={initUtils}
                onCancel={sinon.stub()}
                onCredentialUpdated={sinon.stub()}
                sendAnalytics={sinon.stub()}
                username="spinach@external" />
            </div>
          </ExpandingRow>
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
                columnSize: 3
              }, {
                content: (
                  <MoreMenu
                    icon="contextual-menu-horizontal"
                    items={[{
                      label: 'Edit',
                      action: () => {}
                    }, {
                      label: 'Delete',
                      action: () => {}
                    }]} />),
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
                columnSize: 3
              }, {
                content: (
                  <MoreMenu
                    icon="contextual-menu-horizontal"
                    items={[{
                      label: 'Edit',
                      action: () => {}
                    }, {
                      label: 'Delete',
                      action: () => {}
                    }]} />),
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
                columnSize: 3
              }, {
                content: (
                  <MoreMenu
                    icon="contextual-menu-horizontal"
                    items={[{
                      label: 'Edit',
                      action: () => {}
                    }, {
                      label: 'Delete',
                      action: () => {}
                    }]} />),
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
                columnSize: 3
              }, {
                content: (
                  <MoreMenu
                    icon="contextual-menu-horizontal"
                    items={[{
                      label: 'Edit',
                      action: () => {}
                    }, {
                      label: 'Delete',
                      action: () => {}
                    }]} />),
                columnSize: 1
              }],
              key: 'google_foo@external_admin'
            }
            ]} />
        </div>
      );
      expect(output).toEqualJSX(expected);
    }).finally(done);
  });

});
