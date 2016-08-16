/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('deployment-budget', function() {

  juju.components.DeploymentBudget = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      listBudgets: React.PropTypes.func.isRequired,
      setBudget: React.PropTypes.func.isRequired,
      user: React.PropTypes.object,
    },

    getInitialState: function() {
      this.xhrs = [];

      return {
        budgets: null,
        loadingBudgets: false,
      };
    },

    componentWillMount: function() {
      if (this.props.user && this.props.user.user) {
        this._getBudgets();
      }
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    componentWillReceiveProps: function(nextProps) {
      // If the user has changed then update the data.
      var props = this.props;
      var currentUser = props.user && props.user.user;
      var nextUser = nextProps.user && nextProps.user.user;
      if (nextUser !== currentUser) {
        this._getBudgets();
      }
    },

    /**
      Get the budgets for the authenticated user.

      @method _getBudgets
    */
    _getBudgets: function() {
      // Delay the call until after the state change to prevent race
      // conditions.
      this.setState({loadingBudgets: true}, () => {
        var xhr = this.props.listBudgets(this._getBudgetsCallback);
        this.xhrs.push(xhr);
      });
    },

    /**
      Callback for the plans API call to get budgets.

      @method _getBudgetsCallback
      @param {String} error The error from the request, or null.
      @param {Object} data The data from the request.
    */
    _getBudgetsCallback: function(error, data) {
      this.setState({loadingBudgets: false}, () => {
        if (error) {
          if (error.indexOf('not found') === -1) {
            // A "profile not found" error is expected, and it means the user
            // does not have a credit limit yet. Notify any other errors.
            // TODO huwshimi: notify the user with the error.
            console.error('cannot retrieve budgets:', error);
          }
          return;
        }
        this.setState({budgets: data});
        if (data && data.budgets && data.budgets.length > 0) {
          this.props.setBudget(data.budgets[0].budget);
        }
      });
    },

    /**
      Generate select options for the available budgets.

      @method _generateBudgetOptions
    */
    _generateBudgetOptions: function() {
      var budgets = this.state.budgets;
      if (!budgets) {
        return [];
      }
      return budgets.budgets.map(budget => {
        return {
          label: `${budget.budget} ($${budget.limit})`,
          value: budget.budget
        };
      });
    },

    /**
      Set the budget value.

      @method _handleBudgetChange
      @param {String} The select value.
    */
    _handleBudgetChange: function(value) {
      this.props.setBudget(value);
    },

    render: function() {
      if (this.state.loadingBudgets) {
        return (
          <div className="deployment-budget__loading">
            <juju.components.Spinner />
          </div>);
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <div>
          <div className="deployment-budget__form twelve-col">
            <div className="four-col">
              <juju.components.InsetSelect
                disabled={disabled}
                label="Budget"
                onChange={this._handleBudgetChange}
                options={this._generateBudgetOptions()} />
            </div>
            <div className="three-col">
              <span className="deployment-budget__increase link">
                Increase budget
              </span>
            </div>
          </div>
          <juju.components.BudgetChart
            budgets={this.state.budgets} />
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'budget-chart',
    'inset-select',
    'loading-spinner'
  ]
});
