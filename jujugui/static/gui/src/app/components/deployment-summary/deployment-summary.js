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
      autoPlaceDefault: React.PropTypes.bool,
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
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _handleClear
    */
    _handleClear: function() {
      this.props.ecsClear();
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
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
      this.setState({hasCommits: true}, () => {
        this.props.changeState({
          sectionC: {
            component: null,
            metadata: {}
          }
        });
      });
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
      var buttons = [{
        title: 'Clear changes',
        action: this._handleClear
      }, {
        title: 'Deploy',
        action: this._handleDeploy,
        type: 'confirm'
      }];
      return (
        <div className="deployment-panel__child">
          <div className="deployment-panel__content">
            <div className="twelve-col">
              <div className="inner-wrapper">
                <h2 className="deployment-panel__title">
                  Deployment summary
                </h2>
                <juju.components.DeploymentSummaryPlacement
                  handleViewMachinesClick={this._handleViewMachinesClick}
                  handlePlacementChange={this._handlePlacementChange}
                  autoPlace={this.state.autoPlace}
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
            </div>
          </div>
          <div className="deployment-panel__footer">
            <div className="twelve-col no-margin-bottom">
              <div className="inner-wrapper">
                <juju.components.ButtonRow
                  buttons={buttons} />
              </div>
            </div>
          </div>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'deployment-summary-change-item',
  'deployment-summary-placement'
]});
