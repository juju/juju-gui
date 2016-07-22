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

YUI.add('inspector-plan', function() {

  juju.components.InspectorPlan = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      currentPlan: React.PropTypes.object,
      service: React.PropTypes.object.isRequired
    },

    /**
      Navigates to the Choose Plans UI.

      @method _navigatePlans
    */
    _navigatePlans: function() {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.service.get('id'),
            activeComponent: 'plans'
          }
        }
      });
    },

    /**
      Generates the footer buttons for the UI depending on if the application
      has a selected plan or not.

      @method _generateButtons
      @return {Function} The React elements for the UI.
    */
    _generateButtons: function() {
      var currentPlan = this.props.currentPlan;
      var buttons = [{
        title: currentPlan ? 'Change plan' : 'Choose plan',
        action: this._navigatePlans,
        type: 'neutral'
      }];
      return (
        <juju.components.ButtonRow
          buttons={buttons}/>);
    },

    /**
      Generates the elements if the applicaton has a plan selected.

      @method _generatePlanDetails
      @return {Function} The React elements for the UI.
    */
    _generatePlanDetails: function() {
      var currentPlan = this.props.currentPlan;
      return (
        <div className="inspector-plan__details">
          <div className="inspector-plan__title">{currentPlan.url}</div>
          <div className="inspector-plan__price">{currentPlan.price}</div>
          <div className="inspector-plan__description">
            {currentPlan.description}
          </div>
        </div>);
    },

    /**
      Generates the elements if the application does not have a plan selected.

      @method _generateNoPlans
      @return {Function} The React elements for the UI.
    */
    _generateNoPlans: function() {
      return (
        <div className="inspector-plan__no-plan">
          You have no active plan
        </div>);
    },

    render: function() {
      return (
        <div className="inspector-plan">
          {this.props.currentPlan ?
            this._generatePlanDetails() : this._generateNoPlans()}
          {this._generateButtons()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'button-row'
]});
