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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

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

  it('displays the provided title', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action" />);
    assert.deepEqual(output,
      <button className="generic-button"
        onClick={output.props.onClick}>
        My action
      </button>);
  });

  it('sets the type class', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          type="confirm" />);
    assert.deepEqual(output,
      <button className="generic-button generic-button--type-confirm"
       onClick={output.props.onClick}>
        My action
      </button>);
  });

  it('sets the disabled class if disabled', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.GenericButton
          title="My action"
          disabled="true" />);
    assert.deepEqual(output,
      <button className="generic-button generic-button--disabled"
       onClick={output.props.onClick}>
        My action
      </button>);
  });
});
