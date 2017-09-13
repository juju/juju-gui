/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UserProfileAgreementList = require('./agreement-list');
const Spinner = require('../../spinner/spinner');
const DateDisplay = require('../../date-display/date-display');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UserProfileAgreementList', () => {
  var users;

  beforeEach(() => {
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={sinon.stub()}
        getAgreements={sinon.stub().callsArgWith(0, null, [])}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinner when loading', () => {
    var component = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={sinon.stub()}
        getAgreements={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    const expected = (
      <div className="user-profile__agreement-list twelve-col">
        <Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('renders a list of agreements', () => {
    var agreements = [{
      user: 'spinach',
      term: 'One fancy term',
      revision: 47,
      createdAt: new Date(1465510044000)
    }];
    var getAgreements = sinon.stub().callsArgWith(0, null, agreements);
    var component = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={sinon.stub()}
        getAgreements={getAgreements}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    var expected = (
      <div className="user-profile__agreement-list">
        <div className="user-profile__header twelve-col no-margin-bottom">
          Terms &amp; conditions
          <span className="user-profile__size">
            ({1})
          </span>
        </div>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <span className="user-profile__list-col eight-col">
              Name
            </span>
            <span className="user-profile__list-col four-col last-col">
              Date signed
            </span>
          </li>
          {[<li className="user-profile__list-row twelve-col"
            key="One fancy term47">
            <span className="user-profile__list-col eight-col">
              One fancy term
            </span>
            <span className="user-profile__list-col four-col last-col">
              <DateDisplay
                date={agreements[0].createdAt}
                relative={true} />
            </span>
          </li>]}
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('will abort the requests when unmounting', function() {
    var getAgreementsAbort = sinon.stub();
    var getAgreements = sinon.stub().returns({abort: getAgreementsAbort});
    var renderer = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={sinon.stub()}
        getAgreements={getAgreements}
        user={users.charmstore} />, true);
    renderer.unmount();
    assert.equal(getAgreementsAbort.callCount, 1);
  });

  it('displays the empty state', function() {
    const renderer = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={sinon.stub()}
        getAgreements={sinon.stub().callsArgWith(0, null, [])}
        user={users.charmstore} />, true);
    const output = renderer.getRenderOutput();
    assert.strictEqual(output, null);
  });

  it('handles errors when getting agreements', function() {
    const addNotification = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <UserProfileAgreementList
        addNotification={addNotification}
        getAgreements={sinon.stub().callsArgWith(0, 'error', null)}
        user={users.charmstore} />, true);
    const output = renderer.getRenderOutput();
    assert.strictEqual(output, null);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Cannot retrieve terms',
      message: 'Cannot retrieve terms: error',
      level: 'error'
    });
  });
});
