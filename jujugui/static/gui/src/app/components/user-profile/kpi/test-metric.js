/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('UserProfileEntityMetrics', () => {
  let d3, metrics, metricTypes;

  beforeAll((done) => {
    YUI().use(['user-profile-entity-metric', 'd3'], (Y) => {
      d3 = Y.namespace('d3');
      done();
    });
  });

  beforeEach(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    metrics = [
      {
        metric: 'metric',
        time: yesterday,
        sum: 42,
        count: 5
      },
      {
        metric: 'metric',
        time: today,
        sum: 80,
        count: 10
      }
    ];
  });

  it('renders a chart', () => {
    let renderer = jsTestUtils.shallowRender(
        <juju.components.UserProfileEntityMetric
          d3={d3}
          metricTypes={metricTypes}
          metric={metrics} />, true);
    let output = renderer.getRenderOutput();
    const expected = (
        <div className='kpi-metric-chart'
          ref={output.ref}>
        </div>);
    assert.deepEqual(output, expected);
    renderer.getMountedInstance()._renderChart(document.body);
    // We need to check the endpoints of the line generated from the metrics
    // data. This is in the 'd' attribute of the path classed 'mean'.
    const d = d3.select('svg').select('.mean').attr('d');
    // Path specs start with an 'M' and have points separated by 'L';
    // discard the M and retrieve our two points.
    const points = d.substring(1).split('L');
    // The first point is a known quantity.
    assert.equal(points[0], '20,10');
    // The second point, is less known given floating point arithmetic, so it
    // needs to be massaged into something we can assert on.
    const end = points[1].split(',');
    assert.equal(parseInt(end[0], 10), 500);
    assert.equal(Math.ceil(end[1]), 20);
  });
});
