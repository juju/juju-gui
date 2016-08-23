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
        increaseExpanded: false,
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

    /**
     Toggle the increase form expanded state.

     @method _toggleIncrease
    */
    _toggleIncrease: function() {
      this.setState({increaseExpanded: !this.state.increaseExpanded});
    },

    render: function() {
      if (this.state.loadingBudgets) {
        return (
          <div className="deployment-budget__loading">
            <juju.components.Spinner />
          </div>);
      }
      var disabled = this.props.acl.isReadOnly();
      var classes = {
        'deployment-budget__form': true,
        'twelve-col': true
      };
      return (
        <juju.components.ExpandingRow
          classes={classes}
          clickable={false}
          expanded={this.state.increaseExpanded}>
          <div>
            <div className="four-col">
              <juju.components.InsetSelect
                disabled={disabled}
                label="Budget"
                onChange={this._handleBudgetChange}
                options={this._generateBudgetOptions()} />
            </div>
            <div className="three-col">
              <span className="deployment-budget__increase-button">
                <juju.components.GenericButton
                  action={this._toggleIncrease}
                  disabled={disabled}
                  type="base"
                  title="Increase budget" />
              </span>
            </div>
            <juju.components.BudgetChart
              budgets={this.state.budgets} />
          </div>
          <div>
            <div className="deployment-budget__increase-form">
              <h4>Increase budget</h4>
              <div className="two-col">
                Credit limit: $100
              </div>
              <div className="ten-col last-col">
                Available credit: $500
              </div>
              <div className="one-col">
                Increase
              </div>
              <div className="three-col">
                <juju.components.GenericInput
                  disabled={true}
                  label="Budget"
                  placeholder="Personal ($100)"
                  required={false} />
              </div>
              <div className="one-col">
                to
              </div>
              <div className="three-col last-col">
                <juju.components.GenericInput
                  disabled={true}
                  label="New budget amount"
                  required={false} />
              </div>
              <div>
                <div className="eight-col">
                  <span className="link">Manage all budgets</span>
                </div>
                <div className="two-col">
                  <juju.components.GenericButton
                    action={this._toggleIncrease}
                    disabled={disabled}
                    type="base"
                    title="Cancel" />
                  </div>
                  <div className="two-col last-col">
                  <juju.components.GenericButton
                    action={this._toggleIncrease}
                    disabled={disabled}
                    type="neutral"
                    title="Confirm" />
                  </div>
              </div>
            </div>
          </div>
        </juju.components.ExpandingRow>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'budget-chart',
    'expanding-row',
    'generic-button',
    'inset-select',
    'loading-spinner'
  ]
});
