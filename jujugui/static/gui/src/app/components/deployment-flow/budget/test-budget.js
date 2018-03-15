/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentBudget = require('./budget');
const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const GenericInput = require('../../generic-input/generic-input');
const GenericButton = require('../../generic-button/generic-button');
const ExpandingRow = require('../../expanding-row/expanding-row');
const BudgetChart = require('../../budget-chart/budget-chart');

describe('DeploymentBudget', function() {
  var acl, budgets;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentBudget
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      listBudgets={options.listBudgets || sinon.stub()}
      setBudget={options.setBudget || sinon.stub()}
      user={options.user === undefined ? 'user-admin' : options.user} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    budgets = {budgets: [{
      budget: 'Big budget',
      limit: 20
    }]};
  });

  it('can display a loading spinner', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="deployment-budget__loading">
        <Spinner />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render', function() {
    const wrapper = renderComponent({
      listBudgets: sinon.stub().callsArgWith(0, null, budgets)
    });
    var expected = (
      <div>
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
                onChange={wrapper.find('InsetSelect').prop('onChange')}
                options={[{
                  label: 'Big budget ($20)',
                  value: 'Big budget'
                }]} />
            </div>
            <div className="three-col">
              <span className="deployment-budget__increase-button">
                <GenericButton
                  action={wrapper.find('GenericButton').at(0).prop('action')}
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
                    action={wrapper.find('GenericButton').at(1).prop('action')}
                    disabled={false}
                    type="base">
                    Cancel
                  </GenericButton>
                </div>
                <div className="two-col last-col">
                  <GenericButton
                    action={wrapper.find('GenericButton').at(2).prop('action')}
                    disabled={false}
                    type="neutral">
                    Confirm
                  </GenericButton>
                </div>
              </div>
            </div>
          </div>
        </ExpandingRow>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent({
      acl,
      listBudgets: sinon.stub().callsArgWith(0, null, budgets)
    });
    assert.equal(wrapper.find('InsetSelect').prop('disabled'), true);
    wrapper.find('GenericButton').forEach(button => {
      assert.equal(button.prop('disabled'), true);
    });
    wrapper.find('GenericInput').forEach(input => {
      assert.equal(input.prop('disabled'), true);
    });
  });

  it('should not load the budgets if there is no user', function() {
    var listBudgets = sinon.stub();
    renderComponent({
      listBudgets,
      user: null
    });
    assert.equal(listBudgets.callCount, 0);
  });

  it('should load the budgets again if the user changes', function() {
    var listBudgets = sinon.stub().callsArgWith(0, null, budgets);
    const wrapper = renderComponent({
      listBudgets,
      user: null
    });
    assert.equal(listBudgets.callCount, 0);
    wrapper.setProps({
      listBudgets,
      user: 'user-admin'
    });
    assert.equal(listBudgets.callCount, 1);
  });

  it('will abort the requests when unmounting', function() {
    var abort = sinon.stub();
    var listBudgets = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({ listBudgets });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can set the initial budget', function() {
    var setBudget = sinon.stub();
    renderComponent({
      setBudget,
      listBudgets: sinon.stub().callsArgWith(0, null, budgets)
    });
    assert.equal(setBudget.callCount, 1);
    assert.equal(setBudget.args[0][0], 'Big budget');
  });

  it('can change the budget', function() {
    var setBudget = sinon.stub();
    const wrapper = renderComponent({
      setBudget,
      listBudgets: sinon.stub().callsArgWith(0, null, budgets)
    });
    wrapper.find('InsetSelect').simulate('change', 'new-budget');
    assert.equal(setBudget.callCount, 2);
    assert.equal(setBudget.args[1][0], 'new-budget');
  });

  it('can handle errors when getting budgets', function() {
    const addNotification = sinon.stub();
    renderComponent({
      addNotification,
      listBudgets: sinon.stub().callsArgWith(0, 'Uh oh!', null)
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'cannot retrieve budgets',
      message: 'cannot retrieve budgets: Uh oh!',
      level: 'error'
    });
  });
});
