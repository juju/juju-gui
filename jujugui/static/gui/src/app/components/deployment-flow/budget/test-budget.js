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
  var acl, budgets;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-budget', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    budgets = {budgets: [{
      budget: 'Big budget',
      limit: 20
    }]};
  });

  it('can display a loading spinner', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={sinon.stub()}
        setBudget={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-budget__loading">
        <juju.components.Spinner />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <div className="deployment-budget__form twelve-col">
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={false}
              label="Budget"
              onChange={instance._handleBudgetChange}
              options={[{
                label: 'Big budget ($20)',
                value: 'Big budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase link">
              Increase budget
            </span>
          </div>
        </div>
        <juju.components.BudgetChart
          budgets={budgets} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div>
        <div className="deployment-budget__form twelve-col">
          <div className="four-col">
            <juju.components.InsetSelect
              disabled={true}
              label="Budget"
              onChange={instance._handleBudgetChange}
              options={[{
                label: 'Big budget ($20)',
                value: 'Big budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase link">
              Increase budget
            </span>
          </div>
        </div>
        <juju.components.BudgetChart
          budgets={budgets} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('should not load the budgets if there is no user', function() {
    var listBudgets = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={{}} />, true);
    renderer.getRenderOutput();
    assert.deepEqual(listBudgets.callCount, 0);
  });

  it('should load the budgets again if the user changes', function() {
    var listBudgets = sinon.stub().callsArgWith(0, null, budgets);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={{}} />, true);
    renderer.getRenderOutput();
    assert.deepEqual(listBudgets.callCount, 0);
    renderer.render(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    assert.deepEqual(listBudgets.callCount, 1);
  });

  it('will abort the requests when unmounting', function() {
    var abort = sinon.stub();
    var listBudgets = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={{user: 'spinach'}} />, true);
    renderer.unmount();
    assert.deepEqual(abort.callCount, 1);
  });

  it('can set the initial budget', function() {
    var setBudget = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={setBudget}
        user={{user: 'spinach'}} />);
    assert.equal(setBudget.callCount, 1);
    assert.equal(setBudget.args[0][0], 'Big budget');
  });

  it('can change the budget', function() {
    var setBudget = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentBudget
        acl={acl}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={setBudget}
        user={{user: 'spinach'}} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.children.props.onChange(
      'new-budget');
    assert.equal(setBudget.callCount, 2);
    assert.equal(setBudget.args[1][0], 'new-budget');
  });
});
