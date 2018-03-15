/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentCredential = require('./credential');
const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const ExpandingRow = require('../../expanding-row/expanding-row');
const DeploymentCredentialAdd = require('./add/add');

describe('DeploymentCredential', function() {
  var acl, sendAnalytics, cloud, credentials, regions, credentialNames, user;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentCredential
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      cloud={options.cloud === undefined ? cloud : options.cloud}
      controllerIsReady={options.controllerIsReady || sinon.stub().returns(true)}
      credential={options.credential}
      editable={options.editable === undefined ? true : options.editable}
      generateCloudCredentialName={options.generateCloudCredentialName || sinon.stub()}
      getCloudCredentialNames={
        options.getCloudCredentialNames || sinon.stub().callsArgWith(1, null, credentialNames)}
      getCloudCredentials={
        options.getCloudCredentials || sinon.stub().callsArgWith(1, null, credentials)}
      getCloudProviderDetails={options.getCloudProviderDetails || sinon.stub()}
      region={options.region}
      sendAnalytics={options.sendAnalytics || sendAnalytics}
      setCredential={options.setCredential || sinon.stub()}
      setRegion={options.setRegion || sinon.stub()}
      updateCloudCredential={options.updateCloudCredential || sinon.stub()}
      user={options.user === undefined ? user : options.user}
      validateForm={options.validateForm || sinon.stub()} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    sendAnalytics = sinon.stub();
    regions = [{name: 'test-region'}];
    cloud = {id: 'azure', id: 'azure', regions: regions};
    credentials = {
      'lxd_admin@local_default': {
        displayName: 'default'
      }
    };
    credentialNames = [{names: ['lxd_admin@local_default']}];
    user = 'user-admin';
  });

  it('can display a loader when loading regions and credentials', function() {
    const wrapper = renderComponent({ getCloudCredentialNames: sinon.stub() });
    var expected = (
      <div className="clearfix">
        <div className="deployment-credential__loading">
          <Spinner />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render with a cloud', function() {
    const wrapper = renderComponent({
      getCloudCredentials: sinon.stub().callsArgWith(1, null, [])
    });
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <DeploymentCredentialAdd
            acl={acl}
            addNotification={sinon.stub()}
            cloud={cloud}
            credentials={[]}
            generateCloudCredentialName={sinon.stub()}
            getCloudProviderDetails={sinon.stub()}
            onCancel={null}
            onCredentialUpdated={
              wrapper.find('DeploymentCredentialAdd').prop('onCredentialUpdated')}
            sendAnalytics={sendAnalytics}
            updateCloudCredential={sinon.stub()}
            user={user}
            validateForm={sinon.stub()} />
        </ExpandingRow>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render when not editable', function() {
    const wrapper = renderComponent({
      credential: 'lxd_admin@local_default',
      editable: false,
      region: 'north-north-west'
    });
    const select = wrapper.find('InsetSelect').at(1);
    assert.equal(select.prop('disabled'), true);
    assert.deepEqual(select.prop('options'), [
      {label: 'Default', value: ''},
      {label: 'north-north-west', value: 'north-north-west'}
    ]);
    assert.equal(wrapper.find('DeploymentCredentialAdd').length, 0);
    assert.equal(wrapper.find('ExpandingRow').prop('expanded'), false);
  });

  it('can show existing credentials', function() {
    const wrapper = renderComponent();
    var expected = (
      <form className="deployment-credential__form">
        <div className="prepend-two four-col">
          <InsetSelect
            disabled={false}
            label="Credential"
            onChange={wrapper.find('InsetSelect').at(0).prop('onChange')}
            options={[{
              label: 'default',
              value: 'lxd_admin@local_default'
            }, {
              label: 'Add credential...',
              value: 'add-credential'
            }]}
            ref="credential"
            value={undefined} />
        </div>
        <div className="four-col deployment-credential__form-region">
          <InsetSelect
            disabled={false}
            label="Region"
            onChange={sinon.stub()}
            options={[
              {label: 'Default', value: ''},
              {label: 'test-region', value: 'test-region'}
            ]}
            value={undefined} />
        </div>
      </form>);
    assert.compareJSX(wrapper.find('.deployment-credential__form'), expected);
  });

  it('selects an initial credential', function() {
    var setCredential = sinon.stub();
    renderComponent({ setCredential });
    assert.equal(setCredential.callCount, 1);
    assert.equal(setCredential.args[0][0], 'lxd_admin@local_default');
  });

  it('can select a credential after loading the list of creds', function() {
    var setCredential = sinon.stub();
    credentials['new@test'] = {
      name: 'new@test'
    };
    const wrapper = renderComponent({ setCredential });
    const instance = wrapper.instance();
    instance.refs = {credential: {setValue: sinon.stub()}};
    instance._getCredentials('new@test');
    assert.equal(setCredential.callCount, 2);
    assert.equal(setCredential.args[1][0], 'new@test');
    assert.equal(instance.refs.credential.setValue.callCount, 1);
    assert.equal(instance.refs.credential.setValue.args[0][0], 'new@test');
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    wrapper.find('InsetSelect').forEach(select => {
      assert.equal(select.prop('disabled'), true);
    });
  });

  it('can handle a cloud without regions', function() {
    delete cloud.regions;
    const wrapper = renderComponent();
    const expected = (
      <div className="four-col deployment-credential__form-region">
        <InsetSelect
          disabled={false}
          label="Region"
          onChange={sinon.stub()}
          options={[
            {label: 'Default', value: ''}
          ]}
          value={undefined} />
      </div>);
    assert.compareJSX(wrapper.find('.deployment-credential__form-region'), expected);
  });

  it('can navigate to the add credentials form', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('DeploymentCredentialAdd').length, 0);
    wrapper.find('InsetSelect').at(0).simulate('change', 'add-credential');
    wrapper.update();
    assert.equal(wrapper.find('DeploymentCredentialAdd').length, 1);
  });

  it('clears the credential when displaying the form', function() {
    var setCredential = sinon.stub();
    const wrapper = renderComponent({ setCredential });
    wrapper.find('InsetSelect').at(0).simulate('change', 'add-credential');
    assert.equal(setCredential.callCount, 2);
    assert.equal(setCredential.args[1][0], null);
  });

  it('restores the credential when canceling the form', function() {
    const setCredential = sinon.stub();
    const credential = 'test-credential';
    const wrapper = renderComponent({
      setCredential,
      credential
    });
    const instance = wrapper.instance();
    // Show add credential form...
    instance._toggleAdd();
    assert.equal(instance.state.savedCredential, credential);
    // Reset our counters...
    setCredential.reset();
    // Then hide it as a cancel.
    instance._toggleAdd(true);
    assert.equal(setCredential.callCount, 1);
    assert.equal(setCredential.args[0][0], credential);
    assert.equal(sendAnalytics.callCount, 2);
    assert.deepEqual(sendAnalytics.args[0], [
      'Select cloud',
      undefined,
      'has credentials']);
    assert.deepEqual(sendAnalytics.args[1],
      ['Button click', 'Cancel add credential']);
  });

  it('can handle errors when getting credential names', () => {
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      getCloudCredentialNames: sinon.stub().callsArgWith(1, 'Uh oh!', null),
      getCloudCredentials: sinon.stub().callsArgWith(1, null, [])
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to get names for credentials',
      message: 'unable to get names for credentials: Uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when getting credentials', () => {
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      getCloudCredentials: sinon.stub().callsArgWith(1, 'Uh oh!', null)
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to get credentials',
      message: 'Unable to get credentials: Uh oh!',
      level: 'error'
    });
  });
});
