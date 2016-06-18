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

YUI.add('deployment-summary-classic', function() {

  juju.components.DeploymentSummaryClassic = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      autoPlaceDefault: React.PropTypes.bool.isRequired,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeDescriptions: React.PropTypes.array.isRequired,
      changeState: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired,
      ecsCommit: React.PropTypes.func.isRequired,
      getUnplacedUnitCount: React.PropTypes.func.isRequired
    },

    /**
      Get the current state of the component.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        autoPlace: this.props.autoPlaceDefault
      };
    },

    /**
      Close the summary.

      @method _close
    */
    _close: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _handleClear
    */
    _handleClear: function() {
      this.props.ecsClear();
      this._close();
    },

    /**
      Handle committing when the deploy button in the summary is clicked.

      @method _handleDeploy
    */
    _handleDeploy: function() {
      if (this.state.autoPlace) {
        this.props.autoPlaceUnits();
      }
      // The env is already bound to ecsCommit in app.js.
      this.props.ecsCommit();
      this._close();
    },

    /**
      Handle navigating to the machine view.

      @method _handleViewMachinesClick
    */
    _handleViewMachinesClick: function() {
      this.props.changeState({
        sectionB: {
          component: 'machine',
          metadata: {}
        },
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Handle changes to the placement radio buttons.

      @method _handlePlacementChange
      @param {Object} e The click event.
    */
    _handlePlacementChange: function(e) {
      this.setState({
        autoPlace: e.currentTarget.getAttribute('data-placement') === 'placed'
      });
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
          <juju.components.DeploymentSummaryChangeItemClassic
            key={i}
            change={change} />
          );
      }, this);
      return changes;
    },

    render: function() {
      var isReadOnly = this.props.acl.isReadOnly();
      var listHeaderClassName = 'deployment-summary-change-item-classic ' +
          'deployment-summary-classic__list-header';
      return (
        <juju.components.Panel
          instanceName="white-box"
          visible={true}>
          <div className="deployment-summary-classic">
            <div className="deployment-summary-classic__header">
              <span className="deployment-summary-classic__close"
                tabIndex="0" role="button"
                onClick={this._close}>
                <juju.components.SvgIcon name="close_16"
                  size="16" />
              </span>
              <h2 className="deployment-summary-classic__title">
                Deployment summary
              </h2>
              <juju.components.DeploymentSummaryPlacementClassic
                acl={this.props.acl}
                handleViewMachinesClick={this._handleViewMachinesClick}
                handlePlacementChange={this._handlePlacementChange}
                autoPlace={this.props.autoPlaceDefault}
                getUnplacedUnitCount={this.props.getUnplacedUnitCount} />
            </div>
            <div className="deployment-summary-classic__content">
              <ul className="deployment-summary-classic__list">
                <li className={listHeaderClassName}>
                  <span className={
                    'deployment-summary-change-item-classic__change'}>
                    Change
                  </span>
                  <span className={
                    'deployment-summary-change-item-classic__time'}>
                    Time
                  </span>
                </li>
                {this._generateChangeItems()}
              </ul>
            </div>
            <div className="deployment-summary-classic__footer">
              <juju.components.GenericButton
                type="inline-neutral"
                action={this._handleClear}
                disabled={isReadOnly}
                title="Clear changes" />
              <juju.components.GenericButton
                action={this._handleDeploy}
                disabled={isReadOnly}
                type="inline-positive"
                title="Deploy" />
            </div>
          </div>
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-summary-change-item-classic',
  'deployment-summary-placement-classic',
  'generic-button',
  'panel-component',
  'svg-icon'
]});
