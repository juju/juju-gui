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

YUI.add('deployment-summary', function() {

  juju.components.DeploymentSummary = React.createClass({

    propTypes: {
    },

    /**
      Generate the list of change items.

      @method _generateChangeItems
      @returns {Array} The collection of changes.
    */
    _generateChangeItems: function() {
      var changeList = this.props.changeDescriptions;
      var changes = [];
      changeList.forEach(function(change, i) {
        changes.push(
          <juju.components.DeploymentSummaryChangeItem
            key={i}
            change={change} />
          );
      }, this);
      return changes;
    },

    render: function() {
      var listHeaderClassName = 'deployment-summary-change-item ' +
          'deployment-summary__list-header';
      return (
        <div>
          <h2 className="deployment-panel__title">
            Deployment summary
          </h2>
          <juju.components.DeploymentSummaryPlacement
            handleViewMachinesClick={this.props.handleViewMachinesClick}
            handlePlacementChange={this.props.handlePlacementChange}
            autoPlace={this.props.autoPlace}
            getUnplacedUnitCount={this.props.getUnplacedUnitCount} />
          <ul className="deployment-summary__list">
            <li className={listHeaderClassName}>
              <span className="deployment-summary-change-item__change">
                Change
              </span>
              <span className="deployment-summary-change-item__time">
                Time
              </span>
            </li>
            {this._generateChangeItems()}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-summary-change-item',
  'deployment-summary-placement',
]});
