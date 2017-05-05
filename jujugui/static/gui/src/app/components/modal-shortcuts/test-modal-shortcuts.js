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

describe('ModalSortcuts', function() {

  const keybindings = [
    {label: 'test', help: 'a test item'},
    {label: 'test2', help: 'a second test item'}
  ];

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('modal-shortcuts', function() { done(); });
  });

  function visibleRender(hide = sinon.stub()) {
    return (<div className="modal">
      <div className="twelve-col no-margin-bottom">
        <h2 className="bordered">Keyboard Shortcuts</h2>
        <span className="close" tabIndex="0" role="button"
          onClick={hide}>
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
      <div className="twelve-col">
        <div className="content">
          <div key="test">
            <div className="two-col">
              test
            </div>
            <div className="four-col last-col">
              a test item
            </div>
          </div>
          <div key="test2">
            <div className="two-col">
              test2
            </div>
            <div className="four-col last-col">
              a second test item
            </div>
          </div>
        </div>
      </div>
    </div>);
  }

  it('renders', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ModalShortcuts
        closeModal={close}
        keybindings={keybindings} />, true);
    let output = renderer.getRenderOutput();
    let expected = visibleRender(close);
    expect(output).toEqualJSX(expected);
  });
});
