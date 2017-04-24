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

describe('ModalGUISettings', function() {
  const _localStorage = {
    setItem: sinon.stub(),
    removeItem: sinon.stub()
  };

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('modal-gui-settings', function() { done(); });
  });

  function visibleRender(
    hide = sinon.stub(),
    handleChange = sinon.stub(),
    state = {},
    handleSave = sinon.stub()) {
    return (<div id="#shortcut-settings">
      <div className="twelve-col no-margin-bottom">
        <h2 className="bordered">Custom GUI Settings</h2>
        <span className="close" tabIndex="0" role="button"
          onClick={hide}>
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
      <div className="content">
        <p>
          <label htmlFor="disable-cookie">
            <input type="checkbox" name="disable-cookie"
              id="disable-cookie"
              onChange={handleChange}
              defaultChecked={state['disable-cookie']} />&nbsp;
              Disable the EU cookie warning.
          </label>
        </p>
        <p>
          <label htmlFor="force-containers">
            <input type="checkbox" name="force-containers"
              id="force-containers"
              onChange={handleChange}
              defaultChecked={state['force-containers']} />&nbsp;
              Enable container control for this provider.
          </label>
        </p>
        <p>
          <label htmlFor="disable-auto-place">
            <input type="checkbox" name="disable-auto-place"
              id="disable-auto-place"
              onChange={handleChange}
              defaultChecked={state['disable-auto-place']} />&nbsp;
              Default to not automatically place units on commit.
          </label>
        </p>
        <p>
          <small>
            NOTE: You will need to reload for changes to take effect.
          </small>
        </p>
        <input type="button" className="button--positive"
          name="save-settings" onClick={handleSave}
          id="save-settings" value="Save"/>
      </div>
    </div>);
  }

  it('renders', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ModalGUISettings
        closeModal={close}
        localStorage={_localStorage} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    let expected = visibleRender(close);
    expect(output).toEqualJSX(expected);
  });

  it('saves state', function() {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ModalGUISettings
        closeModal={close}
        disableAutoPlace={true}
        localStorage={_localStorage} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({
      'disable-cookie': true,
      'disable-auto-place': null
    });
    instance.handleSave();

    assert.equal(_localStorage.setItem.callCount, 1);
    assert.equal(_localStorage.removeItem.callCount, 2);
  });
});
