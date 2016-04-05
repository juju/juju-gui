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
  var jem;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-choose-cloud', function() { done(); });
  });

  beforeEach(function() {
    jem = {
      listTemplates: (callback) => {
        callback(null, [{path: 'test-owner/test'}]);
      }
    };
  });

  afterEach(function() {
    jem = null;
  });

  it('can render without credentials', function() {
    jem.listTemplates = (callback) => {
      callback(null, null);
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        setDeploymentInfo={sinon.stub()}
        jem={jem} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose your cloud">
          {undefined}
          <div className="deployment-choose-cloud__notice twelve-col">
            <juju.components.SvgIcon
              name="general-action-blue"
              size="16" />
            Add a public cloud credential, and we can save it as an option
            for later use
          </div>
          <h3 className="deployment-choose-cloud__title twelve-col">
            Public clouds
          </h3>
          <ul className="deployment-choose-cloud__list twelve-col">
            {[<li className="deployment-choose-cloud__cloud-option six-col "
                key="aws"
                onClick={output.props.children.props.children[3]
                  .props.children[0].props.onClick}>
                <img alt="aws"
                  src="juju-ui/assets/images/non-sprites/aws.png" />
              </li>]}
          </ul>
          <h3 className="deployment-choose-cloud__title twelve-col">
            Get credentials by signing up with your favoured public cloud
          </h3>
          <ul className="deployment-choose-cloud__list">
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://cloud.google.com/compute/"
                target="_blank">
                Google Compute Engine&nbsp;&rsaquo;
              </a>
            </li>
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://azure.microsoft.com/"
                target="_blank">
                Windows Azure&nbsp;&rsaquo;
              </a>
            </li>
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://aws.amazon.com/"
                target="_blank">
                Amazon Web Services&nbsp;&rsaquo;
              </a>
            </li>
          </ul>
        </juju.components.DeploymentPanelContent>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with credentials', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        setDeploymentInfo={sinon.stub()}
        jem={jem} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose your cloud">
          <div>
            <h3 className="deployment-choose-cloud__title twelve-col">
              Your cloud credentials
            </h3>
            <ul className="deployment-choose-cloud__list twelve-col">
              {[<li className={'deployment-choose-cloud__cloud-option ' +
                'deployment-choose-cloud__cloud-option--credential six-col'}
                key="test-owner/test"
                onClick={output.props.children.props.children[0]
                  .props.children[1].props.children[0].props.onClick}>
                <span className="deployment-choose-cloud__cloud-option-title">
                  test-owner/test
                </span>
              </li>]}
            </ul>
          </div>
          {undefined}
          <h3 className="deployment-choose-cloud__title twelve-col">
            Public clouds
          </h3>
          <ul className="deployment-choose-cloud__list twelve-col">
            {[<li className="deployment-choose-cloud__cloud-option six-col "
                key="aws"
                onClick={output.props.children.props.children[3]
                  .props.children[0].props.onClick}>
                <img alt="aws"
                  src="juju-ui/assets/images/non-sprites/aws.png" />
              </li>]}
          </ul>
          <h3 className="deployment-choose-cloud__title twelve-col">
            Get credentials by signing up with your favoured public cloud
          </h3>
          <ul className="deployment-choose-cloud__list">
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://cloud.google.com/compute/"
                target="_blank">
                Google Compute Engine&nbsp;&rsaquo;
              </a>
            </li>
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://azure.microsoft.com/"
                target="_blank">
                Windows Azure&nbsp;&rsaquo;
              </a>
            </li>
            <li>
              <a className="deployment-choose-cloud__link"
                href="https://aws.amazon.com/"
                target="_blank">
                Amazon Web Services&nbsp;&rsaquo;
              </a>
            </li>
          </ul>
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
        setDeploymentInfo={setDeploymentInfo}
        jem={jem} />, true);
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={changeState}
        setDeploymentInfo={sinon.stub()}
        jem={jem} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.children[3].props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'deploy',
        metadata: {
          activeComponent: 'add-credentials'
        }
      }
    });
  });

  it('handles errors gracefully', function() {
    jem.listTemplates = (callback) => {
      callback(true, null);
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()}
        setDeploymentInfo={sinon.stub()}
        jem={jem} />, true);
    var output = renderer.getRenderOutput();
    var credentials = output.props.children.props.children[0];
    assert.equal(credentials, undefined);
  });
});
