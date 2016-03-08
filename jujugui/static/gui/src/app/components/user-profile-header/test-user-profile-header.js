/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

describe('UserProfileHeader', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-header', () => { done(); });
  });

  it('renders', () => {
    var interactiveLogin = sinon.stub();
    var users = {};
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        users={users}
        avatar="avatar.png"
        bundleCount={5}
        charmCount={2}
        environmentCount={1}
        interactiveLogin={interactiveLogin}
        username="spinach" />);
    var expected = (
      <div className="user-profile-header twelve-col">
        <juju.components.GenericButton
          title="Log in to the charmstore"
          type="login"
          action={interactiveLogin} />
        <img alt="spinach"
          className="user-profile-header__avatar"
          src="avatar.png" />
        <h1 className="user-profile-header__username">
          spinach
        </h1>
        <ul className="user-profile-header__counts">
          <li className="user-profile-header__count">
            {1} model{''}
          </li>
          <li className="user-profile-header__count">
            {5} bundle{'s'}
          </li>
          <li className="user-profile-header__count">
            {2} charm{'s'}
          </li>
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('hides the login button when authenticated to charmstore', () => {
    var users = {charmstore: {user: 'test'}};
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        users={users}
        avatar="avatar.png"
        bundleCount={5}
        charmCount={2}
        environmentCount={1}
        interactiveLogin={sinon.stub()}
        username="spinach" />);
    assert.isUndefined(output.props.children[0]);
  });

  it('shows the login button when no username', () => {
    var users = {charmstore: {loading: true}};
    var interactiveLogin = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        users={users}
        avatar="avatar.png"
        bundleCount={5}
        charmCount={2}
        environmentCount={1}
        interactiveLogin={interactiveLogin}
        username="spinach" />);
    var expected = (
      <juju.components.GenericButton
        title="Log in to the charmstore"
        type="login"
        action={interactiveLogin} />
    );
    assert.deepEqual(output.props.children[0], expected);
  });

  it('can render with a default avatar', () => {
    var users = {charmstore: {user: 'test'}};
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        users={users}
        avatar=""
        bundleCount={5}
        charmCount={2}
        environmentCount={1}
        interactiveLogin={undefined}
        username="spinach" />);
    var expected = (
      <span className={
        'user-profile-header__avatar user-profile-header__avatar--default'}>
        <span className="avatar-overlay"></span>
      </span>);
    assert.deepEqual(output.props.children[1], expected);
  });

});
