/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileHeader = require('./header');
const Spinner = require('../../spinner/spinner');
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

  it('displays a spinner when loading', () => {
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        getUser={sinon.stub()}
        username="spinach" />);
    const expected = (
      <div className="profile-header twelve-col">
        <Spinner />
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render', () => {
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        getUser={getUser}
        username="spinach" />);
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

  it('can close the profile', () => {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <ProfileHeader
        addNotification={sinon.stub()}
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

  it('can display errors when deleting credentials', () => {
    const addNotification = sinon.stub();
    getUser.callsArgWith(1, 'Uh oh!', null);
    jsTestUtils.shallowRender(
      <ProfileHeader
        addNotification={addNotification}
        changeState={sinon.stub()}
        getUser={getUser}
        username="spinach" />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load the user.',
      message: 'Could not load the user.: Uh oh!',
      level: 'error'
    });
  });

  it('can abort the requests when unmounting', () => {
    const abort = sinon.stub();
    getUser.returns({abort: abort});
    const renderer = jsTestUtils.shallowRender(
      <ProfileHeader
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        getUser={getUser}
        username="spinach" />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });
});
