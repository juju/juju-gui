/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const UnitDetails = require('./unit-details');
const ButtonRow = require('../../button-row/button-row');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('UnitDetails', function() {
  var acl, fakeUnit, service;

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    fakeUnit = {
      id: 'unit1',
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      agent_state: 'started',
      agentStatus: 'idle',
      workloadStatus: 'maintenance',
      workloadStatusMessage: 'doing stuff'
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
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className='unit-details__properties'>
        <div>
          <p className='unit-details__property'>
            Status: started - doing stuff
          </p>
          <p className="unit-details__property">
            Agent Status: idle
          </p>
          <p className="unit-details__property">
            Workload Status: maintenance
          </p>
        </div>
        <p className='unit-details__property'>
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="93.20.93.20">
            <span>
              {'93.20.93.20'}
            </span>
          </li>
        </ul>
        <p className='unit-details__property'>
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="192.168.0.1">
            <span>
              {'192.168.0.1'}
            </span>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('does not render workload status message when not provided', function() {
    fakeUnit.workloadStatusMessage = '';
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit} />);
    const expectedOutput = (
      <div className='unit-details__properties'>
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
          <p className="unit-details__property">
            Agent Status: idle
          </p>
          <p className="unit-details__property">
            Workload Status: maintenance
          </p>
        </div>
        <p className='unit-details__property'>
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="93.20.93.20">
            <span>
              {'93.20.93.20'}
            </span>
          </li>
        </ul>
        <p className='unit-details__property'>
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="192.168.0.1">
            <span>
              {'192.168.0.1'}
            </span>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('does not render agent/workload statuses when not provided', function() {
    fakeUnit.agentStatus = '';
    fakeUnit.workloadStatus = '';
    fakeUnit.workloadStatusMessage = '';
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className='unit-details__properties'>
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
        </div>
        <p className='unit-details__property'>
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="93.20.93.20">
            <span>
              {'93.20.93.20'}
            </span>
          </li>
        </ul>
        <p className='unit-details__property'>
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="192.168.0.1">
            <span>
              {'192.168.0.1'}
            </span>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('does not render statuses if uncommitted', function() {
    fakeUnit.agent_state = '';
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit} />);
    const expectedOutput = (
      <div className='unit-details__properties'>
        <p className='unit-details__property'>
          Status: uncommitted
        </p>
        <p className='unit-details__property'>
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="93.20.93.20">
            <span>
              {'93.20.93.20'}
            </span>
          </li>
        </ul>
        <p className='unit-details__property'>
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item" key="192.168.0.1">
            <span>
              {'192.168.0.1'}
            </span>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('shows list of addresses correctly', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      agent_state: 'started',
      id: 'unit1'
    };
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className="unit-details__properties">
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
        </div>
        <p className="unit-details__property">
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="93.20.93.20:9000-10000/udp">
            <span>
              {'93.20.93.20:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:443">
            <span>
              {'93.20.93.20:443'}
            </span>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:8080">
            <span>
              {'93.20.93.20:8080'}
            </span>
          </li>
        </ul>
        <p className="unit-details__property">
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="192.168.0.1:9000-10000/udp">
            <span>
              {'192.168.0.1:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:443">
            <a href="https://192.168.0.1:443" target="_blank">
              {'192.168.0.1:443'}
            </a>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:8080">
            <a href="http://192.168.0.1:8080" target="_blank">
              {'192.168.0.1:8080'}
            </a>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('shows list of addresses as links if exposed', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      public_address: '93.20.93.20',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      agent_state: 'pending',
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
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className="unit-details__properties">
        <div>
          <p className='unit-details__property'>
            Status: pending
          </p>
        </div>
        <p className="unit-details__property">
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="93.20.93.20:9000-10000/udp">
            <span>
              {'93.20.93.20:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:443">
            <a href="https://93.20.93.20:443" target="_blank">
              {'93.20.93.20:443'}
            </a>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:8080">
            <a href="http://93.20.93.20:8080" target="_blank">
              {'93.20.93.20:8080'}
            </a>
          </li>
        </ul>
        <p className="unit-details__property">
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="192.168.0.1:9000-10000/udp">
            <span>
              {'192.168.0.1:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:443">
            <a href="https://192.168.0.1:443" target="_blank">
              {'192.168.0.1:443'}
            </a>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:8080">
            <a href="http://192.168.0.1:8080" target="_blank">
              {'192.168.0.1:8080'}
            </a>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('shows no addresses if no addresses are unavailable', function() {
    fakeUnit = {agent_state: 'started', id: 'unit1'};
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className='unit-details__properties'>
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
        </div>
        <p className='unit-details__property'>
          Public addresses: {'none'}
        </p>
        {undefined}
        <p className='unit-details__property'>
          IP addresses: {'none'}
        </p>
        {undefined}
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('shows only public address if available', function() {
    fakeUnit = {
      public_address: '93.20.93.20',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      agent_state: 'started',
      id: 'unit1'
    };
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className="unit-details__properties">
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
        </div>
        <p className="unit-details__property">
          Public addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="93.20.93.20:9000-10000/udp">
            <span>
              {'93.20.93.20:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:443">
            <span>
              {'93.20.93.20:443'}
            </span>
          </li>
          <li className="unit-details__list-item" key="93.20.93.20:8080">
            <span>
              {'93.20.93.20:8080'}
            </span>
          </li>
        </ul>
        <p className='unit-details__property'>
          IP addresses: {'none'}
        </p>
        {undefined}
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('shows only private address if available', function() {
    fakeUnit = {
      private_address: '192.168.0.1',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      agent_state: 'started',
      id: 'unit1'
    };
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        previousComponent='units'
        service={service}
        unit={fakeUnit}
        unitStatus='error' />);
    const expectedOutput = (
      <div className="unit-details__properties">
        <div>
          <p className='unit-details__property'>
            Status: started
          </p>
        </div>
        <p className='unit-details__property'>
          Public addresses: {'none'}
        </p>
        {undefined}
        <p className="unit-details__property">
          IP addresses: {null}
        </p>
        <ul className="unit-details__list">
          <li className="unit-details__list-item"
            key="192.168.0.1:9000-10000/udp">
            <span>
              {'192.168.0.1:9000-10000/udp'}
            </span>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:443">
            <a href="https://192.168.0.1:443" target="_blank">
              {'192.168.0.1:443'}
            </a>
          </li>
          <li className="unit-details__list-item" key="192.168.0.1:8080">
            <a href="http://192.168.0.1:8080" target="_blank">
              {'192.168.0.1:8080'}
            </a>
          </li>
        </ul>
      </div>);
    expect(output.props.children[0]).toEqualJSX(expectedOutput);
  });

  it('renders the remove button', function() {
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        unit={fakeUnit} />);
    const buttons = [{
      disabled: false,
      title: 'Remove',
      action: output.props.children[1].props.buttons[0].action
    }];
    const expectedOutput = <ButtonRow buttons={buttons} />;
    expect(output.props.children[1]).toEqualJSX(expectedOutput);
  });

  it('can disable remove button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={sinon.stub()}
        destroyUnits={sinon.stub()}
        service={service}
        unit={fakeUnit} />);
    const buttons = [{
      disabled: true,
      title: 'Remove',
      action: output.props.children[1].props.buttons[0].action
    }];
    const expectedOutput = <ButtonRow buttons={buttons} />;
    expect(output.props.children[1]).toEqualJSX(expectedOutput);
  });

  it('destroys the unit when the destroy button is clicked', function() {
    const destroyUnits = sinon.stub();
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        service={service}
        unit={fakeUnit} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [fakeUnit.id]);
  });

  it('navigates to the unit list when the unit is destroyed', function() {
    const destroyUnits = sinon.stub();
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
        service={service}
        unit={fakeUnit}
        unitStatus='pending' />);
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
    const destroyUnits = sinon.stub();
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <UnitDetails
        acl={acl}
        changeState={changeState}
        destroyUnits={destroyUnits}
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
