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

describe('DeploymentSummaryClassic', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary-classic', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
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
      <juju.components.DeploymentSummaryChangeItemClassic
        key={0}
        change={changeDescriptions[0]} />,
      <juju.components.DeploymentSummaryChangeItemClassic
        key={1}
        change={changeDescriptions[1]} />];
    var className = 'deployment-summary-change-item-classic ' +
        'deployment-summary-classic__list-header';
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummaryClassic
        acl={acl}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        changeDescriptions={changeDescriptions}
        autoPlaceDefault={false} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    assert.deepEqual(output,
      <juju.components.Panel
        instanceName="white-box"
        visible={true}>
        <div className="deployment-summary-classic">
          <div className="deployment-summary-classic__header">
            <span className="deployment-summary-classic__close"
              tabIndex="0" role="button"
              onClick={instance._close}>
              <juju.components.SvgIcon name="close_16"
                size="16" />
            </span>
            <h2 className="deployment-summary-classic__title">
              Deployment summary
            </h2>
            <juju.components.DeploymentSummaryPlacementClassic
              acl={acl}
              handleViewMachinesClick={instance._handleViewMachinesClick}
              handlePlacementChange={instance._handlePlacementChange}
              autoPlace={false}
              getUnplacedUnitCount={getUnplacedUnitCount} />
          </div>
          <div className="deployment-summary-classic__content">
            <ul className="deployment-summary-classic__list">
              <li className={className}>
                <span className={
                  'deployment-summary-change-item-classic__change'}>
                  Change
                </span>
                <span className="deployment-summary-change-item-classic__time">
                  Time
                </span>
              </li>
              {changeItems}
            </ul>
          </div>
          <div className="deployment-summary-classic__footer">
            <juju.components.GenericButton
              type="inline-neutral"
              action={instance._handleClear}
              disabled={false}
              title="Clear changes" />
            <juju.components.GenericButton
              action={instance._handleDeploy}
              disabled={false}
              type="inline-positive"
              title="Deploy" />
          </div>
        </div>
      </juju.components.Panel>);
  });

  it('can disable the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummaryClassic
        acl={acl}
        autoPlaceUnits={sinon.stub()}
        changeState={sinon.stub()}
        ecsClear={sinon.stub()}
        ecsCommit={sinon.stub()}
        getUnplacedUnitCount={getUnplacedUnitCount}
        changeDescriptions={[]}
        autoPlaceDefault={false} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-summary-classic__footer">
        <juju.components.GenericButton
          type="inline-neutral"
          action={instance._handleClear}
          disabled={true}
          title="Clear changes" />
        <juju.components.GenericButton
          action={instance._handleDeploy}
          disabled={true}
          type="inline-positive"
          title="Deploy" />
      </div>);
    assert.deepEqual(output.props.children.props.children[2], expected);
  });
});
