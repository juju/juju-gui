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

describe('MoreMenu', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('more-menu', function() { done(); });
  });

  it('can render as closed', function() {
    var menuItems = [{
      label: 'Add machine',
      action: sinon.stub(),
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      // Have to access the wrapped component as we don't want to test the click
      // outside wrapper.
      <juju.components.MoreMenu.prototype.wrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
        <div className="more-menu">
          <span className="more-menu__toggle"
            onClick={instance._handleToggleMenu}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon
              name="contextual-menu-16"
              size="16" />
          </span>
          {undefined}
        </div>);
    assert.deepEqual(output, expected);
  });

  it('can be opened', function() {
    var menuItems = [{
      label: 'Add machine',
      action: sinon.stub(),
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MoreMenu.prototype.wrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    instance._handleToggleMenu();
    var output = renderer.getRenderOutput();
    var expected = (
        <div className="more-menu more-menu--active">
          <span className="more-menu__toggle"
            onClick={instance._handleToggleMenu}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon
              name="contextual-menu-16"
              size="16" />
          </span>
          <ul className="more-menu__menu">
            <li className="more-menu__menu-item"
              key="Add machine"
              onClick={output.props.children[1].props.children[0].props.onClick}
              role="button"
              tabIndex="0">
              Add machine
            </li>
            <li className="more-menu__menu-item more-menu__menu-item--inactive"
              key="Add container"
              onClick={output.props.children[1].props.children[1].props.onClick}
              role="button"
              tabIndex="0">
              Add container
            </li>
          </ul>
        </div>);
    assert.deepEqual(output, expected);
  });

  it('can call the action on an item', function() {
    var action = sinon.stub();
    var menuItems = [{
      label: 'Add machine',
      action: action,
    }, {
      label: 'Add container'
    }];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.MoreMenu.prototype.wrappedComponent
        items={menuItems}
        title="Sandbox" />, true);
    var instance = renderer.getMountedInstance();
    instance._handleToggleMenu();
    var output = renderer.getRenderOutput();
    output.props.children[1].props.children[0].props.onClick();
    assert.equal(action.callCount, 1);
  });
});
