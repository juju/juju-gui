/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');

class UserProfileBudgetList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      budgetList: [],
      loadingBudgets: false
    };
  }

  componentWillMount() {
    this._getBudgets();
  }

  componentWillUnmount() {
    this.xhrs.forEach((xhr) => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    // If the user has changed then update the data.
    const props = this.props;
    const currentUser = props.user && props.user.user;
    const nextUser = nextProps.user && nextProps.user.user;
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
      const xhr = this.props.listBudgets(this._getBudgetsCallback.bind(this));
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
        // It's possible that the error is an XHR response object so there
        // won't be an indexOf
        if (error.indexOf && error.indexOf('not found') === -1) {
          // A "profile not found" error is expected, and it means the user
          // does not have a credit limit yet. Notify any other errors.
          const message = 'Cannot retrieve budgets';
          console.error(message, error);
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
        }
        return;
      }
      const budgets = data && data.budgets;
      this.setState({budgetList: budgets});
    });
  }

  /**
    Generate the details for the provided budget.

    @method _generateRow
    @param {Object} budget A budget object.
    @returns {Array} The markup for the row.
  */
  _generateRow(budget) {
    return (
      <li className="user-profile__list-row twelve-col"
        key={budget.budget}>
        <span className="user-profile__list-col three-col">
          {budget.budget}
        </span>
        <span className="user-profile__list-col two-col">
            ${budget.allocated}
        </span>
        <span className="user-profile__list-col two-col">
            ${budget.limit}
        </span>
        <span className="user-profile__list-col four-col">
            ${budget.available}
        </span>
        <span className="user-profile__list-col one-col last-col">
            ${budget.consumed}
        </span>
      </li>);
  }

  /**
    Generate the header for the agreements.

    @method _generateHeader
    @returns {Array} The markup for the header.
  */
  _generateHeader() {
    return (
      <li className="user-profile__list-header twelve-col">
        <span className="user-profile__list-col three-col">
          Name
        </span>
        <span className="user-profile__list-col two-col">
          Budget
        </span>
        <span className="user-profile__list-col two-col">
          Limit
        </span>
        <span className="user-profile__list-col four-col">
          Credit
        </span>
        <span className="user-profile__list-col one-col last-col">
          Spend
        </span>
      </li>);
  }

  render() {
    if (this.state.loadingBudgets) {
      return (
        <div className="user-profile__budget-list twelve-col">
          <Spinner />
        </div>
      );
    }
    const list = this.state.budgetList;
    if (!list || list.length === 0) {
      return null;
    }
    const rows = list.map(this._generateRow.bind(this));
    return (
      <div className="user-profile__budget-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Budgets
          <span className="user-profile__size">
            ({list.length})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          {this._generateHeader()}
          {rows}
        </ul>
      </div>
    );
  }
};

UserProfileBudgetList.propTypes = {
  addNotification: PropTypes.func.isRequired,
  listBudgets: PropTypes.func.isRequired,
  user: PropTypes.object
};

module.exports = UserProfileBudgetList;
