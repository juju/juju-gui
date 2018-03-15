/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const GenericInput = require('../../generic-input/generic-input');
const GenericButton = require('../../generic-button/generic-button');
const ExpandingRow = require('../../expanding-row/expanding-row');
const BudgetChart = require('../../budget-chart/budget-chart');

class DeploymentBudget extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      budgets: null,
      increaseExpanded: false,
      loadingBudgets: false
    };
  }

  componentWillMount() {
    if (this.props.user) {
      this._getBudgets();
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    // If the user has changed then update the data.
    var props = this.props;
    var currentUser = props.user;
    var nextUser = nextProps.user;
    if (nextUser !== currentUser) {
      this._getBudgets();
    }
  }

  /**
    Get the budgets for the authenticated user.

    @method _getBudgets
  */
  _getBudgets() {
    // Delay the call until after the state change to prevent race
    // conditions.
    this.setState({loadingBudgets: true}, () => {
      var xhr = this.props.listBudgets(this._getBudgetsCallback.bind(this));
      this.xhrs.push(xhr);
    });
  }

  /**
    Callback for the plans API call to get budgets.

    @method _getBudgetsCallback
    @param {String} error The error from the request, or null.
    @param {Object} data The data from the request.
  */
  _getBudgetsCallback(error, data) {
    this.setState({loadingBudgets: false}, () => {
      if (error) {
        if (error.indexOf('not found') === -1) {
          // A "profile not found" error is expected, and it means the user
          // does not have a credit limit yet. Notify any other errors.
          const message = 'cannot retrieve budgets';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
        }
        return;
      }
      this.setState({budgets: data});
      if (data && data.budgets && data.budgets.length > 0) {
        this.props.setBudget(data.budgets[0].budget);
      }
    });
  }

  /**
    Generate select options for the available budgets.

    @method _generateBudgetOptions
  */
  _generateBudgetOptions() {
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
  }

  /**
    Set the budget value.

    @method _handleBudgetChange
    @param {String} The select value.
  */
  _handleBudgetChange(value) {
    this.props.setBudget(value);
  }

  /**
   Toggle the increase form expanded state.

   @method _toggleIncrease
  */
  _toggleIncrease() {
    this.setState({increaseExpanded: !this.state.increaseExpanded});
  }

  render() {
    if (this.state.loadingBudgets) {
      return (
        <div className="deployment-budget__loading">
          <Spinner />
        </div>);
    }
    var disabled = this.props.acl.isReadOnly();
    var classes = {
      'deployment-budget__form': true,
      'twelve-col': true
    };
    return (
      <div>
        <ExpandingRow
          classes={classes}
          clickable={false}
          expanded={this.state.increaseExpanded}>
          <div>
            <div className="four-col">
              <InsetSelect
                disabled={disabled}
                label="Budget"
                onChange={this._handleBudgetChange.bind(this)}
                options={this._generateBudgetOptions()} />
            </div>
            <div className="three-col">
              <span className="deployment-budget__increase-button">
                <GenericButton
                  action={this._toggleIncrease.bind(this)}
                  disabled={disabled}
                  type="base">
                  Increase budget
                </GenericButton>
              </span>
            </div>
            <BudgetChart
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
                <GenericInput
                  disabled={true}
                  label="Budget"
                  placeholder="Personal ($100)"
                  required={false} />
              </div>
              <div className="one-col">
                to
              </div>
              <div className="three-col last-col">
                <GenericInput
                  disabled={true}
                  label="New budget amount"
                  required={false} />
              </div>
              <div>
                <div className="eight-col">
                  <span className="link">Manage all budgets</span>
                </div>
                <div className="two-col">
                  <GenericButton
                    action={this._toggleIncrease.bind(this)}
                    disabled={disabled}
                    type="base">
                    Cancel
                  </GenericButton>
                </div>
                <div className="two-col last-col">
                  <GenericButton
                    action={this._toggleIncrease.bind(this)}
                    disabled={disabled}
                    type="neutral">
                    Confirm
                  </GenericButton>
                </div>
              </div>
            </div>
          </div>
        </ExpandingRow>
      </div>
    );
  }
};

DeploymentBudget.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  listBudgets: PropTypes.func.isRequired,
  setBudget: PropTypes.func.isRequired,
  user: PropTypes.string
};

module.exports = DeploymentBudget;
