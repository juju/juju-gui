/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ButtonDropdown = require('../button-dropdown/button-dropdown');
const HeaderHelp = require('./header-help');

const jsTestUtils = require('../../utils/component-test-utils');

describe('HeaderHelp', function() {
  let appState;

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
      <HeaderHelp
        appState={appState}
        changeState={sinon.stub()}
        displayShortcutsModal={sinon.stub()}
        gisf={gisf}
        user={user} />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <ButtonDropdown
        classes={['header-help']}
        ref="buttonDropdown"
        icon="help_16"
        listItems={[
          <li key="help"
            className="dropdown-menu__list-item"
            onClick={instance._handleHelpClick}
            role="menuItem" tabIndex="0">
            <span className="dropdown-menu__list-item-link">
              GUI help
            </span>
          </li>,
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
      <ButtonDropdown
        classes={['header-help']}
        ref="buttonDropdown"
        icon="help_16"
        listItems={[
          <li key="help"
            className="dropdown-menu__list-item"
            onClick={instance._handleHelpClick} role="menuItem" tabIndex="0">
            <span className="dropdown-menu__list-item-link">
              GUI help
            </span>
          </li>,
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
    output.props.listItems[3].props.onClick();
    assert.equal(instance.refs.buttonDropdown._toggleDropdown.callCount, 1);
    assert.equal(instance.props.displayShortcutsModal.callCount, 1);
  });
});
