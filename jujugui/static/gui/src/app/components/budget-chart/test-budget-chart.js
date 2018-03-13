/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BudgetChart = require('./budget-chart');

describe('BudgetChart', function() {
  const renderComponent = (options = {}) => enzyme.shallow(
    <BudgetChart
      budgets={options.budgets || null} />
  );

  it('can render', function() {
    var budgets = {
      total: {
        allocated: 20,
        limit: 80
      }
    };
    const wrapper = renderComponent({ budgets });
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
    assert.compareJSX(wrapper, expected);
  });

  it('can render with no budget data', function() {
    const wrapper = renderComponent();
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
    assert.compareJSX(wrapper, expected);
  });

});
