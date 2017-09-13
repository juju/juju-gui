/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentCredential = require('./credential');
const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const ExpandingRow = require('../../expanding-row/expanding-row');
const DeploymentCredentialAdd = require('./add/add');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentCredential', function() {
  var acl, sendAnalytics, cloud, credentials, regions, credentialNames, user;

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
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        controllerIsReady={sinon.stub().returns(true)}
        cloud={cloud}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub()}
        getCloudCredentialNames={sinon.stub()}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        user={user}
        validateForm={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="clearfix">
        <div className="deployment-credential__loading">
          <Spinner />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render with a cloud', function() {
    var updateCloudCredential = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var validateForm = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={generateCloudCredentialName}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, [])}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={getCloudProviderDetails}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const props = instance.props;
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <DeploymentCredentialAdd
            acl={acl}
            addNotification={props.addNotification}
            updateCloudCredential={updateCloudCredential}
            close={instance._toggleAdd}
            cloud={cloud}
            credentials={[]}
            generateCloudCredentialName={generateCloudCredentialName}
            getCredentials={instance._getCredentials}
            getCloudProviderDetails={getCloudProviderDetails}
            hideCancel={true}
            sendAnalytics={sendAnalytics}
            setCredential={setCredential}
            user={user}
            validateForm={validateForm}/>
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when not editable', function() {
    var updateCloudCredential = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var validateForm = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        credential="lxd_admin@local_default"
        editable={false}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        region="north-north-west"
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <form className="deployment-credential__form">
            <div className="prepend-two four-col">
              <InsetSelect
                disabled={false}
                label="Credential"
                onChange={instance._handleCredentialChange}
                options={[{
                  label: 'default',
                  value: 'lxd_admin@local_default'
                }, {
                  label: 'Add credential...',
                  value: 'add-credential'
                }]}
                ref="credential"
                value="lxd_admin@local_default" />
            </div>
            <div className="four-col">
              <InsetSelect
                disabled={true}
                label="Region"
                onChange={setRegion}
                options={[
                  {label: 'Default', value: ''},
                  {label: 'north-north-west', value: 'north-north-west'}
                ]}
                value="north-north-west" />
            </div>
          </form>
          {undefined}
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without a cloud', function() {
    var updateCloudCredential = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var validateForm = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        cloud={{name: 'test'}}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={generateCloudCredentialName}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, {})}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, [])}
        getCloudProviderDetails={getCloudProviderDetails}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const props = instance.props;
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <DeploymentCredentialAdd
            acl={acl}
            addNotification={props.addNotification}
            updateCloudCredential={updateCloudCredential}
            close={instance._toggleAdd}
            cloud={{name: 'test'}}
            credentials={[]}
            generateCloudCredentialName={generateCloudCredentialName}
            getCredentials={instance._getCredentials}
            getCloudProviderDetails={getCloudProviderDetails}
            hideCancel={true}
            sendAnalytics={sendAnalytics}
            setCredential={setCredential}
            user={user}
            validateForm={validateForm} />
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can show existing credentials', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <form className="deployment-credential__form">
            <div className="prepend-two four-col">
              <InsetSelect
                disabled={false}
                label="Credential"
                onChange={instance._handleCredentialChange}
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
            <div className="four-col">
              <InsetSelect
                disabled={false}
                label="Region"
                onChange={setRegion}
                options={[
                  {label: 'Default', value: ''},
                  {label: 'test-region', value: 'test-region'}
                ]}
                value={undefined} />
            </div>
          </form>
          {undefined}
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('selects an initial credential', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={sinon.stub()} />, true);
    assert.equal(setCredential.callCount, 1);
    assert.equal(setCredential.args[0][0], 'lxd_admin@local_default');
  });

  it('can select a credential after loading the list of creds', function() {
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    credentials['new@test'] = {
      name: 'new@test'
    };
    const renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {credential: {setValue: sinon.stub()}};
    instance._getCredentials('new@test');
    assert.equal(setCredential.callCount, 2);
    assert.equal(setCredential.args[1][0], 'new@test');
    assert.equal(instance.refs.credential.setValue.callCount, 1);
    assert.equal(instance.refs.credential.setValue.args[0][0], 'new@test');
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={false}>
          <form className="deployment-credential__form">
            <div className="prepend-two four-col">
              <InsetSelect
                disabled={true}
                label="Credential"
                onChange={instance._handleCredentialChange}
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
            <div className="four-col">
              <InsetSelect
                disabled={true}
                label="Region"
                onChange={setRegion}
                options={[
                  {label: 'Default', value: ''},
                  {label: 'test-region', value: 'test-region'}
                ]}
                value={undefined} />
            </div>
          </form>
          {undefined}
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can handle a cloud without regions', function() {
    delete cloud.regions;
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="four-col">
        <InsetSelect
          disabled={false}
          label="Region"
          onChange={setRegion}
          options={[
            {label: 'Default', value: ''}
          ]}
          value={undefined} />
      </div>);
    assert.deepEqual(
      output.props.children.props.children[0].props.children[1], expected);
  });

  it('can navigate to the add credentials form', function() {
    var updateCloudCredential = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var validateForm = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={generateCloudCredentialName}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={getCloudProviderDetails}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleCredentialChange('add-credential');
    var output = renderer.getRenderOutput();
    const props = instance.props;
    var expected = (
      <div className="clearfix">
        <ExpandingRow
          classes={{'no-margin-bottom': true, 'twelve-col': true}}
          clickable={false}
          expanded={true}>
          {undefined}
          <DeploymentCredentialAdd
            acl={acl}
            addNotification={props.addNotification}
            updateCloudCredential={updateCloudCredential}
            close={instance._toggleAdd}
            cloud={cloud}
            credentials={['default']}
            generateCloudCredentialName={generateCloudCredentialName}
            getCredentials={instance._getCredentials}
            getCloudProviderDetails={getCloudProviderDetails}
            hideCancel={false}
            sendAnalytics={sendAnalytics}
            setCredential={setCredential}
            user={user}
            validateForm={validateForm}/>
        </ExpandingRow>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('clears the credential when displaying the form', function() {
    var updateCloudCredential = sinon.stub();
    var setCredential = sinon.stub();
    var setRegion = sinon.stub();
    var validateForm = sinon.stub();
    const getCloudProviderDetails = sinon.stub();
    const generateCloudCredentialName = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={generateCloudCredentialName}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={getCloudProviderDetails}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={setRegion}
        user={user}
        validateForm={validateForm} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleCredentialChange('add-credential');
    assert.equal(setCredential.callCount, 2);
    assert.equal(setCredential.args[1][0], null);
  });

  it('restores the credential when canceling the form', function() {
    const setCredential = sinon.stub();
    const credential = 'test-credential';
    const renderer = jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        credential={credential}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, credentials)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={setCredential}
        setRegion={sinon.stub()}
        user={user}
        validateForm={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
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
    jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={addNotification}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, null, [])}
        getCloudCredentialNames={sinon.stub().callsArgWith(1, 'Uh oh!', null)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        user={user}
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to get names for credentials',
      message: 'unable to get names for credentials: Uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when getting credentials', () => {
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentCredential
        acl={acl}
        addNotification={addNotification}
        updateCloudCredential={sinon.stub()}
        cloud={cloud}
        controllerIsReady={sinon.stub().returns(true)}
        editable={true}
        generateCloudCredentialName={sinon.stub()}
        getCloudCredentials={sinon.stub().callsArgWith(1, 'Uh oh!', null)}
        getCloudCredentialNames={
          sinon.stub().callsArgWith(1, null, credentialNames)}
        getCloudProviderDetails={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        user={user}
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to get credentials',
      message: 'Unable to get credentials: Uh oh!',
      level: 'error'
    });
  });
});
