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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('BudgetChart', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('budget-chart', function() { done(); });
  });

  it('can render', function() {
    var budgets = {
      total: {
        allocated: 20,
        limit: 80
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetChart
        budgets={budgets} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-chart">
        <div className="budget-chart__chart twelve-col">
          <div className="budget-chart__chart-limit">
          </div>
          <div className="budget-chart__chart-new"
            style={{width: '0%'}}>
          </div>
          <div className="budget-chart__chart-existing"
            style={{
              left: '0%',
              width: '25%'
            }}>
          </div>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--new'}>
          </span>
          New allocations: <strong>${0}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--existing'}>
          </span>
          Existing allocations: <strong>${20}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--limit'}>
          </span>
          Budget limit: <strong>${80}</strong>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with no budget data', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetChart />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-chart">
        <div className="budget-chart__chart twelve-col">
          <div className="budget-chart__chart-limit">
          </div>
          <div className="budget-chart__chart-new"
            style={{width: '0%'}}>
          </div>
          <div className="budget-chart__chart-existing"
            style={{
              left: '0%',
              width: '0%'
            }}>
          </div>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--new'}>
          </span>
          New allocations: <strong>${0}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--existing'}>
          </span>
          Existing allocations: <strong>${0}</strong>
        </div>
        <div className="three-col">
          <span className={
            'budget-chart__indicator budget-chart__indicator--limit'}>
          </span>
          Budget limit: <strong>${0}</strong>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

});
