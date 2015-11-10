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

    /**
      A component for the placement form.

      @method _generatePlacementControl
      @returns {Object} The placement component.
    */
    _generatePlacementControl: function() {
      var unplacedCount = this.props.getUnplacedUnitCount();
      var plural = unplacedCount === 1 ? '' : 's';
      if (unplacedCount === 0) {
        return;
      }
      var autoPlace = this.props.autoPlace;
      var handlePlacementChange = this.props.handlePlacementChange;
      return (
        <div className="deployment-summary__placement">
          You have {unplacedCount.toString()} unplaced unit{plural}, do you want
          to:{' '}
          <form>
            <input type="radio"
                defaultChecked={!autoPlace}
                onChange={handlePlacementChange}
                data-placement="unplaced"
                id="leave-unplaced" name="placement"
                className="deployment-summary__placement-radio" />
            {' '}
            <label htmlFor="leave-unplaced"
                className="deployment-summary__placement-label">
              Leave unplaced
            </label>
            <input type="radio"
                defaultChecked={autoPlace}
                onChange={handlePlacementChange}
                data-placement="placed"
                id="automatically-place" name="placement"
                className="deployment-summary__placement-radio" />
            {' '}
            <label htmlFor="automatically-place"
              className="deployment-summary__placement-label">
              Automatically place
            </label>
          </form>
          {' '}
          <span className="link" tabIndex="0" role="button"
            onClick={this.props.handleViewMachinesClick}>
            View machines
          </span>
        </div>
      );
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
        <juju.components.Panel
          instanceName="deployment-summary-panel"
          visible={true}>
          <div className="deployment-summary">
            <div className="deployment-summary__header">
              <span className="deployment-summary__close"
                tabIndex="0" role="button"
                onClick={this.props.closeButtonAction}>
                <juju.components.SvgIcon name="close_16"
                  size="16" />
              </span>
              <h2 className="deployment-summary__title">
                Deployment summary
              </h2>
              {this._generatePlacementControl()}
            </div>
            <div className="deployment-summary__content">
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
            <div className="deployment-summary__footer">
              <juju.components.GenericButton
                action={this.props.deployButtonAction}
                type="confirm"
                title="Deploy" />
            </div>
          </div>
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-summary-change-item',
  'generic-button',
  'panel-component',
  'svg-icon'
]});
