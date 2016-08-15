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

describe('DeploymentSummaryPlacementClassic', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary-placement-classic', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render the placement control', function() {
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var handlePlacementChange = sinon.stub();
    var handleViewMachinesClick = sinon.stub();
    var output = juju.components.DeploymentSummaryPlacementClassic({
      acl: acl,
      autoPlace: false,
      handlePlacementChange: handlePlacementChange,
      handleViewMachinesClick: handleViewMachinesClick,
      getUnplacedUnitCount: getUnplacedUnitCount
    });
    assert.deepEqual(output,
      <div className="deployment-summary-classic__placement">
        You have {'1'} unplaced unit{''}, do you want to:
        {' '}
        <form>
          <input type="radio"
              defaultChecked={true}
              disabled={false}
              onChange={handlePlacementChange}
              data-placement="unplaced"
              id="leave-unplaced" name="placement"
              className="deployment-summary-classic__placement-radio" />
          {' '}
          <label htmlFor="leave-unplaced"
              className="deployment-summary-classic__placement-label">
            Leave unplaced
          </label>
          <input type="radio"
              defaultChecked={false}
              disabled={false}
              onChange={handlePlacementChange}
              data-placement="placed"
              id="automatically-place" name="placement"
              className="deployment-summary-classic__placement-radio" />
          {' '}
          <label htmlFor="automatically-place"
            className="deployment-summary-classic__placement-label">
            Automatically place
          </label>
        </form>
        {' '}
        <span className="link" tabIndex="0" role="button"
          onClick={handleViewMachinesClick}>
          View machines
        </span>
      </div>);
  });

  it('does not display if there are no services', function() {
    var getUnplacedUnitCount = sinon.stub().returns(0);
    var handlePlacementChange = sinon.stub();
    var handleViewMachinesClick = sinon.stub();
    var output = juju.components.DeploymentSummaryPlacementClassic({
      acl: acl,
      autoPlace: false,
      handlePlacementChange: handlePlacementChange,
      handleViewMachinesClick: handleViewMachinesClick,
      getUnplacedUnitCount: getUnplacedUnitCount
    });
    assert.deepEqual(output, <div></div>);
  });

  it('can disable the controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var getUnplacedUnitCount = sinon.stub().returns(1);
    var handlePlacementChange = sinon.stub();
    var handleViewMachinesClick = sinon.stub();
    var output = juju.components.DeploymentSummaryPlacementClassic({
      acl: acl,
      autoPlace: false,
      handlePlacementChange: handlePlacementChange,
      handleViewMachinesClick: handleViewMachinesClick,
      getUnplacedUnitCount: getUnplacedUnitCount
    });
    var expected = (
      <form>
        <input type="radio"
            defaultChecked={true}
            disabled={true}
            onChange={handlePlacementChange}
            data-placement="unplaced"
            id="leave-unplaced" name="placement"
            className="deployment-summary-classic__placement-radio" />
        {' '}
        <label htmlFor="leave-unplaced"
            className="deployment-summary-classic__placement-label">
          Leave unplaced
        </label>
        <input type="radio"
            defaultChecked={false}
            disabled={true}
            onChange={handlePlacementChange}
            data-placement="placed"
            id="automatically-place" name="placement"
            className="deployment-summary-classic__placement-radio" />
        {' '}
        <label htmlFor="automatically-place"
          className="deployment-summary-classic__placement-label">
          Automatically place
        </label>
      </form>);
    assert.deepEqual(output.props.children[6], expected);
  });
});
