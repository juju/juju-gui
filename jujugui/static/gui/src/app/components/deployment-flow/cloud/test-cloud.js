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

describe('DeploymentCloud', function() {
  var acl, clouds;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-cloud', function() { done(); });
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

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCloud
        acl={acl}
        cloud={null}
        clouds={clouds}
        setCloud={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var options = output.props.children[0].props.children;
    var expected = (
      <juju.components.DeploymentSection
        buttons={undefined}
        completed={false}
        disabled={false}
        instance="deployment-cloud"
        showCheck={true}
        title="Choose cloud to deploy to">
        <ul className="deployment-cloud__list">
          <li className="deployment-cloud__cloud four-col"
            key="google"
            onClick={options[0].props.onClick}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <juju.components.SvgIcon
                height={33}
                name="google"
                width={256} />
            </span>
          </li>
          <li className="deployment-cloud__cloud four-col"
            key="azure"
            onClick={options[1].props.onClick}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <juju.components.SvgIcon
                height={24}
                name="azure"
                width={204} />
            </span>
          </li>
          <li className="deployment-cloud__cloud four-col last-col"
            key="aws"
            onClick={options[2].props.onClick}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              <juju.components.SvgIcon
                height={48}
                name="aws"
                width={120} />
            </span>
          </li>
          <li className="deployment-cloud__cloud four-col"
            key="local"
            onClick={options[3].props.onClick}
            role="button"
            tabIndex="0">
            <span className="deployment-cloud__cloud-logo">
              Local
            </span>
          </li>
        </ul>
        {undefined}
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can render with a chosen cloud', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCloud
        acl={acl}
        cloud='google'
        clouds={clouds}
        setCloud={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        buttons={[{
          action: output.props.buttons[0].action,
          disabled: false,
          title: 'Change cloud',
          type: 'neutral'
        }]}
        completed={true}
        disabled={false}
        instance="deployment-cloud"
        showCheck={true}
        title="Chosen cloud">
        {undefined}
        <div className="deployment-cloud__chosen">
          <juju.components.SvgIcon
            height={33}
            name="google"
            width={256} />
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('disables the change cloud button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCloud
        acl={acl}
        cloud='google'
        clouds={clouds}
        setCloud={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    assert.isTrue(output.props.buttons[0].disabled);
  });

  it('can select a cloud', function() {
    var setCloud = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCloud
        acl={acl}
        cloud={null}
        clouds={clouds}
        setCloud={setCloud} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick();
    assert.equal(setCloud.callCount, 1);
    assert.equal(setCloud.args[0][0], 'google');
  });

  it('can change the cloud', function() {
    var setCloud = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentCloud
        acl={acl}
        cloud="google"
        clouds={clouds}
        setCloud={setCloud} />, true);
    var output = renderer.getRenderOutput();
    output.props.buttons[0].action();
    assert.equal(setCloud.callCount, 1);
    assert.isNull(setCloud.args[0][0]);
  });
});
