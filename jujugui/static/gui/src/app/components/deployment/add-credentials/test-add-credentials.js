/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentAddCredentials', function() {
  var clouds, users, jem;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-add-credentials', function() { done(); });
    users = {
      jem: {
        user: 'foo'
      }
    };
    jem = {
      addTemplate: sinon.stub()
    };
  });

  beforeEach(function() {
    clouds = {
      aws: {
        id: 'aws',
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      gcp: {
        id: 'gcp',
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      },
      azure: {
        id: 'azure',
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      }
    };
  });

  it('can render for aws', function() {
    var cloud = clouds['aws'];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()}
        cloud={cloud}
        jem={jem}
        users={users} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      action: instance._handleChangeCloud,
      title: 'Change cloud',
      type: 'inline-neutral'
    }, {
      title: 'Add credentials',
      action: instance._handleAddCredentials,
      disabled: false,
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Configure Amazon Web Services">
          <div className="deployment-add-credentials__logo">
              <juju.components.SvgIcon
                height={cloud.svgHeight}
                name={cloud.id}
                width={cloud.svgWidth} />
          </div>
          <div className="twelve-col deployment-add-credentials__signup">
            <a href={cloud.signupUrl}
              target="_blank">
              Sign up for {cloud.title}
              &nbsp;
              <juju.components.SvgIcon
                name="external-link-16"
                size="12" />
            </a>
          </div>
          <form className="twelve-col-col">
            <div className="six-col">
              <label className="deployment-panel__label"
                htmlFor="credential-name">
                Credential name
              </label>
              <input className="deployment-panel__input"
                id="credential-name"
                placeholder="AWS_1"
                required="required"
                type="text"
                ref="templateName" />
              <label className="deployment-panel__label"
                htmlFor="specify-region">
                Region
              </label>
              <input className="deployment-panel__input"
                id="specify-region"
                placeholder="us-central1"
                required="required"
                type="text"
                ref="templateRegion" />
            </div>
            <div className="deployment-panel__notice six-col last-col">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Credentials are stored securely on our servers and we'll notify
              you by email whenever they are used. See where they are used and
              manage or remove them via the account page.
            </div>
            <h3 className="deployment-panel__section-title twelve-col">
              Enter credentials
            </h3>
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
              <label className="deployment-panel__label"
                htmlFor="access-key">
                Access key
              </label>
              <input className="deployment-panel__input"
                id="access-key"
                placeholder="TDFIWNDKF7UW6DVGX98X"
                required="required"
                type="text"
                ref="templateAccessKey" />
              <label className="deployment-panel__label"
                htmlFor="secret-key">
                Secret key
              </label>
              <input className="deployment-panel__input"
                id="secret-key"
                placeholder="p/hdU8TnOP5D7JNHrFiM8IO8f5GN6GhHj7tueBN9"
                required="required"
                type="text"
                ref="templateSecretKey" />
            </div>
          </form>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for gcp', function() {
    var cloud = clouds['gcp'];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()}
        cloud={cloud}
        jem={jem}
        users={users} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      action: instance._handleChangeCloud,
      title: 'Change cloud',
      type: 'inline-neutral'
    }, {
      title: 'Add credentials',
      action: instance._handleAddCredentials,
      disabled: true,
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Configure Google Compute Engine">
          <div className="deployment-add-credentials__logo">
              <juju.components.SvgIcon
                height={cloud.svgHeight}
                name={cloud.id}
                width={cloud.svgWidth} />
          </div>
          <div className="twelve-col deployment-add-credentials__signup">
            <a href={cloud.signupUrl}
              target="_blank">
              Sign up for {cloud.title}
              &nbsp;
              <juju.components.SvgIcon
                name="external-link-16"
                size="12" />
            </a>
          </div>
          <form className="twelve-col-col">
            <div className="six-col">
              <label className="deployment-panel__label"
                htmlFor="credential-name">
                Project ID (credential name)
              </label>
              <input className="deployment-panel__input"
                id="credential-name"
                placeholder="AWS_1"
                required="required"
                type="text"
                ref="templateName" />
              <label className="deployment-panel__label"
                htmlFor="specify-region">
                Region
              </label>
              <input className="deployment-panel__input"
                id="specify-region"
                placeholder="us-central1"
                required="required"
                type="text"
                ref="templateRegion" />
            </div>
            <div className="deployment-panel__notice six-col last-col">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Credentials are store securely on our servers and we'll notify
              you by email whenever they are used. See where they are used and
              manage or remove them via the account page.
            </div>
            <h3 className="deployment-panel__section-title twelve-col">
              Enter credentials
            </h3>
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col last-col">
                The GCE provider uses OAauth to Authenticate. This requires that
                you set it up and get the relevant credentials. For more
                information see&nbsp;
                <a className="deployment-panel__link"
                  href={'https://cloud.google.com/copmute/dosc/api/how-tos/' +
                    'authorization'}
                  target="_blank">
                  https://cloud.google.com/copmute/dosc/api/how-tos/
                  authorization
                </a>.
                The key information can be downloaded as a JSON file, or copied
                from&nbsp;
                <a className="deployment-panel__link"
                  href={'https://console.developers.google.com/project/apiui/' +
                    'credential'}
                  target="_blank">
                  https://console.developers.google.com/project/apiui/credential
                </a>.
              </p>
              <div className="deployment-add-credentials__upload twelve-col">
                Upload GCE auth-file or&nbsp;
                <span className="link">manually set the individual fields</span>
              </div>
            </div>
          </form>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render for azure', function() {
    var cloud = clouds['azure'];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()}
        cloud={cloud}
        jem={jem}
        users={users} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      action: instance._handleChangeCloud,
      title: 'Change cloud',
      type: 'inline-neutral'
    }, {
      title: 'Add credentials',
      action: instance._handleAddCredentials,
      disabled: true,
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Configure Microsoft Azure">
          <div className="deployment-add-credentials__logo">
              <juju.components.SvgIcon
                height={cloud.svgHeight}
                name={cloud.id}
                width={cloud.svgWidth} />
          </div>
          <div className="twelve-col deployment-add-credentials__signup">
            <a href={cloud.signupUrl}
              target="_blank">
              Sign up for {cloud.title}
              &nbsp;
              <juju.components.SvgIcon
                name="external-link-16"
                size="12" />
            </a>
          </div>
          <form className="twelve-col-col">
            <div className="six-col">
              <label className="deployment-panel__label"
                htmlFor="credential-name">
                Credential name
              </label>
              <input className="deployment-panel__input"
                id="credential-name"
                placeholder="AWS_1"
                required="required"
                type="text"
                ref="templateName" />
              <label className="deployment-panel__label"
                htmlFor="specify-region">
                Region
              </label>
              <input className="deployment-panel__input"
                id="specify-region"
                placeholder="us-central1"
                required="required"
                type="text"
                ref="templateRegion" />
            </div>
            <div className="deployment-panel__notice six-col last-col">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Credentials are store securely on our servers and we'll notify
              you by email whenever they are used. See where they are used and
              manage or remove them via the account page.
            </div>
            <h3 className="deployment-panel__section-title twelve-col">
              Enter credentials
            </h3>
            <div className="twelve-col">
              <p className="deployment-add-credentials__p six-col last-col">
                The following fields require your Windows Azure management
                information. For more information please see:&nbsp;
                <a className="deployment-panel__link"
                  href="https://msdn.microsoft.com/en-us/library/windowsazure"
                  target="_blank">
                  https://msdn.microsoft.com/en-us/library/windowsazure
                </a>
                &nbsp;for details.
              </p>
              <div className="deployment-add-credentials__upload twelve-col">
                Upload management certificate &rsaquo;
              </div>
            </div>
          </form>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can add the credentials', function() {
    users = {
      jem: {
        user: 'foo'
      }
    };
    jem = {
      addTemplate: sinon.stub()
    };
    var output = testUtils.renderIntoDocument(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()}
        cloud={clouds['aws']}
        jem={jem}
        setDeploymentInfo={sinon.stub()}
        users={users} />, true);
    var templateName = output.refs.templateName;
    templateName.value = 'foo';
    var templateAccessKey = output.refs.templateAccessKey;
    templateAccessKey.value = 'bar';
    var templateSecretKey = output.refs.templateSecretKey;
    templateSecretKey.value = 'baz';
    output._handleAddCredentials();
    assert.equal(jem.addTemplate.callCount, 1);
  });

  it('can select a new cloud', function() {
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={changeState}
        cloud={clouds['aws']}
        jem={jem}
        users={users} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'choose-cloud'
        }
      }
    });
  });
});
