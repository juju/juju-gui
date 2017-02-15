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
  var links;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-profile-header', () => { done(); });
  });

  beforeEach(() => {
    var action = sinon.stub();
    links = [{
      action: action,
      label: 'a link'
    }, {
      type: 'testClass',
      label: 'some text'
    }];
  });

  it('renders', () => {
    var interactiveLogin = sinon.stub();
    var users = {};
    var output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        users={users}
        avatar="avatar.png"
        interactiveLogin={interactiveLogin}
        links={links}
        username="spinach" />);
    var expected = (
      <div className="user-profile-header twelve-col">
        <juju.components.GenericButton
          title="Log in to the charm store"
          type="inline-neutral"
          action={interactiveLogin} />
        <img alt="spinach"
          className="user-profile-header__avatar"
          src="avatar.png" />
        <h1 className="user-profile-header__username">
          spinach
        </h1>
        <ul className="user-profile-header__links">
          <li className={
            'user-profile-header__link user-profile-header__link--is-link'}
            key="a link"
            onClick={links[0].action}
            role="button"
            tabIndex="0">
            a link
          </li>
          <li className={
            'user-profile-header__link user-profile-header__link--testClass'}
            key="some text">
            some text
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
        interactiveLogin={sinon.stub()}
        links={links}
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
        interactiveLogin={interactiveLogin}
        links={links}
        username="spinach" />);
    var expected = (
      <juju.components.GenericButton
        title="Log in to the charm store"
        type="inline-neutral"
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
        interactiveLogin={undefined}
        links={links}
        username="spinach" />);
    var expected = (
      <span className={
        'user-profile-header__avatar user-profile-header__avatar--default'}>
        <span className="avatar-overlay"></span>
      </span>);
    assert.deepEqual(output.props.children[1], expected);
  });

});
