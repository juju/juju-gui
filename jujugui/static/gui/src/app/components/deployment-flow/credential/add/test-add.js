/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentCredentialAdd = require('./add');
const SvgIcon = require('../../../svg-icon/svg-icon');
const InsetSelect = require('../../../inset-select/inset-select');
const GenericInput = require('../../../generic-input/generic-input');
const ButtonRow = require('../../../button-row/button-row');
const FileField = require('../../../file-field/file-field');
const jsTestUtils = require('../../../../utils/component-test-utils');

describe('DeploymentCredentialAdd', function() {
  let acl, sendAnalytics, getCloudProviderDetails;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    sendAnalytics = sinon.stub();
    getCloudProviderDetails = sinon.stub();
    getCloudProviderDetails.withArgs('gce').returns({
      id: 'google',
      showLogo: true,
      signupUrl: 'https://console.cloud.google.com/billing/freetrial',
      svgHeight: 33,
      svgWidth: 256,
      title: 'Google Compute Engine',
      forms: {
        oauth2: [{
          id: 'client-id',
          title: 'Client ID'
        }, {
          id: 'client-email',
          required: true,
          title: 'Client e-mail address'
        }, {
          id: 'private-key',
          title: 'Private key',
          multiLine: true,
          unescape: true
        }, {
          id: 'project-id',
          required: false,
          title: 'Project ID'
        }, {
          id: 'password',
          required: false,
          title: 'Password',
          type: 'password'
        }],
        jsonfile: [{
          id: 'file',
          title: 'Google Compute Engine project credentials .json file',
          json: true
        }]
      },
      message: 'a message'
    });
    getCloudProviderDetails.withArgs('ec2').returns({
      id: 'aws',
      showLogo: true,
      signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
      svgHeight: 48,
      svgWidth: 120,
      title: 'Amazon Web Services',
      forms: {
        'access-key': [{
          id: 'access-key',
          title: 'The EC2 access key'
        }, {
          autocomplete: false,
          id: 'secret-key',
          title: 'The EC2 secret key'
        }]
      },
      message: 'a message'
    });
  });

  it('can render without a cloud', function() {
    var cloud = getCloudProviderDetails('gce');
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={null}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={false}
              label="Project ID (credential name)"
              required={true}
              ref="credentialName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="deployment-credential-add__credentials">
            <div className="six-col">
              a message
              <InsetSelect
                disabled={false}
                label="Authentication type"
                onChange={instance._handleAuthChange}
                options={[{
                  label: 'oauth2',
                  value: 'oauth2'
                }, {
                  label: 'jsonfile',
                  value: 'jsonfile'
                }]} />
              {[
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="client-id"
                  label="Client ID"
                  multiLine={undefined}
                  required={true}
                  ref="client-id"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="client-email"
                  label="Client e-mail address"
                  multiLine={undefined}
                  required={true}
                  ref="client-email"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="private-key"
                  label="Private key"
                  multiLine={true}
                  required={true}
                  ref="private-key"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="project-id"
                  label="Project ID"
                  multiLine={undefined}
                  required={false}
                  ref="project-id"
                  type={undefined}
                  validate={undefined} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="password"
                  label="Password"
                  multiLine={undefined}
                  required={false}
                  ref="password"
                  type="password"
                  validate={undefined} />
              ]}
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are changed or deleted.
                You can see where they are used and manage or remove them via
                the account page.
              </p>
            </div>
          </div>
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without a cancel button', function() {
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={null}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        hideCancel={true}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    assert.deepEqual(buttons, [{
      action: buttons[0].action,
      submit: true,
      title: 'Add cloud credential',
      type: 'inline-positive'
    }]);
  });

  it('can update to a new cloud', function() {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={null}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    let output = renderer.getRenderOutput();
    renderer.render(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={close}
        cloud={{name: 'aws', cloudType: 'ec2'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />);
    const cloud = getCloudProviderDetails('ec2');
    output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    const expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Amazon Web Services credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Amazon Web Services'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={false}
              label="Credential name"
              required={true}
              ref="credentialName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="deployment-credential-add__credentials">
            <div className="six-col">
              a message
              {undefined}
              {[
                <GenericInput
                  autocomplete={true}
                  disabled={false}
                  key="access-key"
                  label="The EC2 access key"
                  multiLine={undefined}
                  required={true}
                  ref="access-key"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={false}
                  disabled={false}
                  key="secret-key"
                  label="The EC2 secret key"
                  multiLine={undefined}
                  required={true}
                  ref="secret-key"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />
              ]}
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are changed or deleted.
                You can see where they are used and manage or remove them via
                the account page.
              </p>
            </div>
          </div>
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render credential fields for a cloud', function() {
    var cloud = getCloudProviderDetails('gce');
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={['cred1']}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={false}
              label="Project ID (credential name)"
              required={true}
              ref="credentialName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }, {
                check: value => output.props.children[2].props.children[0]
                  .props.children.props.validate[2].check,
                error: 'You already have a credential with this name.'
              }]} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="deployment-credential-add__credentials">
            <div className="six-col">
              a message
              <InsetSelect
                disabled={false}
                label="Authentication type"
                onChange={instance._handleAuthChange}
                options={[{
                  label: 'oauth2',
                  value: 'oauth2'
                }, {
                  label: 'jsonfile',
                  value: 'jsonfile'
                }]} />
              {[<GenericInput
                autocomplete={undefined}
                disabled={false}
                key="client-id"
                label="Client ID"
                multiLine={undefined}
                required={true}
                ref="client-id"
                type={undefined}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />,
              <GenericInput
                autocomplete={undefined}
                disabled={false}
                key="client-email"
                label="Client e-mail address"
                multiLine={undefined}
                required={true}
                ref="client-email"
                type={undefined}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />,
              <GenericInput
                autocomplete={undefined}
                disabled={false}
                key="private-key"
                label="Private key"
                multiLine={true}
                required={true}
                ref="private-key"
                type={undefined}
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />,
              <GenericInput
                autocomplete={undefined}
                disabled={false}
                key="project-id"
                label="Project ID"
                multiLine={undefined}
                required={false}
                ref="project-id"
                type={undefined}
                validate={undefined} />,
              <GenericInput
                autocomplete={undefined}
                disabled={false}
                key="password"
                label="Password"
                multiLine={undefined}
                required={false}
                ref="password"
                type="password"
                validate={undefined} />
              ]}
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are changed or deleted.
                You can see where they are used and manage or remove them via
                the account page.
              </p>
            </div>
          </div>
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render a cloud with a json field', function() {
    var cloud = getCloudProviderDetails('gce');
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    instance.setState({authType: 'jsonfile'});
    var output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={false}
              label="Project ID (credential name)"
              required={true}
              ref="credentialName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="deployment-credential-add__credentials">
            <div className="six-col">
              a message
              <InsetSelect
                disabled={false}
                label="Authentication type"
                onChange={instance._handleAuthChange}
                options={[{
                  label: 'oauth2',
                  value: 'oauth2'
                }, {
                  label: 'jsonfile',
                  value: 'jsonfile'
                }]} />
              {[
                <div className="deployment-credential-add__upload" key="file">
                  <FileField
                    accept=".json"
                    disabled={false}
                    key="file"
                    label="Upload Google Compute Engine .json auth-file"
                    required={true}
                    ref="file" />
                </div>
              ]}
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are changed or deleted.
                You can see where they are used and manage or remove them via
                the account page.
              </p>
            </div>
          </div>
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var cloud = getCloudProviderDetails('gce');
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={sinon.stub()}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const buttons = output.props.children[3].props.children.props.buttons;
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={true}
              label="Project ID (credential name)"
              required={true}
              ref="credentialName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="deployment-credential-add__credentials">
            <div className="six-col">
              a message
              <InsetSelect
                disabled={true}
                label="Authentication type"
                onChange={instance._handleAuthChange}
                options={[{
                  label: 'oauth2',
                  value: 'oauth2'
                }, {
                  label: 'jsonfile',
                  value: 'jsonfile'
                }]} />
              {[
                <GenericInput
                  autocomplete={undefined}
                  disabled={true}
                  key="client-id"
                  label="Client ID"
                  multiLine={undefined}
                  required={true}
                  ref="client-id"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={true}
                  key="client-email"
                  label="Client e-mail address"
                  multiLine={undefined}
                  required={true}
                  ref="client-email"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={true}
                  key="private-key"
                  label="Private key"
                  multiLine={true}
                  required={true}
                  ref="private-key"
                  type={undefined}
                  validate={[{
                    regex: /\S+/,
                    error: 'This field is required.'
                  }]} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={true}
                  key="project-id"
                  label="Project ID"
                  multiLine={undefined}
                  required={false}
                  ref="project-id"
                  type={undefined}
                  validate={undefined} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={true}
                  key="password"
                  label="Password"
                  multiLine={undefined}
                  required={false}
                  ref="password"
                  type="password"
                  validate={undefined} />
              ]}
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are changed or deleted.
                You can see where they are used and manage or remove them via
                the account page.
              </p>
            </div>
          </div>
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can add the credentials', function() {
    var updateCloudCredential = sinon.stub().callsArg(3);
    const getCredentials = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub().returns('new@test')}
        getCredentials={getCredentials}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub().returns(true)} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      'credentialName': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('new@test')
      },
      'client-id': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client id')
      },
      'client-email': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client email')
      },
      'private-key': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('private key')
      },
      'project-id': {
        getValue: sinon.stub().returns('project id')
      },
      'password': {
        getValue: sinon.stub().returns('password')
      }
    };
    instance._handleAddCredentials();
    assert.equal(sendAnalytics.callCount, 1);
    assert.deepEqual(sendAnalytics.args[0],
      ['Button click', 'Add credentials']);
    assert.equal(updateCloudCredential.callCount, 1);
    const args = updateCloudCredential.args[0];
    assert.equal(args[0], 'new@test');
    assert.equal(args[1], 'oauth2');
    assert.deepEqual(args[2], {
      'client-id': 'client id',
      'client-email': 'client email',
      'private-key': 'private key',
      'project-id': 'project id',
      'password': 'password'
    });
    assert.equal(getCredentials.callCount, 1);
    assert.equal(getCredentials.args[0][0], 'new@test');
  });

  it('properly unescapes necessary fields', function() {
    const updateCloudCredential = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub().returns(true)} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({authType: 'oauth2'});
    instance.refs = {
      'credentialName': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('new@test')
      },
      'client-id': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client id')
      },
      'client-email': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client email')
      },
      'private-key': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('foo%20\\n')
      },
      'project-id': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('project id')
      },
      'password': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('password')
      }
    };
    instance._handleAddCredentials();
    assert.equal(updateCloudCredential.callCount, 1);
    assert.equal(updateCloudCredential.args[0][2]['private-key'], 'foo \n');
  });

  it('does not submit the form if there are validation errors', function() {
    var updateCloudCredential = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={sinon.stub()}
        updateCloudCredential={updateCloudCredential}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub()}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub().returns(false)} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleAddCredentials();
    assert.equal(updateCloudCredential.callCount, 0);
  });

  it('displays a notification when updating a credential errors', function() {
    const error = 'Bad wolf';
    const updateCloudCredential = sinon.stub().callsArgWith(3, error);
    const addNotification = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentCredentialAdd
        acl={acl}
        addNotification={addNotification}
        updateCloudCredential={updateCloudCredential}
        close={sinon.stub()}
        cloud={{name: 'google', cloudType: 'gce'}}
        credentials={[]}
        getCloudProviderDetails={getCloudProviderDetails}
        generateCloudCredentialName={sinon.stub().returns('new@test')}
        getCredentials={sinon.stub()}
        sendAnalytics={sendAnalytics}
        setCredential={sinon.stub()}
        user="user-admin"
        validateForm={sinon.stub().returns(true)} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      'credentialName': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('new@test')
      },
      'client-id': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client id')
      },
      'client-email': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('client email')
      },
      'private-key': {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('private key')
      },
      'project-id': {
        getValue: sinon.stub().returns('project id')
      },
      'password': {
        getValue: sinon.stub().returns('password')
      }
    };
    instance._handleAddCredentials();
    assert.isTrue(addNotification.called, 'addNotification was not called');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not add credential',
      message: `Could not add the credential: ${error}`,
      level: 'error'
    }, 'Notification message does not match expected');
  });
});
