/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UserProfileEntityKPI = require('./kpi');
const UserProfileEntityMetric = require('./metric');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UserProfileEntityKPI', () => {
  let d3, metrics, metricTypes;

  beforeEach(() => {
    d3 = {};
    metricTypes = ['metric', 'bad-wolf'];
    metrics = [
      {
        metric: 'metric',
        sum: 42,
        count: 5
      },
      {
        metric: 'bad-wolf',
        sum: 53,
        count: 8
      },
      {
        metric: 'metric',
        sum: 80,
        count: 10
      }
    ];
  });

  // The current state of the GUI does not allow choosing from a list of
  // metrics yet. There are bugs to be created in the future, but for now
  // we only test the fact that the KPI component can render its children.
  // Makyo 2017-04-03
  it('can render a default metric', () => {
    let renderer = jsTestUtils.shallowRender(
      <UserProfileEntityKPI
        d3={d3}
        metricTypes={metricTypes}
        metrics={metrics} />, true);
    let output = renderer.getRenderOutput();
    let expected = (
      <div className="twelve-col last-col">
        <UserProfileEntityMetric
          d3={d3}
          metric={[]} />
      </div>);
    assert.deepEqual(output, expected);
  });
});
