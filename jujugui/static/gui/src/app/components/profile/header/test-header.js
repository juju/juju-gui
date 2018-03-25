/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ProfileHeader = require('./header');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('Profile Header', function() {
  let getUser;

  const renderComponent = (options = {}) => enzyme.shallow(
    <ProfileHeader
      changeState={options.changeState || sinon.stub()}
      controllerIP={options.controllerIP || '1.2.3.4'}
      getUser={options.getUser || getUser}
      gisf={options.gisf === undefined ? true : options.gisf}
      userInfo={options.userInfo || {
        isCurrent: true,
        profile: 'spinach'
      }} />
  );

  beforeEach(() => {
    getUser = sinon.stub().callsArgWith(1, null, {
      email: 'spinach@example.com',
      fullname: 'Geoffrey Spinach',
      gravatar_id: 'id123'
    });
  });

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="profile-header twelve-col">
        <div className="inner-wrapper profile-header__inner">
          <div className="profile-header__close link"
            onClick={wrapper.find('.profile-header__close').prop('onClick')}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="close_16"
              size="20" />
          </div>
          <span className="profile-header__avatar tooltip">
            <a href="http://gravatar.com/"
              target="_blank">
              <img alt="Gravatar"
                className="profile-header__avatar-gravatar"
                src="https://www.gravatar.com/avatar/id123" />
            </a>
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                Edit your <strong>Gravatar</strong>
              </span>
            </span>
          </span>
          <ul className="profile-header__meta">
            <li className="profile-header__username">
              <h1>
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
    assert.compareJSX(wrapper, expected);
  });

  it('can render correctly for the non-logged in user', () => {
    const wrapper = renderComponent({
      userInfo: {
        isCurrent: false,
        profile: 'notspinach'
      }
    });
    assert.equal(wrapper.find('.profile-header__menu').length, 0);
    assert.equal(wrapper.find('.tooltip__tooltip').length, 0);
  });

  it('displays a different link list for non-jaas', () => {
    const wrapper = renderComponent({ gisf: false });
    const expected = (
      <ul className="profile-header__menu">
        <li key="controller">
          <h2 className="profile-header__menutitle">
            1.2.3.4
          </h2>
        </li>
        <li key="home"><a href="https://jujucharms.com/about">Juju Home</a></li>
      </ul>
    );
    assert.compareJSX(wrapper.find('.profile-header__menu'), expected);
  });

  it('displays a hidden gravatar until the user request has returned', () => {
    // For the test where it has returned successfully see the above tests.
    const wrapper = renderComponent({ getUser: sinon.stub() });
    assert.equal(
      wrapper.find('.profile-header__avatar').prop('className').includes(
        'profile-header__avatar--hidden'),
      true);
  });

  it('displays the fallback gravatar if the user request fails', () => {
    const wrapper = renderComponent({
      getUser: sinon.stub().callsArgWith(1, null, null)
    });
    assert.equal(
      wrapper.find('.profile-header__avatar').prop('className').includes(
        'profile-header__avatar--default'),
      true);
  });

  it('can close the profile', () => {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('.profile-header__close').props().onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
      profile: null
    });
  });
});
