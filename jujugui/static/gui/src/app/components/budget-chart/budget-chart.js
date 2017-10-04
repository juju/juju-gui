/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class BudgetChart extends React.Component {
  /**
    Generate the widths for the chart bars.

    @method _generateStyles
    @param {Int} limit The allocation limit.
    @param {Int} allocated The amount previously allocation.
    @param {Int} newAllocations The new amount to be allocated.
    @returns {Object} The element styles.
  */
  _generateStyles(limit, allocated, newAllocations) {
    // Set the width of the new allocations bar to the percent of the limit.
    // If the limit is zero the percent will equal NaN, hence the || 0.
    var newWidth = ((newAllocations / limit * 100) || 0) + '%';
    return {
      existing: {
        // Move the bar to start where the new allocations bar ends.
        left: newWidth,
        // Set the width of the allocated bar to the percent of the limit.
        // If the limit is zero the percent will equal NaN, hence the || 0.
        width: ((allocated / limit * 100) || 0) + '%'
      },
      new: {
        width: newWidth
      }
    };
  }

  render() {
    // If there is no budget data available then default everything to zero.
    var budgets = this.props.budgets || {
      total: {
        allocated: 0,
        limit: 0
      }
    };
    // XXX: The new allocations should be calculated by the state of the
    // allocation forms.
    var newAllocations = 0;
    var total = budgets.total;
    var allocated = total.allocated;
    var limit = total.limit;
    var styles = this._generateStyles(limit, allocated, newAllocations);
    return (
      <div className="budget-chart">
        <div className="budget-chart__chart twelve-col">
          <div className="budget-chart__chart-limit">
          </div>
          <div className="budget-chart__chart-new"
            style={styles.new}>
          </div>
          <div className="budget-chart__chart-existing"
            style={styles.existing}>
          </div>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--new'}>
          </span>
          New allocations: <strong>${newAllocations}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--existing'}>
          </span>
          Existing allocations: <strong>${allocated}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--limit'}>
          </span>
          Budget limit: <strong>${limit}</strong>
        </div>
      </div>
    );
  }
};

BudgetChart.propTypes = {
  budgets: PropTypes.object
};

module.exports = BudgetChart;
