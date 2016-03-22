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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentAddCredentials', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-add-credentials', function() { done(); });
  });

  it('can render with credentials', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      title: 'Change cloud',
      action: instance._handleChangeCloud
    }, {
      title: 'Add credentials',
      action: instance._handleAddCredentials,
      type: 'confirm'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Configure Amazon Web Services">
          <form>
            <input className="deployment-add-credentials__input"
                placeholder="Credential name"
               type="text" />
            <input className="deployment-add-credentials__input"
                placeholder="Specify region"
               type="text" />
            <h3 className="deployment-add-credentials__title twelve-col">
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
            <input className="deployment-add-credentials__input"
                placeholder="Access-key"
               type="text" />
            <input className="deployment-add-credentials__input"
                placeholder="Secret-key"
               type="text" />
          </form>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can add the credentials', function() {
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={changeState} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.buttons[1].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'summary'
        }
      }
    });
  });

  it('can select a new cloud', function() {
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentAddCredentials
        changeState={changeState} />, true);
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
