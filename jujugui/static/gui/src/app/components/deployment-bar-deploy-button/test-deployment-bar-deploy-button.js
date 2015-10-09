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

describe('DeploymentBarDeployButton', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-bar-deploy-button', function() { done(); });
  });

  it('is disabled by default', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBarDeployButton
        hasChanges={false} />);
    assert.deepEqual(output,
      <button className="deployment-bar__deploy-button"
        onClick={output.props.onClick}>
        Deploy changes
      </button>);
  });

  it('is active if there are changes', function() {
    var className = 'deployment-bar__deploy-button ' +
        'deployment-bar__deploy-button--active';
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBarDeployButton
        hasChanges={true} />);
    assert.deepEqual(output,
      <button className={className}
        onClick={output.props.onClick}>
        Deploy changes
      </button>);
  });

  it('displays the correct label if there are commits', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBarDeployButton
        hasCommits={true} />);
    assert.deepEqual(output,
      <button className="deployment-bar__deploy-button"
        onClick={output.props.onClick}>
        Commit changes
      </button>);
  });

  it('only calls the provided action on click if it has changes', function() {
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBarDeployButton
        action={action}
        hasChanges={true} />);
    output.props.onClick();
    assert.equal(action.callCount, 1);
  });

  it('does not call the provided action if it has no changes', function() {
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBarDeployButton
        action={action}
        hasChanges={false} />);
    output.props.onClick();
    assert.equal(action.callCount, 0);
  });
});
