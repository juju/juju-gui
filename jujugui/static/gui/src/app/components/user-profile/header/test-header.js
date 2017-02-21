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
    const action = sinon.stub();
    links = [{
      action: action,
      label: 'a link'
    }, {
      type: 'testClass',
      label: 'some text'
    }];
  });

  it('renders', () => {
    const interactiveLogin = sinon.stub();
    const userInfo = {profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={interactiveLogin}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <div className="user-profile-header twelve-col">
        <juju.components.GenericButton
          title="Log in to the charm store"
          type="inline-neutral"
          action={interactiveLogin} />
        <img alt="who"
          className="user-profile-header__avatar"
          src="avatar.png" />
        <h1 className="user-profile-header__username">
          who
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

  it('hides the login button when authenticated to charm store', () => {
    const userInfo = {external: 'who-ext', profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={sinon.stub()}
        links={links}
        userInfo={userInfo}
      />);
    assert.isUndefined(output.props.children[0]);
  });

  it('shows the login button when no external user', () => {
    const interactiveLogin = sinon.stub();
    const userInfo = {profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        avatar="avatar.png"
        interactiveLogin={interactiveLogin}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <juju.components.GenericButton
        title="Log in to the charm store"
        type="inline-neutral"
        action={interactiveLogin} />
    );
    assert.deepEqual(output.props.children[0], expected);
  });

  it('can render with a default avatar', () => {
    const userInfo = {external: 'who-ext', profile: 'who'};
    const output = jsTestUtils.shallowRender(
      <juju.components.UserProfileHeader
        avatar=""
        interactiveLogin={undefined}
        links={links}
        userInfo={userInfo}
      />);
    const expected = (
      <span className={
        'user-profile-header__avatar user-profile-header__avatar--default'}>
        <span className="avatar-overlay"></span>
      </span>);
    assert.deepEqual(output.props.children[1], expected);
  });

});
