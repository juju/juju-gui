/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('UserMenu', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('user-menu', function() { done(); });
  });

  const LogoutLink = (<div />);
  function createEle(props, wrappedComponent) {
    props = props || {};
    const renderer = jsTestUtils.shallowRender(
      <juju.components.UserMenu.prototype.wrappedComponent
        LogoutLink={props.LogoutLink || {}}
        USSOLoginLink={props.USSOLoginLink || {}}
        controllerAPI={props.controllerAPI || {}}
        navigateUserAccount={props.navigateUserAccount || sinon.stub()}
        navigateUserProfile={props.navigateUserProfile || sinon.stub()}
        />, true);
    return {
      renderer: renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('renders login text when user not authed', () => {
    const userMenu = createEle();
    const expected = <div className="header-menu">
        <span className={'header-menu__button header-menu__button-with-text'}
          onClick={userMenu.instance.toggleUserMenu}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="userMenu"
          aria-controls="userMenu"
          aria-expanded="false">
          {{}}
        </span>
        {undefined}
      </div>;
    assert.deepEqual(userMenu.output, expected);
  });

  it('renders a user icon when user is authed', () => {
    const userMenu = createEle({
      LogoutLink: LogoutLink,
      controllerAPI: {
        userIsAuthenticated: sinon.stub().returns(true)
      }
    });
    const expected = <div className="header-menu">
        <span className={'header-menu__button'}
          onClick={userMenu.instance.toggleUserMenu}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="userMenu"
          aria-controls="userMenu"
          aria-expanded="false">
          <juju.components.SvgIcon name="user_16"
            className="header-menu__icon"
            size="16" />
        </span>
        {userMenu.instance._generateUserMenu()}
      </div>;
    assert.deepEqual(userMenu.output, expected);
  });

  describe('menu', () => {
    it('opens a menu when clicked', () => {
      const userMenu = createEle({
        LogoutLink: LogoutLink,
        controllerAPI: {
          userIsAuthenticated: sinon.stub().returns(true)
        }
      });
      userMenu.instance.toggleUserMenu();
      const output = userMenu.renderer.getRenderOutput();

      assert.equal(output.props.children.length, 2);
      assert.deepEqual(output.props.children[0].props.className,
        'header-menu__button header-menu__show-menu');

      const expected = (<juju.components.Panel
        instanceName="header-menu__menu"
        visible={true}>
          <ul className="header-menu__menu-list" role="menubar">
            <li className="header-menu__menu-list-item
              header-menu__menu-list-item-with-link"
              role="menuitem" tabIndex="0">
              <a role="button"
                onClick={userMenu.instance._handleProfileClick}>Pofile</a>
            </li>
            <li className="header-menu__menu-list-item
              header-menu__menu-list-item-with-link"
              role="menuitem" tabIndex="0">
              <a role="button"
                onClick={userMenu.instance._handleAccountClick}>Account</a>
            </li>
            <li className="header-menu__menu-list-item
              header-menu__menu-list-item-with-link"
              role="menuitem" tabIndex="0">
              {LogoutLink}
            </li>
          </ul>
        </juju.components.Panel>);
      assert.deepEqual(output.props.children[1], expected);
    });

    it('closes when handleClickOutside is called', () => {
      const userMenu = createEle({
        LogoutLink: LogoutLink,
        controllerAPI: {
          userIsAuthenticated: sinon.stub().returns(true)
        }
      });
      userMenu.instance.toggleUserMenu();
      let output = userMenu.renderer.getRenderOutput();

      assert.equal(output.props.children.length, 2);
      assert.deepEqual(output.props.children[0].props.className,
        'header-menu__button header-menu__show-menu');
      assert.isDefined(output.props.children[1]);

      userMenu.instance.handleClickOutside();
      output = userMenu.renderer.getRenderOutput();
      assert.equal(output.props.children.length, 2);
      assert.deepEqual(output.props.children[0].props.className,
        'header-menu__button');
      assert.deepEqual(output.props.children[1], '');
    });
  });
});
