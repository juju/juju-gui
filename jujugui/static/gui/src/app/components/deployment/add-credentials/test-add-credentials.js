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
  var users, jem;

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

  it('can render with credentials', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()}
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
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Configure Amazon Web Services">
          <form>
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
              Specify region
            </label>
            <input className="deployment-panel__input"
              id="specify-region"
              placeholder="us-central1"
              required="required"
              type="text"
              ref="templateRegion" />
            <h3 className="deployment-panel__section-title twelve-col">
              Enter credentials
            </h3>
            <p className="deployment-add-credentials__p">
              Locate your cloud credentials here:<br />
              <a className="deployment-add-credentials__link"
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
