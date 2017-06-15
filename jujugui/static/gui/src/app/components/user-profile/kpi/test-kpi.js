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

describe('UserProfileEntityKPI', () => {
  let d3, metrics, metricTypes;

  beforeAll((done) => {
    YUI().use('user-profile-entity-kpi', () => { done(); });
  });

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
      <juju.components.UserProfileEntityKPI
        d3={d3}
        metricTypes={metricTypes}
        metrics={metrics} />, true);
    let output = renderer.getRenderOutput();
    let expected = (
      <div className="twelve-col last-col">
        <juju.components.UserProfileEntityMetric
          d3={d3}
          metric={[]} />
      </div>);
    assert.deepEqual(output, expected);
  });
});
