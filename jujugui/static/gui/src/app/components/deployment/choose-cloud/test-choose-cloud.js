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
  var credentials;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-choose-cloud', function() { done(); });
  });

  beforeEach(function() {
    // XXX huwshimi 22 March 2016: this can be removed once the credentials are
    // passed in as a prop.
    credentials = juju.components.DeploymentChooseCloud.prototype.CREDENTIALS;
  });

  afterEach(function() {
    juju.components.DeploymentChooseCloud.prototype.CREDENTIALS = credentials;
  });

  it('can render without credentials', function() {
    juju.components.DeploymentChooseCloud.prototype.CREDENTIALS = [];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={sinon.stub()} />, true);
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
        changeState={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Choose your cloud">
          <div>
            <h3 className="deployment-choose-cloud__title twelve-col">
              Public clouds
            </h3>
            <ul className="deployment-choose-cloud__list twelve-col">
              {[<li className={'deployment-choose-cloud__cloud-option ' +
                'deployment-choose-cloud__cloud-option--credential six-col '}
                key="my-cloud-credentials"
                onClick={output.props.children.props.children[0]
                  .props.children[1].props.children[0].props.onClick}>
                <img alt="aws"
                  className="deployment-choose-cloud__cloud-option-logo"
                  src="juju-ui/assets/images/non-sprites/aws.png" />
                <span className="deployment-choose-cloud__cloud-option-title">
                  My cloud credentials
                </span>
                <div>
                  Owner: {"Me!"}
                  &nbsp;&bull;&nbsp;
                  Used for {3} model{'s'}
                </div>
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
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChooseCloud
        changeState={changeState} />, true);
    var output = renderer.getRenderOutput();
    output.props.children.props.children[0].props.children[1].props.children[0]
      .props.onClick();
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
      <juju.components.DeploymentChooseCloud
        changeState={changeState} />, true);
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
});
