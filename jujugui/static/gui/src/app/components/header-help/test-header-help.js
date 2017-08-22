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

describe('HeaderHelp', function() {
  let appState;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-help', function() { done(); });
  });

  beforeEach(function() {
    appState = {
      current: {},
      changeState: sinon.stub()
    };
  });

  function renderComponent(options={}) {
    const gisf = options.gisf !== undefined ? options.gisf : true;
    const user = options.user !== undefined ? options.user : {name: 'user'};
    return jsTestUtils.shallowRender(
      <juju.components.HeaderHelp
        appState={appState}
        displayShortcutsModal={sinon.stub()}
        gisf={gisf}
        user={user}/>, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.ButtonDropdown
        classes={['header-help']}
        ref="buttonDropdown"
        icon="help_16"
        listItems={[
          <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0" key="docs">
            <a className="dropdown-menu__list-item-link"
              href="https://jujucharms.com/docs/stable/getting-started-jaas"
              target="_blank">
              View Documentation</a>
          </li>,
          <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0" key="issues">
            <a className="dropdown-menu__list-item-link"
              href="https://jujucharms.com/support" target="_blank">Get Support</a>
          </li>,
          <li className="dropdown-menu__list-item" role="menuItem" key="shortcuts"
            tabIndex="0" onClick={instance._handleShortcutsLink}>
            <span className="dropdown-menu__list-item-link">
                Keyboard shortcuts
              <span className="header-help__extra-info">
                  Shift + ?
              </span>
            </span>
          </li>
        ]}
        tooltip="help"
      />);
    expect(output).toEqualJSX(expected);
  });

  it('shows the issues link and no docs link if not in gisf and no user', () => {
    const renderer = renderComponent({
      gisf: false,
      user: null
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.ButtonDropdown
        classes={['header-help']}
        ref="buttonDropdown"
        icon="help_16"
        listItems={[
          null,
          <li className="dropdown-menu__list-item" role="menuitem" tabIndex="0" key="issues">
            <a className="dropdown-menu__list-item-link"
              href="https://github.com/juju/juju-gui/issues" target="_blank">File Issue</a>
          </li>,
          <li className="dropdown-menu__list-item" role="menuItem" key="shortcuts"
            tabIndex="0" onClick={instance._handleShortcutsLink}>
            <span className="dropdown-menu__list-item-link">
                Keyboard shortcuts
              <span className="header-help__extra-info">
                  Shift + ?
              </span>
            </span>
          </li>
        ]}
        tooltip="help"
      />);
    expect(output).toEqualJSX(expected);
  });

  it('keyboard shortcuts link calls app._displayShortcutsModal', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    instance.refs = {
      buttonDropdown: {
        _toggleDropdown: sinon.stub()
      }
    };
    // call the elements onClick
    output.props.listItems[2].props.onClick();
    assert.equal(instance.refs.buttonDropdown._toggleDropdown.callCount, 1);
    assert.equal(instance.props.displayShortcutsModal.callCount, 1);
  });
});
