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

describe('DeploymentPanel', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-panel', function() { done(); });
  });

  it('can render', function() {
    var steps = [{
      title: 'Start',
      component: 'start',
    }, {
      title: 'Cloud',
      component: 'cloud',
    }, {
      title: 'Deploy',
      component: 'deploy',
    }];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanel
        activeComponent="cloud"
        changeState={sinon.stub()}
        modelName="my-model"
        steps={steps}>
        <span>content</span>
      </juju.components.DeploymentPanel>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
      <juju.components.Panel
        instanceName="deployment-panel"
        visible={true}>
        <div className="deployment-panel__scroll">
          <div className="deployment-panel__header">
            <juju.components.SvgIcon
              height="30"
              name="juju-logo"
              width="75" />
            <span className="deployment-panel__model-name">
              my-model
            </span>
            <ul className="deployment-panel__header-steps">
              <li className={'deployment-panel__header-step ' +
                'deployment-panel__header-step--completed'}
                key="Start">
                Start
              </li>
              <li className={'deployment-panel__header-step ' +
                'deployment-panel__header-step--active'}
                key="Cloud">
                Cloud
              </li>
              <li className="deployment-panel__header-step"
                key="Deploy">
                Deploy
              </li>
            </ul>
            <span className="deployment-panel__close">
              <juju.components.GenericButton
                action={instance._handleClose}
                type="neutral"
                title="Back to canvas" />
            </span>
          </div>
          <span>content</span>
        </div>
      </juju.components.Panel>);
  });

  it('can close', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanel
        activeComponent="start"
        changeState={changeState}
        steps={[]}
        visible={true}>
        <span>content</span>
      </juju.components.DeploymentPanel>);
    output.props.children.props.children[0].props.children[3].props.children
      .props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });
});
