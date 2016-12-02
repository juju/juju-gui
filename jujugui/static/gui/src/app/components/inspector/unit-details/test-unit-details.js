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

describe('UnitDetails', function() {
  var acl, fakeUnit, service;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('unit-details', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      agent_state: 'started',
      id: 'unit1'
    };
    service = {
      get: function(val) {
        if (val === 'id') {
          return 'service1';
        } else {
          return false;
        }
      }
    };
  });

  it('shows the unit properties', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    assert.deepEqual(output.props.children[0],
        <div className='unit-details__properties'>
          <p className='unit-details__property'>
            Status: {fakeUnit.agent_state} {undefined}
          </p>
          <p className='unit-details__property'>
            IP address{''}: {"none"}
          </p>
          {undefined}
          <p className='unit-details__property'>
            Public address{''}: {"none"}
          </p>
          {undefined}
        </div>);
  });

  it('renders workload status when provided', function() {
    fakeUnit.workloadStatusMessage = 'Installing software';
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        previousComponent='units'
        unit={fakeUnit} />);

    assert.deepEqual(output.props.children[0],
        <div className='unit-details__properties'>
          <p className='unit-details__property'>
            Status: {fakeUnit.agent_state} {' - Installing software'}
          </p>
          <p className='unit-details__property'>
            IP address{''}: {"none"}
          </p>
          {undefined}
          <p className='unit-details__property'>
            Public address{''}: {"none"}
          </p>
          {undefined}
        </div>);
  });

  it('shows list of addresses correctly', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      open_ports: ['80/tcp', 443],
      agent_state: 'started',
      id: 'unit1'
    };

    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={sinon.stub()}
        changeState={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    var expected = (
      <div className="unit-details__properties">
        <p className="unit-details__property">
          Status: {fakeUnit.agent_state} {undefined}
        </p>
        <p className="unit-details__property">
          IP address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://192.168.0.1:80">
            <a href="http://192.168.0.1:80" target="_blank">
              {"192.168.0.1"}:{"80"}
            </a>
          </li>
          <li className="unit-details__list-item" key="https://192.168.0.1:443">
            <a href="https://192.168.0.1:443" target="_blank">
              {"192.168.0.1"}:{"443"}
            </a>
          </li>
        </ul>
        <p className="unit-details__property">
          Public address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://93.20.93.20:80">
            <span>
              {"93.20.93.20"}:{"80"}
            </span>
          </li>
          <li className="unit-details__list-item" key="https://93.20.93.20:443">
            <span>
              {"93.20.93.20"}:{"443"}
            </span>
          </li>
        </ul>
      </div>);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('shows list of addresses as links if exposed', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      open_ports: ['80/tcp', 443],
      agent_state: 'started',
      id: 'unit1'
    };
    service = {
      get: function(val) {
        if (val === 'id') {
          return 'service1';
        } else {
          return true;
        }
      }
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={sinon.stub()}
        changeState={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    var expected = (
      <div className="unit-details__properties">
        <p className="unit-details__property">
          Status: {fakeUnit.agent_state} {undefined}
        </p>
        <p className="unit-details__property">
          IP address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://192.168.0.1:80">
            <a href="http://192.168.0.1:80" target="_blank">
              {"192.168.0.1"}:{"80"}
            </a>
          </li>
          <li className="unit-details__list-item" key="https://192.168.0.1:443">
            <a href="https://192.168.0.1:443" target="_blank">
              {"192.168.0.1"}:{"443"}
            </a>
          </li>
        </ul>
        <p className="unit-details__property">
          Public address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://93.20.93.20:80">
            <a href="http://93.20.93.20:80" target="_blank">
              {"93.20.93.20"}:{"80"}
            </a>
          </li>
          <li className="unit-details__list-item" key="https://93.20.93.20:443">
            <a href="https://93.20.93.20:443" target="_blank">
              {"93.20.93.20"}:{"443"}
            </a>
          </li>
        </ul>
      </div>);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('shows no addresses if ports are unavailable', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      agent_state: 'started',
      id: 'unit1'
    };

    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={sinon.stub()}
        changeState={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    assert.deepEqual(output.props.children[0],
      <div className='unit-details__properties'>
        <p className='unit-details__property'>
          Status: {fakeUnit.agent_state} {undefined}
        </p>
        <p className='unit-details__property'>
          IP address{''}: {"none"}
        </p>
        {undefined}
        <p className='unit-details__property'>
          Public address{''}: {"none"}
        </p>
        {undefined}
      </div>);
  });

  it('shows only public address if available', function() {
    fakeUnit = {
      public_address: '93.20.93.20',
      open_ports: [80, 443],
      agent_state: 'started',
      id: 'unit1'
    };

    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={sinon.stub()}
        changeState={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    var expect = (
      <div className='unit-details__properties'>
        <p className='unit-details__property'>
          Status: {fakeUnit.agent_state} {undefined}
        </p>
        <p className='unit-details__property'>
          IP address{''}: {"none"}
        </p>
        {undefined}
        <p className='unit-details__property'>
          Public address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://93.20.93.20:80">
            <span>
              {"93.20.93.20"}:{"80"}
            </span>
          </li>
          <li className="unit-details__list-item" key="https://93.20.93.20:443">
            <span>
              {"93.20.93.20"}:{"443"}
            </span>
          </li>
        </ul>
      </div>);
    assert.deepEqual(output.props.children[0], expect);
  });

  it('shows only private address if available', function() {
    fakeUnit = {
      private_address: '93.20.93.20',
      open_ports: [80, 443],
      agent_state: 'started',
      id: 'unit1'
    };

    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={sinon.stub()}
        changeState={sinon.stub()}
        service={service}
        previousComponent='units'
        unitStatus='error'
        unit={fakeUnit} />);

    var expected = (
      <div className='unit-details__properties'>
        <p className='unit-details__property'>
          Status: {fakeUnit.agent_state} {undefined}
        </p>
        <p className="unit-details__property">
          IP address{'es'}: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="http://93.20.93.20:80">
            <a href="http://93.20.93.20:80" target="_blank">
              {"93.20.93.20"}:{"80"}
            </a>
          </li>
          <li className="unit-details__list-item" key="https://93.20.93.20:443">
            <a href="https://93.20.93.20:443" target="_blank">
              {"93.20.93.20"}:{"443"}
            </a>
          </li>
        </ul>
        <p className='unit-details__property'>
          Public address{''}: {"none"}
        </p>
        {undefined}
      </div>);
    assert.deepEqual(output.props.children[0], expected);
  });

  it('renders the remove button', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        unit={fakeUnit} />);
    var buttons = [{
      disabled: false,
      title: 'Remove',
      action: output.props.children[1].props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[1],
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('can disable remove button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        unit={fakeUnit} />);
    var buttons = [{
      disabled: true,
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
        acl={acl}
        destroyUnits={destroyUnits}
        changeState={changeState}
        service={service}
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
        acl={acl}
        destroyUnits={destroyUnits}
        changeState={changeState}
        unitStatus='pending'
        service={service}
        unit={fakeUnit} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'service1',
          activeComponent: 'units',
          unitStatus: 'pending',
          unit: null
        }}});
  });

  it('can navigate to the expose view when the unit is destroyed', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={destroyUnits}
        changeState={changeState}
        previousComponent='expose'
        service={service}
        unit={fakeUnit} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'service1',
          activeComponent: 'expose',
          unitStatus: undefined,
          unit: null
        }}});
  });
});
