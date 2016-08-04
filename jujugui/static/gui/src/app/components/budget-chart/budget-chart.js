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

YUI.add('budget-chart', function() {

  juju.components.BudgetChart = React.createClass({
    propTypes: {
      budgets: React.PropTypes.object
    },

    /**
      Generate the widths for the chart bars.

      @method _generateStyles
      @param {Int} limit The allocation limit.
      @param {Int} allocated The amount previously allocation.
      @param {Int} newAllocations The new amount to be allocated.
      @returns {Object} The element styles.
    */
    _generateStyles: function(limit, allocated, newAllocations) {
      // Set the width of the new allocations bar to the percent of the limit.
      var newWidth = ((newAllocations / limit * 100) || 0) + '%';
      return {
        existing: {
          // Move the bar to start where the new allocations bar ends.
          left: newWidth,
          // Set the width of the allocated bar to the percent of the limit.
          width: ((allocated / limit * 100) || 0) + '%'
        },
        new: {
          width: newWidth
        }
      };
    },

    render: function() {
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

  });

}, '0.1.0', {
  requires: [
  ]
});
