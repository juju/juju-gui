/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const UserMenu = require('./user-menu');
const ButtonDropdown = require('../button-dropdown/button-dropdown');

describe('UserMenu', () => {

  const loginLink = <div className="login"></div>;
  const logoutLink = <div className="logout"></div>;

  const renderComponent = (options = {}) => enzyme.shallow(
    <UserMenu
      controllerAPI={{
        userIsAuthenticated: options.userIsAuthenticated !== undefined ?
          options.userIsAuthenticated : true
      }}
      LogoutLink={options.LogoutLink || logoutLink}
      navigateUserProfile={options.navigateUserProfile || sinon.stub()}
      showHelp={sinon.stub()}
      USSOLoginLink={
        options.USSOLoginLink !== undefined ?
          options.USSOLoginLink : loginLink} />
  );

  it('can render', () => {
    const wrapper = renderComponent({
      userIsAuthenticated: false
    });
    const expected = (
      <div>
        <ButtonDropdown
          classes={['user-menu']}
          disableDropdown={true}
          icon={loginLink}
          listItems={[{
            action: sinon.stub(),
            label: 'Profile'
          }, {
            action: sinon.stub(),
            label: 'GUI help'
          }, {
            element: logoutLink
          }]}
          tooltip={''} />
      </div>
    );
    assert.compareJSX(wrapper, expected);
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
