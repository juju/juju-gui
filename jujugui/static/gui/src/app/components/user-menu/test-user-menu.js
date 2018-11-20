/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const UserMenu = require('./user-menu');

describe('UserMenu', () => {

  const loginLink = <div className="login"></div>;
  const logoutLink = <div className="logout"></div>;

  const renderComponent = (options = {}) => enzyme.shallow(
    <UserMenu
      LogoutLink={options.LogoutLink || logoutLink}
      navigateUserProfile={options.navigateUserProfile || sinon.stub()}
      showHelp={sinon.stub()}
      showLogin={options.showLogin !== undefined ? options.showLogin : true}
      USSOLoginLink={
        options.USSOLoginLink !== undefined ?
          options.USSOLoginLink : loginLink} />
  );

  it('can render', () => {
    const wrapper = renderComponent({
      userIsAuthenticated: false
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('renders the login link if supplied', () => {
    const wrapper = renderComponent({
      userIsAuthenticated: false
    });
    assert.deepEqual(wrapper.find('ButtonDropdown').prop('icon'), loginLink);
  });

  it('renders a user icon when no login link is supplied', () => {
    const wrapper = renderComponent({
      USSOLoginLink: null
    });
    assert.equal(wrapper.find('ButtonDropdown').prop('icon'), 'user_16');
  });

  it('navigates to user profile when clicked', () => {
    const navigateUserProfile = sinon.stub();
    const wrapper = renderComponent({navigateUserProfile});
    wrapper.find('ButtonDropdown').prop('listItems')[0].action();
    assert.equal(navigateUserProfile.callCount, 1);
  });

});
