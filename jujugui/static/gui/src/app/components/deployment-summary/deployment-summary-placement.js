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

YUI.add('deployment-summary-placement-classic', function() {

  var DeploymentSummaryPlacementClassic = function(props) {
    var unplacedCount = props.getUnplacedUnitCount();
    if (unplacedCount === 0) {
      return <div></div>;
    }
    var plural = unplacedCount === 1 ? '' : 's';
    var autoPlace = props.autoPlace;
    var handlePlacementChange = props.handlePlacementChange;
    return (
      <div className="deployment-summary-classic__placement">
        You have {unplacedCount.toString()} unplaced unit{plural}, do you want
        to:{' '}
        <form>
          <input type="radio"
              defaultChecked={!autoPlace}
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
              defaultChecked={autoPlace}
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
          onClick={props.handleViewMachinesClick}>
          View machines
        </span>
      </div>
    );
  };

  DeploymentSummaryPlacementClassic.propTypes = {
    autoPlace: React.PropTypes.bool.isRequired,
    getUnplacedUnitCount: React.PropTypes.func.isRequired,
    handlePlacementChange: React.PropTypes.func.isRequired,
    handleViewMachinesClick: React.PropTypes.func.isRequired
  };

  juju.components.DeploymentSummaryPlacementClassic =
    DeploymentSummaryPlacementClassic;

}, '0.1.0', { requires: []});
