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
    var handlePlacementChange = sinon.stub();
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
        getUnplacedUnitCount={getUnplacedUnitCount}
        changeDescriptions={changeDescriptions}
        handlePlacementChange={handlePlacementChange}
        autoPlace={false} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
      <div>
        <h2 className="deployment-panel__title">
          Deployment summary
        </h2>
        <juju.components.DeploymentSummaryPlacement
          handleViewMachinesClick={instance._handleViewMachinesClick}
          handlePlacementChange={handlePlacementChange}
          autoPlace={false}
          getUnplacedUnitCount={getUnplacedUnitCount} />
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
      </div>);
  });

  it('can navigate to the machine view', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var handlePlacementChange = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummary
        getUnplacedUnitCount={getUnplacedUnitCount}
        changeDescriptions={[]}
        changeState={changeState}
        handlePlacementChange={handlePlacementChange}
        autoPlace={false} />);
    output.props.children[1].props.handleViewMachinesClick();
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
});
