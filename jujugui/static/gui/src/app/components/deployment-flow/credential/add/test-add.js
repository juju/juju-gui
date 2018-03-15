/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentCredentialAdd = require('./add');
const SvgIcon = require('../../../svg-icon/svg-icon');
const InsetSelect = require('../../../inset-select/inset-select');
const GenericInput = require('../../../generic-input/generic-input');
const ButtonRow = require('../../../button-row/button-row');
const FileField = require('../../../file-field/file-field');

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
    getCloudProviderDetails.withArgs('maas').returns({
      id: 'maas',
      showLogo: false,
      title: 'MAAS',
      forms: {
        'access-key': [{
          id: 'access-key',
          title: 'The MAAS access key'
        }, {
          autocomplete: false,
          id: 'secret-key',
          title: 'The MAAS secret key'
        }]
      },
      message: 'a message'
    });
  });

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentCredentialAdd
      acl={acl}
      addNotification={options.addNotification || sinon.stub()}
      cloud={options.cloud || null}
      credentialName={options.credentialName || undefined}
      credentials={options.credentials || []}
      generateCloudCredentialName={options.generateCloudCredentialName || sinon.stub()}
      getCloudProviderDetails={getCloudProviderDetails}
      onCancel={options.onCancel !== undefined ? options.onCancel : sinon.stub()}
      onCredentialUpdated={options.onCredentialUpdated || sinon.stub()}
      sendAnalytics={sendAnalytics}
      setCredential={sinon.stub()}
      updateCloudCredential={options.updateCloudCredential || sinon.stub()}
      user="user-admin"
      validateForm={options.validateForm || sinon.stub()} />
  );

  it('can render without a provided cloud', function() {
    const cloud = getCloudProviderDetails('gce');
    const wrapper = renderComponent();
    const expected = (
      <div className="deployment-credential-add twelve-col no-margin-bottom">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a className="deployment-credential-add__link" href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col no-margin-bottom"
          onSubmit={wrapper.find('form').prop('onSubmit')}>
          <div className="six-col last-col">
            <GenericInput
              disabled={false}
              label="Project ID (credential name)"
              ref="credentialName"
              required={true}
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]}
              value={undefined} />
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
                onChange={wrapper.find('InsetSelect').prop('onChange')}
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
                  ref="client-id"
                  required={true}
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
                  ref="client-email"
                  required={true}
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
                  ref="private-key"
                  required={true}
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
                  ref="project-id"
                  required={false}
                  type={undefined}
                  validate={undefined} />,
                <GenericInput
                  autocomplete={undefined}
                  disabled={false}
                  key="password"
                  label="Password"
                  multiLine={undefined}
                  ref="password"
                  required={false}
                  type="password"
                  validate={undefined} />
              ]}
            </div>
            <div className={
              'deployment-credential-add__notice prepend-one five-col last-col'}>
              <p className="deployment-credential-add__notice-content">
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
          <div className={
            'deployment-credential-add__buttons twelve-col last-col no-margin-bottom'}>
            <ButtonRow
              buttons={[{
                action: sinon.stub(),
                title: 'Cancel',
                type: 'inline-neutral'
              }, {
                submit: true,
                title: 'Add cloud credential',
                type: 'inline-positive'
              }]} />
          </div>
        </form>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render without a cancel button', function() {
    const wrapper = renderComponent({
      onCancel: null
    });
    const buttons = wrapper.find('ButtonRow').prop('buttons');
    assert.deepEqual(buttons, [{
      submit: true,
      title: 'Add cloud credential',
      type: 'inline-positive'
    }]);
  });

  it('can update to a new cloud', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.state.authType, 'oauth2');
    wrapper.setProps({
      cloud: {name: 'aws', cloudType: 'ec2'}
    });
    assert.equal(instance.state.authType, 'access-key');
    const expected = (
      <h4>Create new Amazon Web Services credential</h4>);
    assert.compareJSX(wrapper.find('h4'), expected);
  });

  it('can render credential fields for a cloud', function() {
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'},
      credentials: ['cred1']
    });
    const expected = (
      <div className="deployment-credential-add__credentials">
        <div className="six-col">
          a message
          <InsetSelect
            disabled={false}
            label="Authentication type"
            onChange={wrapper.find('InsetSelect').prop('onChange')}
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
            ref="client-id"
            required={true}
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
            ref="client-email"
            required={true}
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
            ref="private-key"
            required={true}
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
            ref="project-id"
            required={false}
            type={undefined}
            validate={undefined} />,
          <GenericInput
            autocomplete={undefined}
            disabled={false}
            key="password"
            label="Password"
            multiLine={undefined}
            ref="password"
            required={false}
            type="password"
            validate={undefined} />
          ]}
        </div>
        <div className={
          'deployment-credential-add__notice prepend-one five-col last-col'}>
          <p className="deployment-credential-add__notice-content">
            <SvgIcon
              name="general-action-blue"
              size="16" />
            Credentials are stored securely on our servers and we will
            notify you by email whenever they are changed or deleted.
            You can see where they are used and manage or remove them via
            the account page.
          </p>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-credential-add__credentials'), expected);
  });

  it('can render a cloud with a json field', function() {
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'}
    });
    const instance = wrapper.instance();
    instance.setState({authType: 'jsonfile'});
    wrapper.update();
    const expected = (
      <div className="deployment-credential-add__credentials">
        <div className="six-col">
          a message
          <InsetSelect
            disabled={false}
            label="Authentication type"
            onChange={wrapper.find('InsetSelect').prop('onChange')}
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
                ref="file"
                required={true} />
            </div>
          ]}
        </div>
        <div className={
          'deployment-credential-add__notice prepend-one five-col last-col'}>
          <p className="deployment-credential-add__notice-content">
            <SvgIcon
              name="general-action-blue"
              size="16" />
            Credentials are stored securely on our servers and we will
            notify you by email whenever they are changed or deleted.
            You can see where they are used and manage or remove them via
            the account page.
          </p>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-credential-add__credentials'), expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'}
    });
    assert.equal(wrapper.find('InsetSelect').prop('disabled'), true);
    wrapper.find('GenericInput').forEach(input => {
      assert.equal(input.prop('disabled'), true);
    });
  });

  it('can add the credentials', function() {
    const updateCloudCredential = sinon.stub().callsArg(3);
    const onCredentialUpdated = sinon.stub();
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'},
      onCredentialUpdated,
      updateCloudCredential,
      generateCloudCredentialName: sinon.stub().returns('new@test'),
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
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
    instance._handleAddCredentials({preventDefault: sinon.stub()});
    assert.equal(sendAnalytics.callCount, 1, 'sendAnalytics not called');
    assert.deepEqual(sendAnalytics.args[0],
      ['Button click', 'Add credentials']);
    assert.equal(updateCloudCredential.callCount, 1, 'updateCloudCredential not called');
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
    assert.equal(onCredentialUpdated.callCount, 1, 'getCredentials not called');
    assert.equal(onCredentialUpdated.args[0][0], 'new@test');
  });

  it('can add the credentials by submitting the form', () => {
    const updateCloudCredential = sinon.stub().callsArg(3);
    const onCredentialUpdated = sinon.stub();
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'},
      onCredentialUpdated,
      updateCloudCredential,
      generateCloudCredentialName: sinon.stub().returns('new@test'),
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
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
    wrapper.find('form').simulate('submit', {preventDefault: sinon.stub()});
    assert.equal(sendAnalytics.callCount, 1, 'sendAnalytics not called');
    assert.deepEqual(sendAnalytics.args[0],
      ['Button click', 'Add credentials']);
    assert.equal(updateCloudCredential.callCount, 1, 'updateCloudCredential not called');
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
    assert.equal(onCredentialUpdated.callCount, 1, 'getCredentials not called');
    assert.equal(onCredentialUpdated.args[0][0], 'new@test');
  });

  it('properly unescapes necessary fields', function() {
    const updateCloudCredential = sinon.stub();
    const wrapper = renderComponent({
      updateCloudCredential,
      cloud: {name: 'google', cloudType: 'gce'},
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
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
    instance._handleAddCredentials({preventDefault: sinon.stub()});
    assert.equal(updateCloudCredential.callCount, 1);
    assert.equal(updateCloudCredential.args[0][2]['private-key'], 'foo \n');
  });

  it('does not submit the form if there are validation errors', function() {
    const updateCloudCredential = sinon.stub();
    const wrapper = renderComponent({
      updateCloudCredential,
      cloud: {name: 'google', cloudType: 'gce'},
      validateForm: sinon.stub().returns(false)
    });
    const instance = wrapper.instance();
    instance._handleAddCredentials({preventDefault: sinon.stub()});
    assert.equal(updateCloudCredential.callCount, 0);
  });

  it('displays a notification when updating a credential errors', function() {
    const error = 'Bad wolf';
    const updateCloudCredential = sinon.stub().callsArgWith(3, error);
    const addNotification = sinon.stub();
    const wrapper = renderComponent({
      addNotification,
      updateCloudCredential,
      cloud: {name: 'google', cloudType: 'gce'},
      generateCloudCredentialName: sinon.stub().returns('new@test'),
      validateForm: sinon.stub().returns(true)
    });
    const instance = wrapper.instance();
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
    instance._handleAddCredentials({preventDefault: sinon.stub()});
    assert.isTrue(addNotification.called, 'addNotification was not called');
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not add credential',
      message: `Could not add the credential: ${error}`,
      level: 'error'
    }, 'Notification message does not match expected');
  });

  it('can render for updating a credential', function() {
    const wrapper = renderComponent({
      cloud: {name: 'google', cloudType: 'gce'},
      credentialName: 'cred1',
      credentials: ['cred1']
    });
    assert.equal(
      wrapper.find('h4').children().text(),
      'Update Google Compute Engine credential');
    assert.equal(wrapper.find('GenericInput').at(0).prop('disabled'), true);
    assert.equal(wrapper.find('GenericInput').at(0).prop('value'), 'cred1');
    const buttons = wrapper.find('ButtonRow').prop('buttons');
    assert.equal(buttons[1].title, 'Update cloud credential');
  });

  it('does not show a signup url if the cloud does not have one', () => {
    const wrapper = renderComponent({
      cloud: {name: 'maas', cloudType: 'maas'}
    });
    assert.strictEqual(wrapper.find('.deployment-credential-add__signup').length, 0);
  });
});
