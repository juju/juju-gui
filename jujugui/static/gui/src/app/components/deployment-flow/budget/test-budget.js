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

describe('DeploymentBudget', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-budget', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <div className="deployment-budget__form twelve-col">
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Budget"
              options={[{
                label: 'test budget',
                value: 'test-budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase link">
              Increase budget
            </span>
          </div>
        </div>
        <juju.components.BudgetChart />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <div className="deployment-budget__form twelve-col">
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={true}
              label="Budget"
              options={[{
                label: 'test budget',
                value: 'test-budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase link">
              Increase budget
            </span>
          </div>
        </div>
        <juju.components.BudgetChart />
      </div>);
    assert.deepEqual(output, expected);
  });
});
