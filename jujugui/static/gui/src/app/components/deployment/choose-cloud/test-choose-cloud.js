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

describe('DeploymentChooseCloud', function() {
  var clouds, jem;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-choose-cloud', function() { done(); });
  });

  beforeEach(function() {
    jem = {
      listTemplates: cb => cb(null, [{path: 'test-owner/test'}]),
      listClouds: cb => cb(null, ['aws'])
    };
    clouds = {
      aws: {
        id: 'aws',
        signupUrl: 'https://portal.aws.amazon.com/gp/aws/developer/' +
        'registration/index.html',
        svgHeight: 48,
        svgWidth: 120,
        title: 'Amazon Web Services'
      },
      azure: {
        id: 'azure',
        signupUrl: 'https://azure.microsoft.com/en-us/free/',
        svgHeight: 24,
        svgWidth: 204,
        title: 'Microsoft Azure'
      },
      google: {
        id: 'google',
        signupUrl: 'https://console.cloud.google.com/billing/freetrial',
        svgHeight: 33,
        svgWidth: 256,
        title: 'Google Compute Engine'
      }
    };
  });

  afterEach(function() {
    jem = null;
  });

  it('can render without credentials without clouds', function() {
    jem.listTemplates = cb => cb(null, []);
    jem.listClouds = cb => cb(null, []);
    var pluralize = sinon.stub();
    pluralize.withArgs('service', sinon.match.any).returns('services');
    pluralize.withArgs('machine', sinon.match.any).returns('machine');
    var get = sinon.stub();
    get.withArgs('name').returns('wordpress');
    get.withArgs('icon').returns('wordpress.svg');
    get.withArgs('id').returns('wordpress1');
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        cloudData={clouds}
        jem={jem}
        setDeploymentInfo={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose cloud">
          <div className="deployment-panel__notice twelve-col">
            <p className="deployment-panel__notice-content">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Add a public cloud credential, and we can save it as an option
              for later use
            </p>
          </div>
          <div className="deployment-panel__notice twelve-col">
            <p className="deployment-panel__notice-content">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Fetching available clouds...
            </p>
          </div>
          <div className="deployment-choose-cloud__download twelve-col">
            <juju.components.SvgIcon
              height="30"
              name="juju-logo"
              width="75" />
            Deploy manually using Juju to OpenStack, Vmware, MAAS, Joyent or
            locally to your computer
            <a className={'deployment-choose-cloud__download-button ' +
              'button--inline-neutral'}
              href="https://jujucharms.com/docs/stable/reference-releases"
              target="_blank">
              Download Juju
            </a>
          </div>
        </juju.components.DeploymentPanelContent>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with credentials without clouds', function() {
    jem.listClouds = cb => cb(null, []);
    var pluralize = sinon.stub();
    pluralize.withArgs('service', sinon.match.any).returns('services');
    pluralize.withArgs('machine', sinon.match.any).returns('machine');
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        cloudData={clouds}
        jem={jem}
        setDeploymentInfo={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose cloud or saved credential">
          <div>
            <h3 className="deployment-panel__section-title twelve-col">
              Saved cloud credentials
            </h3>
            <ul className="deployment-choose-cloud__list twelve-col">
              {[<li className={'deployment-choose-cloud__cloud-option ' +
                'deployment-choose-cloud__cloud-option--credential six-col'}
                key="test-owner/test"
                onClick={output.props.children.props.children[0]
                  .props.children[1].props.children[0].props.onClick}>
                <span className="deployment-choose-cloud__cloud-option-title">
                  <span className="deployment-choose-cloud__cloud-option-name">
                    test
                  </span>
                  <span className="deployment-choose-cloud__cloud-option-owner">
                    test-owner
                  </span>
                </span>
              </li>]}
            </ul>
            <h3 className="deployment-panel__section-title twelve-col">
              Public clouds
            </h3>
          </div>
          <div className="deployment-panel__notice twelve-col">
            <p className="deployment-panel__notice-content">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Fetching available clouds...
              </p>
          </div>
          <div className="deployment-choose-cloud__download twelve-col">
            <juju.components.SvgIcon
              height="30"
              name="juju-logo"
              width="75" />
            Deploy manually using Juju to OpenStack, Vmware, MAAS, Joyent or
            locally to your computer
            <a className={'deployment-choose-cloud__download-button ' +
              'button--inline-neutral'}
              href="https://jujucharms.com/docs/stable/reference-releases"
              target="_blank">
              Download Juju
            </a>
          </div>
        </juju.components.DeploymentPanelContent>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render without credentials and with clouds', function() {
    jem.listTemplates = cb => cb(null, []);
    var pluralize = sinon.stub();
    pluralize.withArgs('service', sinon.match.any).returns('services');
    pluralize.withArgs('machine', sinon.match.any).returns('machine');
    var get = sinon.stub();
    get.withArgs('name').returns('wordpress');
    get.withArgs('icon').returns('wordpress.svg');
    get.withArgs('id').returns('wordpress1');
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        cloudData={clouds}
        jem={jem}
        setDeploymentInfo={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose cloud">
          <div className="deployment-panel__notice twelve-col">
            <p className="deployment-panel__notice-content">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              Add a public cloud credential, and we can save it as an option
              for later use
            </p>
          </div>
          <ul className="deployment-choose-cloud__list twelve-col">
            {[<li className="deployment-choose-cloud__cloud-option four-col "
              key="aws"
              onClick={output.props.children.props.children[1]
                  .props.children[0].props.onClick}>
              <span className="deployment-choose-cloud__cloud-option-image">
                <juju.components.SvgIcon
                  height={clouds['aws'].svgHeight}
                  name={clouds['aws'].id}
                  width={clouds['aws'].svgWidth} />
              </span>
            </li>,
            <li className="deployment-choose-cloud__cloud-option four-col "
              key="azure"
              onClick={output.props.children.props.children[1]
                  .props.children[1].props.onClick}>
              <span className="deployment-choose-cloud__cloud-option-image">
                <juju.components.SvgIcon
                  height={clouds['azure'].svgHeight}
                  name={clouds['azure'].id}
                  width={clouds['azure'].svgWidth} />
              </span>
            </li>,
            <li className=
                    "deployment-choose-cloud__cloud-option four-col last-col"
              key="google"
              onClick={output.props.children.props.children[1]
                  .props.children[2].props.onClick}>
              <span className="deployment-choose-cloud__cloud-option-image">
                <juju.components.SvgIcon
                  height={clouds['google'].svgHeight}
                  name={clouds['google'].id}
                  width={clouds['google'].svgWidth} />
              </span>
            </li>]}
          </ul>
          <div className="deployment-choose-cloud__download twelve-col">
            <juju.components.SvgIcon
              height="30"
              name="juju-logo"
              width="75" />
            Deploy manually using Juju to OpenStack, Vmware, MAAS, Joyent or
            locally to your computer
            <a className={'deployment-choose-cloud__download-button ' +
              'button--inline-neutral'}
              href="https://jujucharms.com/docs/stable/reference-releases"
              target="_blank">
              Download Juju
            </a>
          </div>
        </juju.components.DeploymentPanelContent>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can navigate from a credential', function() {
    var changeState = sinon.stub();
    var setDeploymentInfo = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={changeState}
        cloudData={clouds}
        jem={jem}
        setDeploymentInfo={setDeploymentInfo} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[1].props.children[0]
      .props.onClick();
    assert.equal(changeState.callCount, 1);
    // It should store the template name in the parentId
    assert.equal(setDeploymentInfo.callCount, 1);
    assert.deepEqual(
      setDeploymentInfo.args[0],
      ['templateName', 'test-owner/test']);
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
    var setDeploymentInfo = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={changeState}
        cloudData={clouds}
        jem={jem}
        setDeploymentInfo={setDeploymentInfo} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(setDeploymentInfo.args[0], ['cloud', 'aws']);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'add-credentials-aws'
        }
      }
    });
  });

});
