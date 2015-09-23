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
      agent_state: 'started',
      id: 'unit1'
    };
  });

  it('shows the unit properties', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        unit={fakeUnit} />);
    assert.deepEqual(output.props.children[0],
      <div className="unit-details__properties">
        <p className="unit-details__property">
          IP address: {fakeUnit.private_address}
        </p>
        <p className="unit-details__property">
          Status: {fakeUnit.agent_state}
        </p>
        <p className="unit-details__property">
          Public address: {fakeUnit.public_address}
        </p>
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

  it('destroys the unit when the destroy button is clicked', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        destroyUnits={destroyUnits}
        changeState={changeState}
        unit={fakeUnit} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [fakeUnit.id]);
  });

  it('navigates to the unit list when the unit is destroyed', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        destroyUnits={destroyUnits}
        changeState={changeState}
        serviceId="service1"
        unit={fakeUnit} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'service1',
          activeComponent: 'units'
        }}});
  });
});
