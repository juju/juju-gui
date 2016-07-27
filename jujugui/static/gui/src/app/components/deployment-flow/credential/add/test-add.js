/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentCredentialAdd', function() {
  var acl, clouds;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-credential-add', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    clouds = {
      google: {
        id: 'google',
        showLogo: true,
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        showLogo: true,
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      aws: {
        id: 'aws',
        showLogo: true,
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      local: {
        id: 'local',
        showLogo: false,
        title: 'Local'
      }
    };
  });

  it('can render without a cloud', function() {
    var cloud = clouds.google;
    var close = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
    <juju.components.DeploymentCredentialAdd
        acl={acl}
        addTemplate={sinon.stub()}
        close={close}
        cloud={null}
        clouds={clouds}
        regions={['test-region']}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={{}}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <juju.components.SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col">
            <juju.components.DeploymentInput
              disabled={false}
              label="Project ID (credential name)"
              placeholder="cred-1"
              required={true}
              ref="templateName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <div className="six-col last-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Region"
              options={[{
                label: 'test-region',
                value: 'test-region'
              }]}
              ref="region" />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="twelve-col">
            <p className="deployment-add-credentials__p six-col">
              The GCE provider uses OAauth to Authenticate. This requires that
              you set it up and get the relevant credentials. For more
              information see
              &nbsp;<a className="deployment-panel__link"
                href={'https://cloud.google.com/copmute/dosc/api/how-tos/' +
                  'authorization'}
                target="_blank">
                https://cloud.google.com/copmute/dosc/api/how-tos/
                authorization
              </a>.
              The key information can be downloaded as a JSON file, or copied
              from
              &nbsp;<a className="deployment-panel__link"
                href={'https://console.developers.google.com/project/apiui/' +
                  'credential'}
                target="_blank">
                https://console.developers.google.com/project/apiui/credential
              </a>.
            </p>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <juju.components.SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are used. See where they are
                used and manage or remove them via the account page.
              </p>
            </div>
            <div className="deployment-add-credentials__upload twelve-col">
              Upload GCE auth-file or&nbsp;
              <span className="link">manually set the individual fields</span>
            </div>
          </div>
        </form>
        <div className="prepend-six six-col last-col">
          <juju.components.ButtonRow
            buttons={[{
              action: close,
              title: 'Cancel',
              type: 'neutral'
            }, {
              action: instance._handleAddCredentials,
              submit: true,
              title: 'Add cloud credential',
              type: 'positive'
            }]} />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for google', function() {
    var cloud = clouds.google;
    var close = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
    <juju.components.DeploymentCredentialAdd
        acl={acl}
        addTemplate={sinon.stub()}
        close={close}
        cloud="google"
        clouds={clouds}
        regions={['test-region']}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={{}}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Google Compute Engine credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Google Compute Engine'}
            &nbsp;
            <juju.components.SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col">
            <juju.components.DeploymentInput
              disabled={false}
              label="Project ID (credential name)"
              placeholder="cred-1"
              required={true}
              ref="templateName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <div className="six-col last-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Region"
              options={[{
                label: 'test-region',
                value: 'test-region'
              }]}
              ref="region" />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="twelve-col">
            <p className="deployment-add-credentials__p six-col">
              The GCE provider uses OAauth to Authenticate. This requires that
              you set it up and get the relevant credentials. For more
              information see
              &nbsp;<a className="deployment-panel__link"
                href={'https://cloud.google.com/copmute/dosc/api/how-tos/' +
                  'authorization'}
                target="_blank">
                https://cloud.google.com/copmute/dosc/api/how-tos/
                authorization
              </a>.
              The key information can be downloaded as a JSON file, or copied
              from
              &nbsp;<a className="deployment-panel__link"
                href={'https://console.developers.google.com/project/apiui/' +
                  'credential'}
                target="_blank">
                https://console.developers.google.com/project/apiui/credential
              </a>.
            </p>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <juju.components.SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are used. See where they are
                used and manage or remove them via the account page.
              </p>
            </div>
            <div className="deployment-add-credentials__upload twelve-col">
              Upload GCE auth-file or&nbsp;
              <span className="link">manually set the individual fields</span>
            </div>
          </div>
        </form>
        <div className="prepend-six six-col last-col">
          <juju.components.ButtonRow
            buttons={[{
              action: close,
              title: 'Cancel',
              type: 'neutral'
            }, {
              action: instance._handleAddCredentials,
              submit: true,
              title: 'Add cloud credential',
              type: 'positive'
            }]} />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for aws', function() {
    var cloud = clouds.aws;
    var close = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
    <juju.components.DeploymentCredentialAdd
        acl={acl}
        addTemplate={sinon.stub()}
        close={close}
        cloud="aws"
        clouds={clouds}
        regions={['test-region']}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={{}}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Amazon Web Services credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Amazon Web Services'}
            &nbsp;
            <juju.components.SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col">
            <juju.components.DeploymentInput
              disabled={false}
              label="Credential name"
              placeholder="cred-1"
              required={true}
              ref="templateName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <div className="six-col last-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Region"
              options={[{
                label: 'test-region',
                value: 'test-region'
              }]}
              ref="region" />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div>
            <div className="six-col">
              <p className="deployment-add-credentials__p">
                You can obtain your AWS credentials at:<br />
                <a className="deployment-panel__link"
                  href={'https://console.aws.amazon.com/iam/home?region=' +
                    'eu-west-1#security_credential'}
                  target="_blank">
                  https://console.aws.amazon.com/iam/home?region=eu-west-1#
                  security_credential
                </a>
              </p>
              <juju.components.DeploymentInput
                disabled={false}
                label="Access key"
                placeholder="TDFIWNDKF7UW6DVGX98X"
                required={true}
                ref="templateAccessKey"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
              <juju.components.DeploymentInput
                disabled={false}
                label="Secret key"
                placeholder="p/hdU8TnOP5D7JNHrFiM8IO8f5GN6GhHj7tueBN9"
                required={true}
                ref="templateSecretKey"
                validate={[{
                  regex: /\S+/,
                  error: 'This field is required.'
                }]} />
            </div>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <juju.components.SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are used. See where they are
                used and manage or remove them via the account page.
              </p>
            </div>
          </div>
        </form>
        <div className="prepend-six six-col last-col">
          <juju.components.ButtonRow
            buttons={[{
              action: close,
              title: 'Cancel',
              type: 'neutral'
            }, {
              action: instance._handleAddCredentials,
              submit: true,
              title: 'Add cloud credential',
              type: 'positive'
            }]} />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for azure', function() {
    var cloud = clouds.azure;
    var close = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
    <juju.components.DeploymentCredentialAdd
        acl={acl}
        addTemplate={sinon.stub()}
        close={close}
        cloud="azure"
        clouds={clouds}
        regions={['test-region']}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={{}}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Microsoft Azure credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Microsoft Azure'}
            &nbsp;
            <juju.components.SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col">
            <juju.components.DeploymentInput
              disabled={false}
              label="Credential name"
              placeholder="cred-1"
              required={true}
              ref="templateName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <div className="six-col last-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Region"
              options={[{
                label: 'test-region',
                value: 'test-region'
              }]}
              ref="region" />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="twelve-col">
            <p className="deployment-add-credentials__p six-col">
              The following fields require your Windows Azure management
              information. For more information please see:&nbsp;
              <a className="deployment-panel__link"
                href="https://msdn.microsoft.com/en-us/library/windowsazure"
                target="_blank">
                https://msdn.microsoft.com/en-us/library/windowsazure
              </a>
              &nbsp;for details.
            </p>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <juju.components.SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are used. See where they are
                used and manage or remove them via the account page.
              </p>
            </div>
            <div className="deployment-add-credentials__upload twelve-col">
              Upload management certificate &rsaquo;
            </div>
          </div>
        </form>
        <div className="prepend-six six-col last-col">
          <juju.components.ButtonRow
            buttons={[{
              action: close,
              title: 'Cancel',
              type: 'neutral'
            }, {
              action: instance._handleAddCredentials,
              submit: true,
              title: 'Add cloud credential',
              type: 'positive'
            }]} />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var cloud = clouds.azure;
    var close = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
    <juju.components.DeploymentCredentialAdd
        acl={acl}
        addTemplate={sinon.stub()}
        close={close}
        cloud="azure"
        clouds={clouds}
        regions={['test-region']}
        setCredential={sinon.stub()}
        setRegion={sinon.stub()}
        setTemplate={sinon.stub()}
        users={{}}
        validateForm={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-credential-add twelve-col">
        <h4>Create new Microsoft Azure credential</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={cloud.signupUrl}
            target="_blank">
            Sign up for {'Microsoft Azure'}
            &nbsp;
            <juju.components.SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col">
            <juju.components.DeploymentInput
              disabled={true}
              label="Credential name"
              placeholder="cred-1"
              required={true}
              ref="templateName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
          </div>
          <div className="six-col last-col">
            <juju.components.InsetSelect
              disabled={true}
              label="Region"
              options={[{
                label: 'test-region',
                value: 'test-region'
              }]}
              ref="region" />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          <div className="twelve-col">
            <p className="deployment-add-credentials__p six-col">
              The following fields require your Windows Azure management
              information. For more information please see:&nbsp;
              <a className="deployment-panel__link"
                href="https://msdn.microsoft.com/en-us/library/windowsazure"
                target="_blank">
                https://msdn.microsoft.com/en-us/library/windowsazure
              </a>
              &nbsp;for details.
            </p>
            <div className="deployment-flow__notice six-col last-col">
              <p className="deployment-flow__notice-content">
                <juju.components.SvgIcon
                  name="general-action-blue"
                  size="16" />
                Credentials are stored securely on our servers and we will
                notify you by email whenever they are used. See where they are
                used and manage or remove them via the account page.
              </p>
            </div>
            <div className="deployment-add-credentials__upload twelve-col">
              Upload management certificate &rsaquo;
            </div>
          </div>
        </form>
        <div className="prepend-six six-col last-col">
          <juju.components.ButtonRow
            buttons={[{
              action: close,
              title: 'Cancel',
              type: 'neutral'
            }, {
              action: instance._handleAddCredentials,
              submit: true,
              title: 'Add cloud credential',
              type: 'positive'
            }]} />
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can add the credentials', function() {
    var addTemplate = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredentialAdd
          acl={acl}
          addTemplate={addTemplate}
          close={sinon.stub()}
          cloud="google"
          clouds={clouds}
          regions={['us-east-1']}
          setCredential={sinon.stub()}
          setRegion={sinon.stub()}
          setTemplate={sinon.stub()}
          users={{jem: {user: 'spinach'}}}
          validateForm={sinon.stub().returns(true)} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {
      templateAccessKey: {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('templateAccessKey')
      },
      templateName: {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('templateName')
      },
      templateSecretKey: {
        validate: sinon.stub().returns(true),
        getValue: sinon.stub().returns('templateSecretKey')
      },
      region: {
        getValue: sinon.stub().returns('us-east-1')
      }
    };
    instance._handleAddCredentials();
    assert.equal(addTemplate.callCount, 1);
  });

  it('does not submit the form if there are validation errors', function() {
    var addTemplate = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCredentialAdd
          acl={acl}
          addTemplate={addTemplate}
          close={sinon.stub()}
          cloud="google"
          clouds={clouds}
          regions={['test-region']}
          setCredential={sinon.stub()}
          setRegion={sinon.stub()}
          setTemplate={sinon.stub()}
          users={{}}
          validateForm={sinon.stub().returns(false)} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleAddCredentials();
    assert.equal(addTemplate.callCount, 0);
  });
});
