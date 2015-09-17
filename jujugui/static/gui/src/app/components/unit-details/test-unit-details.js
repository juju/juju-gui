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

describe('UnitDetails', function() {
  var listItemStub, icons, fakeUnit;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('service-overview', function() { done(); });
  });

  beforeEach(function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      agent_state: 'started'
    };
  });

  it('shows the unit properties', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    assert.deepEqual(output.props.children[0],
      <div className="unit-details__properties">
        <p>IP address: {fakeUnit.private_address}</p>
        <p>Status: {fakeUnit.agent_state}</p>
        <p>Public address: {fakeUnit.public_address}</p>
      </div>);
  });

  it('renders the remove button', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    var buttons = [{
      title: 'Remove',
      action: output.props.children[1].props.buttons[0].action
      }];
    assert.deepEqual(output.props.children[1],
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('renders the remove confirmation', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    var confirmMessage = 'Are you sure you want to remove the unit? ' +
        'This cannot be undone.';
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={undefined}
        buttons={buttons} />);
  });

  it('shows the confirmation when the remove button is clicked', function() {
    var confirmMessage = 'Are you sure you want to remove the unit? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />, true);
    var output = shallowRenderer.getRenderOutput();
      var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    // Fire the click action.
    output.props.children[1].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={true}
        buttons={buttons} />);
  });

  it('hides the confirmation when the cancel button is clicked', function() {
    var confirmMessage = 'Are you sure you want to remove the unit? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />, true);
    var output = shallowRenderer.getRenderOutput();
      var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    // Open the confirmation.
    output.props.children[1].props.buttons[0].action();
    // close the confirmation.
    output.props.children[2].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={buttons} />);
  });
});
