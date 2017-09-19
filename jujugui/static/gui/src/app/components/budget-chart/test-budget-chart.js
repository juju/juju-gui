/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BudgetChart = require('./budget-chart');

const jsTestUtils = require('../../utils/component-test-utils');

describe('BudgetChart', function() {

  it('can render', function() {
    var budgets = {
      total: {
        allocated: 20,
        limit: 80
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <BudgetChart
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
      <BudgetChart />, true);
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
