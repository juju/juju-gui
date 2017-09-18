/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Spinner = require('../../spinner/spinner');
const UserProfileBudgetList = require('./budget-list');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UserProfileBudgetList', () => {
  var users;

  beforeEach(() => {
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <UserProfileBudgetList
        addNotification={sinon.stub()}
        listBudgets={sinon.stub().callsArgWith(0, null, [])}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinner when loading', () => {
    var component = jsTestUtils.shallowRender(
      <UserProfileBudgetList
        addNotification={sinon.stub()}
        listBudgets={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__budget-list twelve-col">
        <Spinner />
      </div>
    ));
  });

  it('renders a list of budgets', () => {
    var data = {budgets: [{
      'owner': 'spinach',
      'budget': 'my-budget',
      'limit': '99',
      'allocated': '77',
      'unallocated': '22',
      'available': '22',
      'consumed': '55'
    }]};
    var listBudgets = sinon.stub().callsArgWith(0, null, data);
    var component = jsTestUtils.shallowRender(
      <UserProfileBudgetList
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var expected = (
      <div className="user-profile__budget-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Budgets
          <span className="user-profile__size">
            ({1})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col three-col">
              Name
            </span>
            <span className="user-profile__list-col two-col">
              Budget
            </span>
            <span className="user-profile__list-col two-col">
              Limit
            </span>
            <span className="user-profile__list-col four-col">
              Credit
            </span>
            <span className="user-profile__list-col one-col last-col">
              Spend
            </span>
          </li>
          {[<li className="user-profile__list-row twelve-col"
            key="my-budget">
            <span className="user-profile__list-col three-col">
                my-budget
            </span>
            <span className="user-profile__list-col two-col">
                ${'77'}
            </span>
            <span className="user-profile__list-col two-col">
                ${'99'}
            </span>
            <span className="user-profile__list-col four-col">
                ${'22'}
            </span>
            <span className="user-profile__list-col one-col last-col">
                ${'55'}
            </span>
          </li>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('will abort the requests when unmounting', function() {
    var listBudgetsAbort = sinon.stub();
    var listBudgets = sinon.stub().returns({abort: listBudgetsAbort});
    var renderer = jsTestUtils.shallowRender(
      <UserProfileBudgetList
        addNotification={sinon.stub()}
        listBudgets={listBudgets}
        user={users.charmstore} />, true);
    renderer.unmount();
    assert.equal(listBudgetsAbort.callCount, 1);
  });

  it('broadcasts error status', function() {
    const addNotification = sinon.stub();
    jsTestUtils.shallowRender(
      <UserProfileBudgetList
        addNotification={addNotification}
        listBudgets={sinon.stub().callsArgWith(0, 'error', null)}
        user={users.charmstore} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot retrieve budgets',
      message: 'Cannot retrieve budgets: error',
      level: 'error'
    });
  });
});
