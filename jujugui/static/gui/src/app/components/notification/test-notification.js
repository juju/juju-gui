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

describe('Notification', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('notification', function() { done(); });
  });

  it('renders default', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span>Hello</span>}
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification">
        <p className="p-notification__response">
          <span>Hello</span>
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders positive', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        type="positive"
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification--positive">
        <p className="p-notification__response">
          <span />
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders caution', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        type="caution"
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification--caution">
        <p className="p-notification__response">
          <span />
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders negative', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        type="negative"
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification--negative">
        <p className="p-notification__response">
          <span />
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders with additional classes', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        extraClasses="test"
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification test">
        <p className="p-notification__response">
          <span />
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders with dismiss function', () => {
    const dismiss = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        dismiss={dismiss}
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification">
        <p className="p-notification__response">
          <span />
          <button className="p-notification__action" onClick={dismiss}>
            <window.juju.components.SvgIcon
              name="close_16"
              size="16" />
          </button>
        </p>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can be dismissed', () => {
    const dismiss = sinon.stub();
    const stopPropagation = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        dismiss={dismiss}
      />, true);
    const output = renderer.getRenderOutput();
    output.props.children.props.children[1].props.onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(dismiss.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
  });

  it('renders with a blocking div', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        isBlocking={true}
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification__blocker">
        <div className="p-notification">
          <p className="p-notification__response">
            <span />
          </p>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders with a blocking div and is clickable', () => {
    const dismiss = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Notification
        content={<span></span>}
        dismiss={dismiss}
        isBlocking={true}
      />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="p-notification__blocker"
        onClick={dismiss}>
        <div className="p-notification">
          <p className="p-notification__response">
            <span />
            <button className="p-notification__action" onClick={dismiss}>
              <window.juju.components.SvgIcon
                name="close_16"
                size="16" />
            </button>
          </p>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

});
