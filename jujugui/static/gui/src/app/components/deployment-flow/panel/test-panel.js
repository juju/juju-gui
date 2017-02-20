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

describe('DeploymentPanel', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-panel', function() { done(); });
  });

  it('can render', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanel
        changeState={sinon.stub()}
        title="Lamington">
        <span>content</span>
      </juju.components.DeploymentPanel>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    const expected = (
      <juju.components.Panel
        instanceName="deployment-flow-panel"
        visible={true}>
        <div className="deployment-panel">
          <div className="deployment-panel__header">
            <div className="deployment-panel__close">
              <juju.components.GenericButton
                action={instance._handleClose}
                type="neutral"
                title="Back to canvas" />
            </div>
            <div className="deployment-panel__header-name">
              Lamington
            </div>
          </div>
          <div className="deployment-panel__content">
            <div className="twelve-col">
              <div className="inner-wrapper">
                <span>content</span>
              </div>
            </div>
          </div>
        </div>
      </juju.components.Panel>);
    assert.deepEqual(output, expected);
  });

  it('can close', function() {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanel
        changeState={changeState}
        title="Lamington">
        <span>content</span>
      </juju.components.DeploymentPanel>);
    output.props.children.props.children[0].props.children[0].props.children
      .props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {deploy: null},
      profile: null
    });
  });
});
