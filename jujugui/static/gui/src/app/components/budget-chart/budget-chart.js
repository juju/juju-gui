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
    render: function() {
      return (
        <div className="budget-chart">
          <div className="budget-chart__chart twelve-col">
            <div className="budget-chart__chart-limit">
            </div>
            <div className="budget-chart__chart-new">
            </div>
          </div>
          <div className="three-col">
            <span className={
              'budget-chart__indicator budget-chart__indicator--new'}>
            </span>
            New allocations: <strong>$550</strong>
          </div>
          <div className="three-col">
            <span className={
              'budget-chart__indicator budget-chart__indicator--existing'}>
            </span>
            Existing allocations: <strong>$0</strong>
          </div>
          <div className="three-col">
            <span className={
              'budget-chart__indicator budget-chart__indicator--limit'}>
            </span>
            Budget limit: <strong>$1000</strong>
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
  ]
});
