/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileHeader = require('./header');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Header', function() {
  let getUser;

  beforeEach(() => {
    getUser = sinon.stub().callsArgWith(1, null, {
      email: 'spinach@example.com',
      fullname: 'Geoffrey Spinach',
      gravatar_id: 'id123'
    });
  });

  it('can render', () => {
    const renderer = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    const instance = renderer.getMountedInstance();
    // Triggering a componentWillMount before grabbing the rendered output so
    // that the getUser call will have returned and rendered the gravatar UI.
    // The following test tests the 'not yet returned' state.
    instance.componentWillMount();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper profile-header__inner">
          <div className="profile-header__close link"
            onClick={sinon.stub()}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="close_16"
              size="20" />
          </div>
          <span className="profile-header__avatar">
            <img alt="Gravatar"
              className="profile-header__avatar-gravatar"
              src="https://www.gravatar.com/avatar/id123" />
          </span>
          <ul className="profile-header__meta">
            <li>
              <h1 className="profile-header__username">
                spinach
              </h1>
            </li>
            <li><strong>Geoffrey Spinach</strong></li>
            <li>spinach@example.com</li>
          </ul>
          <ul className="profile-header__menu">
            <li>
              <h2 className="profile-header__menutitle">
                <a href="/">jaas</a>
              </h2>
            </li>
            <li><a href="https://jujucharms.com/home">Home</a></li>
            <li><a href="https://jujucharms.com/jaas">About JAAS</a></li>
          </ul>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('displays a hidden gravatar until the user request has returned', () => {
    // For the test where it has returned successfully see the above tests.
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={sinon.stub()}
        getUser={() => {}}
        username="spinach" />);
    assert.equal(
      output.props.children.props.children[1].props.className,
      'profile-header__avatar profile-header__avatar--default profile-header__avatar--hidden');
  });

  it('displays the fallback gravatar if the user request fails', () => {
    const renderer = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={sinon.stub()}
        getUser={(u, c) => c(null, null)}
        username="spinach" />, true);
    renderer.getMountedInstance().componentWillMount();
    const output = renderer.getRenderOutput();
    const expected = (
      <span className="profile-header__avatar profile-header__avatar--default">
        <span className="profile-header__avatar-overlay"></span>
      </span>);
    expect(output.props.children.props.children[1]).toEqualJSX(expected);
  });

  it('can close the profile', () => {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        changeState={changeState}
        getUser={getUser}
        username="spinach" />);
    output.props.children.props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
      profile: null
    });
  });
});
