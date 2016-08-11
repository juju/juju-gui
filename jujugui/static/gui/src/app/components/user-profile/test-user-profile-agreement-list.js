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

describe('UserProfileAgreementList', () => {
  var users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-agreement-list', () => { done(); });
  });

  beforeEach(() => {
    users = {charmstore: {
      user: 'test-owner',
      usernameDisplay: 'test owner'
    }};
  });

  it('renders the empty state', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileAgreementList
        getAgreements={sinon.stub().callsArgWith(0, null, [])}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.equal(output, null);
  });

  it('displays loading spinner when loading', () => {
    var component = jsTestUtils.shallowRender(
      <juju.components.UserProfileAgreementList
        getAgreements={sinon.stub()}
        user={users.charmstore} />, true);
    var output = component.getRenderOutput();
    assert.deepEqual(output, (
      <div className="user-profile__agreement-list twelve-col">
        <juju.components.Spinner />
      </div>
    ));
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
      <juju.components.UserProfileAgreementList
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
            <juju.components.DateDisplay
              date={agreements[0].createdAt}
              relative={true} />
            </span>
          </li>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('will abort the requests when unmounting', function() {
    var getAgreementsAbort = sinon.stub();
    var getAgreements = sinon.stub().returns({abort: getAgreementsAbort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.UserProfileAgreementList
        getAgreements={getAgreements}
        user={users.charmstore} />, true);
    renderer.unmount();
    assert.equal(getAgreementsAbort.callCount, 1);
  });
});
