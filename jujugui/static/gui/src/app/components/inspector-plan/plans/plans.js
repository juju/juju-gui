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
      charm: React.PropTypes.string.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired
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
        this.plansXHR = this.props.listPlansForCharm(
          this.props.charm, this._getPlansCallback);
      })  ;
    },

    /**
      Callback for when plans for an entity have been successfully fetched.

      @method _getPlansCallback
      @param {String} error An error message, or null if there's no error.
      @param {Array} models A list of the plans found.
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
      Generate a list of plans.

      @method _generatePlans
      @return {Function} The React elements for the UI.
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
          <div key={plan.url}>
          <li className="inspector-plan__details inspector-plans__list-plan"
            >
            <div className="inspector-plan__title">{plan.url}</div>
            <div className="inspector-plan__price">{plan.price}</div>
            <div className="inspector-plan__description">
              {plan.description}
            </div>
          </li>
          <li className="inspector-plan__details"
            >
            <div className="inspector-plan__title">{plan.url}</div>
            <div className="inspector-plan__price">{plan.price}</div>
            <div className="inspector-plan__description">
              {plan.description}
            </div>
          </li>
            </div>);
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
