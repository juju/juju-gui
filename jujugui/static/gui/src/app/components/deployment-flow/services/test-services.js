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

describe('DeploymentServices', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-services', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentServices
        acl={acl}
        cloud='azure' />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-services"
        showCheck={true}
        title="Services to be deployed">
        <div className="deployment-services__budget">
          <h4>
            Choose your budget
          </h4>
          <div className="deployment-services__budget-form twelve-col">
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
              <span className="deployment-services__budget-increase link">
                Increase budget
              </span>
            </div>
          </div>
          <juju.components.BudgetChart />
        </div>
        <div className="deployment-services__plans twelve-col">
          <div className="deployment-services__plans-show-changelog">
            <juju.components.GenericButton
              action={
                output.props.children[1].props.children[0].props.children
                .props.action}
              type="neutral"
              title="Show change log" />
          </div>
          <h4>
            Confirm services and plans
          </h4>
          <juju.components.BudgetTable
            acl={acl}
            allocationEditable={true}
            plansEditable={true} />
          <div className="prepend-seven">
            Maximum monthly spend:&nbsp;
            <span className="deployment-services__plans-max">
              $100
            </span>
          </div>
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentServices
        acl={acl}
        cloud='azure' />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-services"
        showCheck={true}
        title="Services to be deployed">
        <div className="deployment-services__budget">
          <h4>
            Choose your budget
          </h4>
          <div className="deployment-services__budget-form twelve-col">
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
              <span className="deployment-services__budget-increase link">
                Increase budget
              </span>
            </div>
          </div>
          <juju.components.BudgetChart />
        </div>
        <div className="deployment-services__plans twelve-col">
          <div className="deployment-services__plans-show-changelog">
            <juju.components.GenericButton
              action={
                output.props.children[1].props.children[0].props.children
                .props.action}
              type="neutral"
              title="Show change log" />
          </div>
          <h4>
            Confirm services and plans
          </h4>
          <juju.components.BudgetTable
            acl={acl}
            allocationEditable={true}
            plansEditable={true} />
          <div className="prepend-seven">
            Maximum monthly spend:&nbsp;
            <span className="deployment-services__plans-max">
              $100
            </span>
          </div>
        </div>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });
});
