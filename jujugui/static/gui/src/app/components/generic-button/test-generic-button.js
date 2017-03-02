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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('GenericButton', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('generic-button', function() { done(); });
  });

  it('calls the callable provided when clicked', function() {
    var callbackStub = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          action={callbackStub} />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
    assert.equal(callbackStub.callCount, 1);
  });

  it('does not call the callable if clicked when disabled', function() {
    var callbackStub = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          disabled={true}
          action={callbackStub} />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
    assert.equal(callbackStub.callCount, 0);
  });

  it('does not submit when disabled', function() {
    var preventDefault = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          disabled={true}
          submit={true} />);
    output.props.onClick({
      preventDefault: preventDefault,
      stopPropagation: sinon.stub()
    });
    assert.equal(preventDefault.callCount, 1);
  });

  it('does not call the callable if not provided', function() {
    // This is checking that code is not executed and so there are no side
    // effects to check. No syntax error is considered a success.
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton />);
    output.props.onClick({
      stopPropagation: sinon.stub()
    });
  });

  it('stop the event propogating when clicked', function() {
    var callbackStub = sinon.stub();
    var stopPropagation = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          action={callbackStub} />);
    output.props.onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(stopPropagation.callCount, 1);
  });

  it('displays the provided title and tooltip', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          tooltip="My tooltip" />);
    assert.deepEqual(output,
      <button className="button--neutral"
        title="My tooltip"
        onClick={output.props.onClick}
        type="button">
        My action
      </button>);
  });

  it('displays a provided icon', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          icon="plus_1" />);
    assert.deepEqual(output,
      <button className="button--neutral"
        title={undefined}
        onClick={output.props.onClick}
        type="button">
        <juju.components.SvgIcon name="plus_1"
          size="16" />
      </button>);
  });

  it('displays provided children', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.GenericButton>
        Hello, world.
      </juju.components.GenericButton>
    );
    assert.deepEqual(output,
      <button className="button--neutral"
        title={undefined}
        onClick={output.props.onClick}
        type="button">
        Hello, world.
      </button>);
  });

  it('sets the type class', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          type="neutral" />);
    assert.deepEqual(output,
      <button className="button--neutral"
       title={undefined}
       onClick={output.props.onClick}
       type="button">
        My action
      </button>);
  });

  it('sets the disabled class if disabled', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          disabled={true} />);
    assert.deepEqual(output,
      <button className="button--neutral button--disabled"
       title={undefined}
       onClick={output.props.onClick}
       type="button">
        My action
      </button>);
  });

  it('sets the extra classes if provided', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          extraClasses="button--large" />);
    assert.deepEqual(output,
      <button className="button--neutral button--large"
       title={undefined}
       onClick={output.props.onClick}
       type="button">
        My action
      </button>);
  });
});
