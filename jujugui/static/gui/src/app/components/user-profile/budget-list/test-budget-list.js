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

describe('UserProfileBudgetList', () => {
  var users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-budget-list', () => { done(); });
  });

  beforeEach(() => {
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        listBudgets={sinon.stub().callsArgWith(0, null, [])}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinner when loading', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        listBudgets={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__budget-list twelve-col">
        <juju.components.Spinner />
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
      <juju.components.UserProfileBudgetList
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
      <juju.components.UserProfileBudgetList
        listBudgets={listBudgets}
        user={users.charmstore} />, true);
    renderer.unmount();
    assert.equal(listBudgetsAbort.callCount, 1);
  });

  it('broadcasts starting status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        broadcastStatus={broadcastStatus}
        listBudgets={sinon.stub()}
        user={users.charmstore} />);
    assert.equal(broadcastStatus.args[0][0], 'starting');
  });

  it('broadcasts ok status', function() {
    var data = {budgets: [{
      'owner': 'spinach',
      'budget': 'my-budget',
      'limit': '99',
      'allocated': '77',
      'unallocated': '22',
      'available': '22',
      'consumed': '55'
    }]};
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        broadcastStatus={broadcastStatus}
        listBudgets={sinon.stub().callsArgWith(0, null, data)}
        user={users.charmstore} />);
    assert.equal(broadcastStatus.args[1][0], 'ok');
  });

  it('broadcasts empty status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        broadcastStatus={broadcastStatus}
        listBudgets={sinon.stub().callsArgWith(0, null, {budgets: []})}
        user={users.charmstore} />);
    assert.equal(broadcastStatus.args[1][0], 'empty');
  });

  it('broadcasts error status', function() {
    var broadcastStatus = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.UserProfileBudgetList
        broadcastStatus={broadcastStatus}
        listBudgets={sinon.stub().callsArgWith(0, 'error', null)}
        user={users.charmstore} />);
    assert.equal(broadcastStatus.args[1][0], 'error');
  });
});
