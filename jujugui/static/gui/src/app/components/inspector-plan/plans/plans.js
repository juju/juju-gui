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

YUI.add('inspector-plans', function() {

  juju.components.InspectorPlans = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired
    },

    plansXHR: null,

    getInitialState: function() {
      return {
        plans: [],
        plansLoading: false
      };
    },

    componentDidMount: function() {
      this._getPlans();
    },

    componentWillUnmount: function() {
      if (this.plansXHR) {
        this.plansXHR.abort();
      }
    },

    /**
      Get the list of plans available for the service.

      @method _getPlans
    */
    _getPlans: function() {
      this.setState({plansLoading: true}, () => {
        // TODO: Use the existing list of plans on a charm if it exists.
        this.plansXHR = this.props.listPlansForCharm(
          this.props.service.get('charm'), this._getPlansCallback);
      })  ;
    },

    /**
      Callback for when plans for an entity have been successfully fetched.

      @method _getPlansCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} plans A list of the plans found. The plans have the
        following attributes:
          - url: the plan URL, like "canonical-landscape/24-7";
          - price: the price for this plan;
          - description: a text describing the plan;
          - createdAt: a date object with the plan creation time;
          - yaml: the YAML content for the plan
            (not really useful in this context).
    */
    _getPlansCallback: function(error, plans) {
      if (error) {
        console.error('Fetching plans failed: ' + error);
      } else {
        this.setState({
          plansLoading: false,
          plans: plans
        });
      }
    },

    /**
      Navigate to the plan

      @method _showPlan
    */
    _showPlan: function() {
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.props.service.get('id'),
            activeComponent: 'plan'
          }
        }
      });
    },

    /**
      Generate a list of plans.

      @method _generatePlans
      @return {Object} The React elements for the UI.
    */
    _generatePlans: function() {
      if (this.state.plansLoading) {
        return (
          <div className="inspector-plans__loading">
            <juju.components.Spinner />
          </div>);
      }
      var plans = this.state.plans.map((plan) => {
        return (
          <li className="inspector-plan__details inspector-plans__list-plan"
            onClick={this._showPlan}
            key={plan.url}>
            <div className="inspector-plan__title">{plan.url}</div>
            <div className="inspector-plan__price">{plan.price}</div>
            <div className="inspector-plan__description">
              {plan.description}
            </div>
          </li>);
      });
      return (
        <ul className="inspector-plans__list">
          {plans}
        </ul>);
    },

    render: function() {
      return (
        <div className="inspector-plans">
          {this._generatePlans()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'loading-spinner'
]});
