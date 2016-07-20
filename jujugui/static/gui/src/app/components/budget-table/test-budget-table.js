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

describe('BudgetTable', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('budget-table', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTable
        acl={acl}
        plansEditable={false} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="one-col">
            Units
          </div>
          <div className="three-col">
            Details
          </div>
          <div className="two-col">
            Usage
          </div>
          <div className="two-col">
            Allocation
          </div>
          <div className="one-col last-col">
            Spend
          </div>
        </div>
        {[<juju.components.BudgetTableRow
            acl={acl}
            key={0}
            plansEditable={false}
            service={{}} />,
          <juju.components.BudgetTableRow
              acl={acl}
              key={1}
              plansEditable={false}
              service={{}} />]}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display editable plans', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTable
        acl={acl}
        plansEditable={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="one-col">
            Units
          </div>
          <div className="three-col">
            Details
          </div>
          <div className="one-col">
            Usage
          </div>
          <div className="one-col">
            Allocation
          </div>
          <div className="one-col last-col">
            Spend
          </div>
        </div>
        {[<juju.components.BudgetTableRow
            acl={acl}
            key={0}
            plansEditable={true}
            service={{}} />,
          <juju.components.BudgetTableRow
              acl={acl}
              key={1}
              plansEditable={true}
              service={{}} />]}
      </div>);
    assert.deepEqual(output, expected);
  });
});
