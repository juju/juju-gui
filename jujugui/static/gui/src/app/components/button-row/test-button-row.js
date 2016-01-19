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

describe('ButtonRow', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('button-row', function() { done(); });
  });

  it('generates a button', function() {
    var callbackStub = sinon.stub();
    var buttons = [{
      title: 'My button',
      type: 'submit',
      action: callbackStub
    }];
    var output = jsTestUtils.shallowRender(
      <juju.components.ButtonRow
        buttons={buttons} />);
    assert.deepEqual(output.props.children, [
      <juju.components.GenericButton
        title="My button"
        key="My button"
        action={callbackStub}
        submit={undefined}
        type="submit" />]);
  });

  it('sets a class when generating multiple buttons', function() {
    var callbackStub = sinon.stub();
    var buttons = [{
      title: 'My button',
      type: 'submit',
      action: callbackStub
    }, {
      title: 'Another button',
      type: 'submit',
      action: callbackStub
    }];
    var output = jsTestUtils.shallowRender(
      <juju.components.ButtonRow
        buttons={buttons} />);
    var children = [
      <juju.components.GenericButton
        title="My button"
        key="My button"
        action={callbackStub}
        submit={undefined}
        type="submit" />,
      <juju.components.GenericButton
        title="Another button"
        key="Another button"
        action={callbackStub}
        submit={undefined}
        type="submit" />
    ];
    assert.deepEqual(output,
      <div className="button-row button-row--multiple button-row--count-2">
        {children}
      </div>);
  });
});
