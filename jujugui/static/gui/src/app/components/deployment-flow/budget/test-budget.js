/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentBudget = require('./budget');
const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const GenericInput = require('../../generic-input/generic-input');
const GenericButton = require('../../generic-button/generic-button');
const ExpandingRow = require('../../expanding-row/expanding-row');
const BudgetChart = require('../../budget-chart/budget-chart');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentBudget', function() {
  var acl, budgets;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    budgets = {budgets: [{
      budget: 'Big budget',
      limit: 20
    }]};
  });

  it('can display a loading spinner', function() {
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={sinon.stub()}
        setBudget={sinon.stub()}
        user="user-admin" />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-budget__loading">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={sinon.stub()}
        user="user-admin" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <ExpandingRow
        classes={{
          'deployment-budget__form': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={false}>
        <div>
          <div className="four-col">
            <InsetSelect
              disabled={false}
              label="Budget"
              onChange={instance._handleBudgetChange}
              options={[{
                label: 'Big budget ($20)',
                value: 'Big budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase-button">
              <GenericButton
                action={instance._toggleIncrease}
                disabled={false}
                type="base">
                Increase budget
              </GenericButton>
            </span>
          </div>
          <BudgetChart
            budgets={budgets} />
        </div>
        <div>
          <div className="deployment-budget__increase-form">
            <h4>Increase budget</h4>
            <div className="two-col">
              Credit limit: $100
            </div>
            <div className="ten-col last-col">
              Available credit: $500
            </div>
            <div className="one-col">
              Increase
            </div>
            <div className="three-col">
              <GenericInput
                disabled={true}
                label="Budget"
                placeholder="Personal ($100)"
                required={false} />
            </div>
            <div className="one-col">
              to
            </div>
            <div className="three-col last-col">
              <GenericInput
                disabled={true}
                label="New budget amount"
                required={false} />
            </div>
            <div>
              <div className="eight-col">
                <span className="link">Manage all budgets</span>
              </div>
              <div className="two-col">
                <GenericButton
                  action={instance._toggleIncrease}
                  disabled={false}
                  type="base">
                  Cancel
                </GenericButton>
              </div>
              <div className="two-col last-col">
                <GenericButton
                  action={instance._toggleIncrease}
                  disabled={false}
                  type="neutral">
                  Confirm
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      </ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={sinon.stub()}
        user="user-admin" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <ExpandingRow
        classes={{
          'deployment-budget__form': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={false}>
        <div>
          <div className="four-col">
            <InsetSelect
              disabled={true}
              label="Budget"
              onChange={instance._handleBudgetChange}
              options={[{
                label: 'Big budget ($20)',
                value: 'Big budget'
              }]} />
          </div>
          <div className="three-col">
            <span className="deployment-budget__increase-button">
              <GenericButton
                action={instance._toggleIncrease}
                disabled={true}
                type="base">
                Increase budget
              </GenericButton>
            </span>
          </div>
          <BudgetChart
            budgets={budgets} />
        </div>
        <div>
          <div className="deployment-budget__increase-form">
            <h4>Increase budget</h4>
            <div className="two-col">
              Credit limit: $100
            </div>
            <div className="ten-col last-col">
              Available credit: $500
            </div>
            <div className="one-col">
              Increase
            </div>
            <div className="three-col">
              <GenericInput
                disabled={true}
                label="Budget"
                placeholder="Personal ($100)"
                required={false} />
            </div>
            <div className="one-col">
              to
            </div>
            <div className="three-col last-col">
              <GenericInput
                disabled={true}
                label="New budget amount"
                required={false} />
            </div>
            <div>
              <div className="eight-col">
                <span className="link">Manage all budgets</span>
              </div>
              <div className="two-col">
                <GenericButton
                  action={instance._toggleIncrease}
                  disabled={true}
                  type="base">
                  Cancel
                </GenericButton>
              </div>
              <div className="two-col last-col">
                <GenericButton
                  action={instance._toggleIncrease}
                  disabled={true}
                  type="neutral">
                  Confirm
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      </ExpandingRow>);
    expect(output).toEqualJSX(expected);
  });

  it('should not load the budgets if there is no user', function() {
    var listBudgets = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={null} />, true);
    renderer.getRenderOutput();
    assert.equal(listBudgets.callCount, 0);
  });

  it('should load the budgets again if the user changes', function() {
    var listBudgets = sinon.stub().callsArgWith(0, null, budgets);
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user={null} />, true);
    renderer.getRenderOutput();
    assert.equal(listBudgets.callCount, 0);
    renderer.render(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user="user-admin" />, true);
    assert.equal(listBudgets.callCount, 1);
  });

  it('will abort the requests when unmounting', function() {
    var abort = sinon.stub();
    var listBudgets = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        setBudget={sinon.stub()}
        user="user-admin" />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can set the initial budget', function() {
    var setBudget = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={setBudget}
        user="user-admin" />);
    assert.equal(setBudget.callCount, 1);
    assert.equal(setBudget.args[0][0], 'Big budget');
  });

  it('can change the budget', function() {
    var setBudget = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={sinon.stub()}
        listBudgets={sinon.stub().callsArgWith(0, null, budgets)}
        setBudget={setBudget}
        user="user-admin" />, true);
    var output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.children.props.onChange(
      'new-budget');
    assert.equal(setBudget.callCount, 2);
    assert.equal(setBudget.args[1][0], 'new-budget');
  });

  it('can handle errors when getting budgets', function() {
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <DeploymentBudget
        acl={acl}
        addNotification={addNotification}
        listBudgets={sinon.stub().callsArgWith(0, 'Uh oh!', null)}
        setBudget={sinon.stub()}
        user="user-admin" />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'cannot retrieve budgets',
      message: 'cannot retrieve budgets: Uh oh!',
      level: 'error'
    });
  });
});
