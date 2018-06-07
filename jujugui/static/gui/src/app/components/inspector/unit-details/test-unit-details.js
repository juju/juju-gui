/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const UnitDetails = require('./unit-details');

describe('UnitDetails', function() {
  var acl, unit, service;

  const renderComponent = (options = {}) => enzyme.shallow(
    <UnitDetails
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      destroyUnits={options.destroyUnits || sinon.stub()}
      previousComponent={options.previousComponent || 'units'}
      service={options.service || service}
      showSSHButtons={options.showSSHButtons || false}
      unit={options.unit || unit}
      unitStatus={
        options.unitStatus === undefined ? 'error' : options.unitStatus} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    unit = {
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
    const wrapper = renderComponent();
    const expected = (
      <div className='unit-details__properties'>
        <div>
          <p className='unit-details__property'>
            Status: {'started - doing stuff'}
          </p>
          <p className="unit-details__property">
            Agent Status: {'idle'}
          </p>
          <p className="unit-details__property">
            Workload Status: {'maintenance'}
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
    assert.compareJSX(wrapper.find('.unit-details__properties'), expected);
  });

  it('does not render workload status message when not provided', function() {
    unit.workloadStatusMessage = '';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.unit-details__property').at(0).text(), 'Status: started');
  });

  it('does not render agent/workload statuses when not provided', function() {
    unit.agentStatus = '';
    unit.workloadStatus = '';
    unit.workloadStatusMessage = '';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.unit-details__property').length, 3);
  });

  it('does not render statuses if uncommitted', function() {
    unit.agent_state = '';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.unit-details__property').length, 3);
  });

  it('shows list of addresses correctly', function() {
    unit = {
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
    const wrapper = renderComponent();
    const publicAddresses = (
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
      </ul>);
    const ipAddresses = (
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
      </ul>);
    const lists = wrapper.find('.unit-details__list');
    assert.compareJSX(lists.at(0), publicAddresses);
    assert.compareJSX(lists.at(1), ipAddresses);
  });

  it('shows list of addresses as links if exposed', function() {
    unit = {
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
    const wrapper = renderComponent();
    const publicAddresses = (
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
      </ul>);
    const ipAddresses = (
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
      </ul>);
    const lists = wrapper.find('.unit-details__list');
    assert.compareJSX(lists.at(0), publicAddresses);
    assert.compareJSX(lists.at(1), ipAddresses);
  });

  it('shows no addresses if no addresses are unavailable', function() {
    unit = {agent_state: 'started', id: 'unit1'};
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-details__list').length, 0);
  });

  it('shows only public address if available', function() {
    unit = {
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
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-details__list').length, 1);
  });

  it('shows only private address if available', function() {
    unit = {
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
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-details__list').length, 1);
  });

  it('can show SSH button if enabled', function() {
    const wrapper = renderComponent({showSSHButtons: true});
    assert.equal(wrapper.find('ButtonRow').prop('buttons').length, 2);
  });

  it('can SSH to a unit', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      showSSHButtons: true
    });
    wrapper.find('ButtonRow').prop('buttons')[0].action()
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      terminal: [
        'juju ssh unit1',
        'cd /var/lib/juju/agents/unit-undefined/charm'
      ]
    });
  });

  it('can disable remove button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
  });

  it('destroys the unit when the destroy button is clicked', function() {
    const destroyUnits = sinon.stub();
    const wrapper = renderComponent({ destroyUnits });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(destroyUnits.callCount, 1);
    assert.deepEqual(destroyUnits.args[0][0], [unit.id]);
  });

  it('navigates to the unit list when the unit is destroyed', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      previousComponent: null
    });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'service1',
          activeComponent: 'units',
          unitStatus: 'error',
          unit: null
        }}});
  });

  it('can navigate to the expose view when the unit is destroyed', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      previousComponent: 'expose',
      unitStatus: null
    });
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'service1',
          activeComponent: 'expose',
          unitStatus: null,
          unit: null
        }}});
  });
});
