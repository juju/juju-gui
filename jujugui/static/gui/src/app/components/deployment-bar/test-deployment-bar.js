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

describe('DeploymentBar', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-bar', function() { done(); });
  });

  it('can render and pass the correct props', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output,
      <juju.components.Panel
        instanceName="deployment-bar-panel"
        visible={true}>
        <juju.components.DeploymentBarChangeCount
          count={2} />
        <juju.components.DeploymentBarDeployButton
          action={deployButtonAction}
          hasChanges={true}
          hasCommits={false} />
      </juju.components.Panel>);
  });

  it('passes the button the correct values if there are changes', function() {
    var currentChangeSet = {one: 1, two: 2};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output.props.children[1],
        <juju.components.DeploymentBarDeployButton
          action={deployButtonAction}
          hasChanges={true}
          hasCommits={false} />);
  });

  it('passes the button the correct values if no changes', function() {
    var currentChangeSet = {};
    var deployButtonAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentBar
        currentChangeSet={currentChangeSet}
        deployButtonAction={deployButtonAction} />);
    assert.deepEqual(output.props.children[1],
        <juju.components.DeploymentBarDeployButton
          action={deployButtonAction}
          hasChanges={false}
          hasCommits={false} />);
  });
});
