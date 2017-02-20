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

  it('renders', function () {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderHelp.prototype.wrappedComponent
        appState={appState}
        gisf={false}
        user={null} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();

    const expected = <div className="header-help">
        <span className={'header-help__button'}
          onClick={instance.toggleHelpMenu}
          role="button"
          tabIndex="0"
          aria-haspopup="true"
          aria-owns="headerHelpMenu"
          aria-controls="headerHelpMenu"
          aria-expanded="false">
          <juju.components.SvgIcon name="help_16"
            className="header-help__icon"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              Help
            </span>
          </span>
        </span>
        {''}
      </div>;

    assert.deepEqual(output, expected);
  });

  describe('menu', function () {
    const issueUrl = 'https://github.com/juju/juju-gui/issues';
    const loggedInIssueUrl = 'https://jujucharms.com/issues';
    const docsUrl = 'https://jujucharms.com/docs/stable/getting-started';

    it('opens a menu when clicked', function () {
      const renderer = jsTestUtils.shallowRender(
        <juju.components.HeaderHelp.prototype.wrappedComponent
          appState={appState}
          gisf={false}
          user={null} />, true);
      const instance = renderer.getMountedInstance();
      instance.toggleHelpMenu();
      const output = renderer.getRenderOutput();

      assert.equal(output.props.children.length, 2);
      assert.deepEqual(output.props.children[0].props.className,
        'header-help__button header-help__show-menu');

      assert.deepEqual(output.props.children[1],
        <juju.components.Panel
          instanceName="header-help-menu"
          visible={true}>
            <ul className="header-help-menu__list" role="menubar">
              <li className="header-help-menu__list-item
                header-help-menu__list-item-with-link"
                role="menuitem" tabIndex="0">
                <a
                  href={docsUrl}
                  target="_blank">
                  View Documentation</a>
              </li>
              <li className="header-help-menu__list-item
                header-help-menu__list-item-with-link"
                role="menuitem" tabIndex="1">
                <a href={issueUrl} target="_blank">File Issue</a>
              </li>
              <li className="header-help-menu__list-item
                header-help-menu__list-item-info"
                role="menuItem" tabIndex="2">
                Keyboard shortcuts
                <span className="header-help-menu__extra-info">
                  Shift + ?
                </span>
              </li>
            </ul>
          </juju.components.Panel>);
    });

    it('shows the jujuchams issues page if in gisf and logged in',
      function () {
        const renderer = jsTestUtils.shallowRender(
          <juju.components.HeaderHelp.prototype.wrappedComponent
            appState={appState}
            gisf={true}
            user={{}} />, true);
        const instance = renderer.getMountedInstance();
        instance.toggleHelpMenu();
        const output = renderer.getRenderOutput();

        assert.equal(output.props.children.length, 2);
        assert.deepEqual(output.props.children[0].props.className,
          'header-help__button header-help__show-menu');

        assert.deepEqual(output.props.children[1],
          <juju.components.Panel
            instanceName="header-help-menu"
            visible={true}>
              <ul className="header-help-menu__list" role="menubar">
                <li className="header-help-menu__list-item
                  header-help-menu__list-item-with-link"
                  role="menuitem" tabIndex="0">
                  <a
                    href={docsUrl}
                    target="_blank">
                    View Documentation</a>
                </li>
                <li className="header-help-menu__list-item
                  header-help-menu__list-item-with-link"
                  role="menuitem" tabIndex="1">
                  <a href={loggedInIssueUrl} target="_blank">File Issue</a>
                </li>
                <li className="header-help-menu__list-item
                  header-help-menu__list-item-info"
                  role="menuItem" tabIndex="2">
                  Keyboard shortcuts
                  <span className="header-help-menu__extra-info">
                    Shift + ?
                  </span>
                </li>
              </ul>
            </juju.components.Panel>);
      });
  });
});
