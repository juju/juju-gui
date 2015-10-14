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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Deployment', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-component', function() { done(); });
  });

  it('can display the deployment bar', function() {
    var currentChangeSet = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        currentChangeSet={currentChangeSet}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar" />);
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentBar
          hasCommits={false}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
  });

  it('displays the deployment bar by default', function() {
    var currentChangeSet = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        generateChangeDescription={generateChangeDescription}
        currentChangeSet={currentChangeSet} />);
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentBar
          hasCommits={false}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
  });

  it('tracks that it has commits after the first deploy', function() {
    var currentChangeSet = sinon.stub();
    var generateChangeDescription = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-summary"
        currentChangeSet={currentChangeSet} />, true);
    var output = shallowRenderer.getRenderOutput();
    output.props.children.props.deployButtonAction();
    shallowRenderer.render(
      <juju.components.Deployment
        ecsCommit={sinon.stub()}
        generateChangeDescription={generateChangeDescription}
        activeComponent="deployment-bar"
        currentChangeSet={currentChangeSet} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentBar
          hasCommits={true}
          generateChangeDescription={generateChangeDescription}
          deployButtonAction={output.props.children.props.deployButtonAction}
          currentChangeSet={currentChangeSet} />
      </div>);
  });

  it('can display the deployment summary', function() {
    var currentChangeSet = sinon.stub();
    var changeDescriptions = {};
    var output = jsTestUtils.shallowRender(
      <juju.components.Deployment
        currentChangeSet={currentChangeSet}
        changeDescriptions={changeDescriptions}
        activeComponent="deployment-summary" />);
    assert.deepEqual(output,
      <div className="deployment-view">
        <juju.components.DeploymentSummary
          deployButtonAction={output.props.children.props.deployButtonAction}
          closeButtonAction={output.props.children.props.closeButtonAction}
          changeDescriptions={changeDescriptions}
          currentChangeSet={currentChangeSet} />
      </div>);
  });
});
