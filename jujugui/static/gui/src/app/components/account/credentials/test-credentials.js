/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AccountCredentials = require('./credentials');
const ButtonRow = require('../../button-row/button-row');
const DeploymentCloud = require('../../deployment-flow/cloud/cloud');
const DeploymentCredentialAdd = require('../../deployment-flow/credential/add/add');
const ExpandingRow = require('../../expanding-row/expanding-row');
const Popup = require('../../popup/popup');
const Spinner = require('../../spinner/spinner');
const GenericButton = require('../../generic-button/generic-button');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('AccountCredentials', () => {
  let acl, controllerIsReady, getCloudCredentialNames, getCloudProviderDetails,
      listClouds;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    controllerIsReady = sinon.stub().withArgs().returns(true);
    getCloudProviderDetails = sinon.stub();
    getCloudProviderDetails.withArgs('aws').returns({title: 'Amazon'});
    getCloudProviderDetails.withArgs('gce').returns({title: 'Google'});
    listClouds = sinon.stub().callsArgWith(0, null, {
      aws: {
        cloudType: 'aws'
      },
      gce: {
        cloudType: 'gce'
      },
      guimaas: {
        cloudType: 'maas'
      }
    });
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, [{
      names: ['aws_spinach@external_test1'],
      displayNames: ['test1']
    }, {
      names: ['gce_spinach@external_test2'],
      displayNames: ['test2']
    }]);
  });

  function renderComponent(options = {}) {
    const renderer = jsTestUtils.shallowRender(
      <AccountCredentials
        acl={acl}
        addNotification={options.addNotification || sinon.stub()}
        controllerIsReady={controllerIsReady}
        generateCloudCredentialName={options.generateCloudCredentialName || sinon.stub()}
        getCloudCredentialNames={options.getCloudCredentialNames || getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={options.listClouds || listClouds}
        revokeCloudCredential={options.revokeCloudCredential || sinon.stub()}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        updateCloudCredential={options.updateCloudCredential || sinon.stub()}
        username="spinach@external"
        validateForm={options.sendAnalytics || sinon.stub()} />, true);
    return {
      renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('can display a spinner when loading credentials', () => {
    getCloudCredentialNames = sinon.stub();
    const comp = renderComponent();
    const instance = comp.instance;
    const expected = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Add
            </GenericButton>
          </div>
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <div></div>
          <div className="twelve-col">
            {null}
          </div>
        </ExpandingRow>
        <Spinner />
      </div>);
    expect(comp.output).toEqualJSX(expected);
  });

  it('does not allow for adding/removing credentials on local cloud', () => {
    listClouds = sinon.stub().callsArgWith(0, null, {localhost: {}});
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, [{
      names: ['localhost_admin'],
      displayNames: ['localcred']
    }]);
    const comp = renderComponent({
      listClouds,
      getCloudCredentialNames
    });
    const output = comp.output;
    const expectedOutput = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right" />
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <div></div>
          <div className="twelve-col">
            {null}
          </div>
        </ExpandingRow>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="six-col user-profile__list-col">
              Name
            </span>
            <span className="six-col last-col user-profile__list-col">
              Provider
            </span>
          </li>
          {[
            <li className="user-profile__list-row twelve-col"
              key="aws_spinach@external_test1">
              <span className="six-col user-profile__list-col">
                localcred
              </span>
              <span className="three-col user-profile__list-col">
                localhost
              </span>
              <span className="three-col last-col user-profile__list-col no-margin-bottom">
                <ButtonRow
                  buttons={[{
                    action: function() {},
                    disabled: true,
                    title: 'Remove',
                    type: 'neutral'
                  }, {
                    action: function() {},
                    disabled: true,
                    title: 'Edit',
                    type: 'neutral'
                  }]} />
              </span>
            </li>
          ]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expectedOutput);
  });

  it('can render', () => {
    const comp = renderComponent();
    const instance = comp.instance;
    const output = comp.output;
    const expected = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Add
            </GenericButton>
          </div>
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <div></div>
          <div className="twelve-col">
            {null}
          </div>
        </ExpandingRow>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="six-col user-profile__list-col">
              Name
            </span>
            <span className="six-col last-col user-profile__list-col">
              Provider
            </span>
          </li>
          {[
            <li className="user-profile__list-row twelve-col"
              key="aws_spinach@external_test1">
              <span className="six-col user-profile__list-col">
                test1
              </span>
              <span className="three-col user-profile__list-col">
                Amazon
              </span>
              <span className="three-col last-col user-profile__list-col no-margin-bottom">
                <ButtonRow
                  buttons={[{
                    action: function() {},
                    disabled: false,
                    title: 'Remove',
                    type: 'neutral'
                  }, {
                    action: function() {},
                    disabled: false,
                    title: 'Edit',
                    type: 'neutral'
                  }]} />
              </span>
            </li>,
            <li className="user-profile__list-row twelve-col"
              key="gce_spinach@external_test2">
              <span className="six-col user-profile__list-col">
                  test2
              </span>
              <span className="three-col user-profile__list-col">
                  Google
              </span>
              <span className="three-col last-col user-profile__list-col no-margin-bottom">
                <ButtonRow
                  buttons={[{
                    action: function() {},
                    disabled: false,
                    title: 'Remove',
                    type: 'neutral'
                  }, {
                    action: function() {},
                    disabled: false,
                    title: 'Edit',
                    type: 'neutral'
                  }]} />
              </span>
            </li>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when there are no credentials', () => {
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, []);
    const comp = renderComponent({
      getCloudCredentialNames
    });
    const instance = comp.instance;
    const expected = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Add
            </GenericButton>
          </div>
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <div></div>
          <div className="twelve-col">
            {null}
          </div>
        </ExpandingRow>
        <div>
          No credentials available.
        </div>
      </div>);
    expect(comp.output).toEqualJSX(expected);
  });

  it('can display errors when getting clouds', () => {
    const addNotification = sinon.stub();
    listClouds.callsArgWith(0, 'Uh oh!', null);
    renderComponent({
      addNotification,
      listClouds
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to list clouds',
      message: 'Unable to list clouds: Uh oh!',
      level: 'error'
    });
  });

  it('can display errors when getting credential names', () => {
    const addNotification = sinon.stub();
    getCloudCredentialNames = sinon.stub().callsArgWith(
      1, 'Uh oh!', null);
    renderComponent({
      addNotification,
      getCloudCredentialNames
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to get names for credentials',
      message: 'Unable to get names for credentials: Uh oh!',
      level: 'error'
    });
  });

  it('can display a remove credentials confirmation', () => {
    const revokeCloudCredential = sinon.stub();
    const comp = renderComponent({
      revokeCloudCredential
    });
    const instance = comp.instance;
    let output = comp.output;
    output.props.children[2].props.children[1][0].props
      .children[2].props.children.props.buttons[0].action();
    output = comp.renderer.getRenderOutput();
    const expected = (
      <Popup
        buttons={[{
          title: 'Cancel',
          action: instance._handleDeleteCredential,
          type: 'inline-neutral'
        }, {
          title: 'Continue',
          action: instance._deleteCredential,
          type: 'destructive'
        }]}
        title="Remove credentials">
        <p>
          Are you sure you want to remove these credentials?
        </p>
      </Popup>);
    expect(output.props.children[3]).toEqualJSX(expected);
  });

  it('can remove credentials', () => {
    const revokeCloudCredential = sinon.stub();
    const comp = renderComponent({
      revokeCloudCredential
    });
    let output = comp.output;
    output.props.children[2].props.children[1][0].props
      .children[2].props.children.props.buttons[0].action();
    output = comp.renderer.getRenderOutput();
    output.props.children[3].props.buttons[1].action();
    assert.equal(revokeCloudCredential.callCount, 1);
    assert.equal(revokeCloudCredential.args[0][0], 'aws_spinach@external_test1');
  });

  it('can display errors when deleting credentials', () => {
    const addNotification = sinon.stub();
    const revokeCloudCredential = sinon.stub().callsArgWith(1, 'Uh oh!');
    const comp = renderComponent({
      addNotification,
      revokeCloudCredential
    });
    let output = comp.output;
    output.props.children[2].props.children[1][0].props
      .children[2].props.children.props.buttons[0].action();
    output = comp.renderer.getRenderOutput();
    output.props.children[3].props.buttons[1].action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to revoke the cloud credential',
      message: 'Unable to revoke the cloud credential: Uh oh!',
      level: 'error'
    });
  });

  it('removes the credential from the list', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, null);
    const comp = renderComponent({
      revokeCloudCredential
    });
    const instance = comp.instance;
    let output = comp.output;
    let credentials = output.props.children[2].props.children[1];
    credentials[0].props.children[2].props.children.props.buttons[0].action();
    output = comp.renderer.getRenderOutput();
    output.props.children[3].props.buttons[1].action();
    output = comp.renderer.getRenderOutput();
    credentials = output.props.children[2].props.children[1];
    const expected = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Add
            </GenericButton>
          </div>
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <div></div>
          <div className="twelve-col">
            {null}
          </div>
        </ExpandingRow>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="six-col user-profile__list-col">
              Name
            </span>
            <span className="six-col last-col  user-profile__list-col">
              Provider
            </span>
          </li>
          {[<li className="user-profile__list-row twelve-col"
            key="gce_spinach@external_test2">
            <span className="six-col user-profile__list-col">
                test2
            </span>
            <span className="three-col user-profile__list-col">
                Google
            </span>
            <span className="three-col last-col user-profile__list-col no-margin-bottom">
              <ButtonRow
                buttons={[{
                  action: function() {},
                  disabled: false,
                  title: 'Remove',
                  type: 'neutral'
                }, {
                  action: function() {},
                  disabled: false,
                  title: 'Edit',
                  type: 'neutral'
                }]} />
            </span>
          </li>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can abort the requests when unmounting', () => {
    const abort = sinon.stub();
    getCloudCredentialNames = sinon.stub().returns({abort: abort});
    const comp = renderComponent({
      getCloudCredentialNames
    });
    comp.renderer.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can show the add credentials form', () => {
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, []);
    const addNotification = sinon.stub();
    const comp = renderComponent({
      addNotification,
      getCloudCredentialNames
    });
    const instance = comp.instance;
    let output = comp.output;
    output.props.children[0].props.children[1].props.children.props.action();
    output = comp.renderer.getRenderOutput();
    const expected = (
      <div className="account__section account__credentials twelve-col">
        <div className="user-profile__header twelve-col no-margin-bottom">
          <div className="left">
            Cloud credentials
          </div>
          <div className="right">
            <GenericButton
              action={instance._toggleAdd}
              type="inline-neutral">
              Cancel
            </GenericButton>
          </div>
        </div>
        <ExpandingRow
          classes={{'twelve-col': true}}
          clickable={false}
          expanded={true}>
          <div></div>
          <div className="twelve-col">
            <div>
              {null}
              <DeploymentCloud
                acl={acl}
                addNotification={addNotification}
                cloud={null}
                controllerIsReady={controllerIsReady}
                listClouds={listClouds}
                getCloudProviderDetails={getCloudProviderDetails}
                setCloud={instance._setCloud} />
              {null}
            </div>
          </div>
        </ExpandingRow>
        <div>
          No credentials available.
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display correctly with a chosen cloud', () => {
    const addNotification = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    const updateCloudCredential = sinon.stub();
    const validateForm = sinon.stub();
    const sendAnalytics = sinon.stub();
    const comp = renderComponent({
      addNotification,
      generateCloudCredentialName,
      updateCloudCredential,
      validateForm,
      sendAnalytics
    });
    const instance = comp.instance;
    let output = comp.output;
    output.props.children[0].props.children[1].props.children.props.action();
    instance._setCloud({title: 'aws'});
    output = comp.renderer.getRenderOutput();
    const expected = (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={false}
        expanded={true}>
        <div></div>
        <div className="twelve-col">
          <div>
            <div className="account__credentials-choose-cloud">
              <GenericButton
                action={
                  output.props.children[1].props.children[1].props.children
                    .props.children[0].props.children.props.action}
                type="inline-neutral">
                Change cloud
              </GenericButton>
            </div>
            <DeploymentCloud
              acl={acl}
              addNotification={addNotification}
              cloud={{title: 'aws'}}
              controllerIsReady={controllerIsReady}
              listClouds={listClouds}
              getCloudProviderDetails={getCloudProviderDetails}
              setCloud={instance._setCloud} />
            <DeploymentCredentialAdd
              acl={acl}
              addNotification={addNotification}
              close={instance._toggleAdd}
              cloud={{title: 'aws'}}
              credentialName={undefined}
              credentials={['test1', 'test2']}
              getCloudProviderDetails={getCloudProviderDetails}
              generateCloudCredentialName={generateCloudCredentialName}
              getCredentials={instance._getClouds}
              sendAnalytics={sendAnalytics}
              setCredential={instance._setCredential}
              updateCloudCredential={updateCloudCredential}
              user="spinach@external"
              validateForm={validateForm} />
          </div>
        </div>
      </ExpandingRow>);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('clears the cloud when the form is closed', () => {
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, []);
    const addNotification = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    const updateCloudCredential = sinon.stub();
    const validateForm = sinon.stub();
    const comp = renderComponent({
      addNotification,
      generateCloudCredentialName,
      updateCloudCredential,
      validateForm
    });
    const instance = comp.instance;
    let output = comp.output;
    // Open the form.
    output.props.children[0].props.children[1].props.children.props.action();
    instance._setCloud({title: 'aws'});
    // Close the form.
    output = comp.renderer.getRenderOutput();
    output.props.children[1].props.children[1].props.children
      .props.children[2].props.close();
    assert.isNull(instance.state.cloud);
  });
});
