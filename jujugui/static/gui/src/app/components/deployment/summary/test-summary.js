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

describe('DeploymentSummary', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary', function() { done(); });
  });

  it('can display a list of changes', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var changeDescriptions = [{
      icon: 'my-icon.svg',
      description: 'Django was added',
      time: '10:12 am'
    }, {
      icon: 'another-icon.svg',
      description: 'Apache2 was added',
      time: '10:13 am'
    }];
    var changeItems = [
      <juju.components.DeploymentSummaryChangeItem
        key={0}
        change={changeDescriptions[0]} />,
      <juju.components.DeploymentSummaryChangeItem
        key={1}
        change={changeDescriptions[1]} />];
    var className = 'deployment-summary-change-item ' +
        'deployment-summary__list-header';
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={changeDescriptions}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var buttons = [{
      action: instance._handleChangeCloud,
      title: 'Change cloud',
      type: 'inline-neutral'
    }, {
      title: 'Deploy',
      action: instance._handleDeploy,
      disabled: false,
      type: 'inline-positive'
    }];
    var expected = (
      <div className="deployment-panel__child">
        <juju.components.DeploymentPanelContent
          title="Deployment summary">
          {undefined}
          <h3 className="deployment-summary__title">
            Change log ({6})
            {undefined}
          </h3>
          <ul className="deployment-summary__list">
            <li className={className}>
              <span className="deployment-summary-change-item__change">
                Change
              </span>
              <span className="deployment-summary-change-item__time">
                Time
              </span>
            </li>
            {changeItems}
          </ul>
        </juju.components.DeploymentPanelContent>
        <juju.components.DeploymentPanelFooter
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a placement message', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-summary__placement">
        <span>
          You have {'1'} unplaced unit{''} which will
          be automatically placed.
        </span>
        <span className="link" tabIndex="0" role="button"
          onClick={instance._handleViewMachinesClick}>
          View machines
        </span>
      </div>);
    assert.deepEqual(output.props.children[0].props.children[0], expected);
  });

  it('can display a clear changes button', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={true}
        numberOfChanges={6} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <h3 className="deployment-summary__title">
        Change log ({6})
        <span className="link deployment-summary__title-link"
          onClick={instance._handleClear}
          role="button"
          tabIndex="0">
          Clear all changes&nbsp;&rsaquo;
        </span>
      </h3>);
    assert.deepEqual(output.props.children[0].props.children[1], expected);
  });

  it('can navigate to the machine view', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        numberOfChanges={6} />);
    output.props.children[0].props.children[0].props.children[1]
      .props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionB: {
        component: 'machine',
        metadata: {}
      },
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });

  it('can navigate to change the cloud', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={sinon.stub()}
        changeDescriptions={[]}
        changeState={changeState}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        numberOfChanges={6} />);
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

  it('can deploy', function() {
    var autoPlaceUnits = sinon.stub();
    var changeState = sinon.stub();
    var ecsCommit = sinon.stub();
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        autoPlaceUnits={autoPlaceUnits}
        ecsClear={sinon.stub()}
        ecsCommit={ecsCommit}
        changeDescriptions={[]}
        changeState={changeState}
        getUnplacedUnitCount={getUnplacedUnitCount}
        modelCommitted={false}
        numberOfChanges={6} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.buttons[1].action();
    assert.equal(autoPlaceUnits.callCount, 1);
    assert.equal(ecsCommit.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: {}
      }
    });
  });
});
