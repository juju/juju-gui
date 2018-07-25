/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Link = require('../../link/link');
const SvgIcon = require('../../svg-icon/svg-icon');
const UnitDetails = require('./unit-details');

describe('UnitDetails', function() {
  var acl, unit, service;

  const renderComponent = (options = {}) => enzyme.shallow(
    <UnitDetails
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      destroyUnits={options.destroyUnits || sinon.stub()}
      generatePath={options.generatePath || sinon.stub()}
      previousComponent={options.previousComponent || 'units'}
      service={options.service || service}
      showSSHButtons={options.showSSHButtons}
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
      urlName: 'url-name',
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

  it('can render the statuses', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="unit-details__section twelve-col unit-details__statuses">
        <h5 className="unit-details__title">
          Status
        </h5>
        <ul className="twelve-col unit-details__list">
          <li className="twelve-col unit-details__list-item">
            <div className="four-col prepend-one no-margin-bottom unit-details__label">
              started
            </div>
            <div className="seven-col last-col no-margin-bottom">
              doing stuff
            </div>
          </li>
          <li className="twelve-col unit-details__list-item">
            <div className="four-col prepend-one no-margin-bottom unit-details__label">
              Agent
            </div>
            <div className="seven-col last-col no-margin-bottom">
              idle
            </div>
          </li>
          <li className="twelve-col unit-details__list-item">
            <div className="four-col prepend-one no-margin-bottom unit-details__label">
              Workload
            </div>
            <div className="seven-col last-col no-margin-bottom">
              maintenance
            </div>
          </li>
        </ul>
      </div>);
    assert.compareJSX(wrapper.find('.unit-details__statuses'), expected);
  });

  it('does not render workload status message when not provided', function() {
    unit.workloadStatusMessage = '';
    const wrapper = renderComponent();
    const expected = (
      <li className="twelve-col unit-details__list-item"
        key="uncommitted0">
        <div className="four-col prepend-one no-margin-bottom unit-details__label">
          started
        </div>
        <div className="seven-col last-col no-margin-bottom">
        </div>
      </li>);
    assert.compareJSX(
      wrapper.find('.unit-details__statuses').find('.unit-details__list-item').at(0),
      expected);
  });

  it('does not render agent/workload statuses when not provided', function() {
    unit.agentStatus = '';
    unit.workloadStatus = '';
    unit.workloadStatusMessage = '';
    const wrapper = renderComponent();
    const expected = (
      <ul className="twelve-col unit-details__list">
        <li className="twelve-col unit-details__list-item"
          key="uncommitted0">
          <div className="four-col prepend-one no-margin-bottom unit-details__label">
            started
          </div>
          <div className="seven-col last-col no-margin-bottom">
          </div>
        </li>
      </ul>);
    assert.compareJSX(
      wrapper.find('.unit-details__statuses').find('.unit-details__list'), expected);
  });

  it('does not render statuses if uncommitted', function() {
    unit.agent_state = '';
    const wrapper = renderComponent();
    const expected = (
      <ul className="twelve-col unit-details__list">
        <li className="twelve-col unit-details__list-item"
          key="uncommitted0">
          <div className="four-col prepend-one no-margin-bottom unit-details__label">
            uncommitted
          </div>
          <div className="seven-col last-col no-margin-bottom">
          </div>
        </li>
      </ul>);
    assert.compareJSX(
      wrapper.find('.unit-details__statuses').find('.unit-details__list'), expected);
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
      <ul className="unit-details__action-list">
        <li className="unit-details__action-list-item"
          key="93.20.93.20:9000-10000/udp">
          <span>
            {'93.20.93.20:9000-10000/udp'}
          </span>
        </li>
        <li className="unit-details__action-list-item" key="93.20.93.20:443">
          <span>
            {'93.20.93.20:443'}
          </span>
        </li>
        <li className="unit-details__action-list-item" key="93.20.93.20:8080">
          <span>
            {'93.20.93.20:8080'}
          </span>
        </li>
      </ul>);
    const ipAddresses = (
      <ul className="unit-details__action-list">
        <li className="unit-details__action-list-item"
          key="192.168.0.1:9000-10000/udp">
          <span>
            {'192.168.0.1:9000-10000/udp'}
          </span>
        </li>
        <li className="unit-details__action-list-item" key="192.168.0.1:443">
          <a className="unit-details__address-link"
            href="https://192.168.0.1:443"
            target="_blank">
            {'192.168.0.1:443'}
          </a>
        </li>
        <li className="unit-details__action-list-item" key="192.168.0.1:8080">
          <a className="unit-details__address-link"
            href="http://192.168.0.1:8080"
            target="_blank">
            {'192.168.0.1:8080'}
          </a>
        </li>
      </ul>);
    const lists = wrapper.find('.unit-details__action-list');
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
      <ul className="unit-details__action-list">
        <li className="unit-details__action-list-item"
          key="93.20.93.20:9000-10000/udp">
          <span>
            {'93.20.93.20:9000-10000/udp'}
          </span>
        </li>
        <li className="unit-details__action-list-item" key="93.20.93.20:443">
          <a className="unit-details__address-link"
            href="https://93.20.93.20:443"
            target="_blank">
            {'93.20.93.20:443'}
          </a>
        </li>
        <li className="unit-details__action-list-item" key="93.20.93.20:8080">
          <a className="unit-details__address-link"
            href="http://93.20.93.20:8080"
            target="_blank">
            {'93.20.93.20:8080'}
          </a>
        </li>
      </ul>);
    const ipAddresses = (
      <ul className="unit-details__action-list">
        <li className="unit-details__action-list-item"
          key="192.168.0.1:9000-10000/udp">
          <span>
            {'192.168.0.1:9000-10000/udp'}
          </span>
        </li>
        <li className="unit-details__action-list-item" key="192.168.0.1:443">
          <a className="unit-details__address-link"
            href="https://192.168.0.1:443"
            target="_blank">
            {'192.168.0.1:443'}
          </a>
        </li>
        <li className="unit-details__action-list-item" key="192.168.0.1:8080">
          <a className="unit-details__address-link"
            href="http://192.168.0.1:8080"
            target="_blank">
            {'192.168.0.1:8080'}
          </a>
        </li>
      </ul>);
    const lists = wrapper.find('.unit-details__action-list');
    assert.compareJSX(lists.at(0), publicAddresses);
    assert.compareJSX(lists.at(1), ipAddresses);
  });

  it('shows no addresses if no addresses are unavailable', function() {
    unit = {agent_state: 'started', id: 'unit1'};
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.unit-details__action-list').length, 0);
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
    assert.equal(wrapper.find('.unit-details__action-list').length, 1);
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
    assert.equal(wrapper.find('.unit-details__action-list').length, 1);
  });

  it('can show SSH button if enabled', function() {
    const wrapper = renderComponent({showSSHButtons: true});
    const expected = (
      <div className="unit-details__section twelve-col unit-details__terminal-actions">
        <div className="five-col no-margin-bottom">
          <SvgIcon
            className="machine__ssh-icon"
            name="code-snippet_24"
            size="20" />
        </div>
        <div className="seven-col last-col no-margin-bottom">
          <ul className="unit-details__action-list">
            <li className="unit-details__action-list-item"
              key="SSH to unit">
              <Link
                changeState={sinon.stub()}
                clickState={{
                  terminal: ['juju ssh unit1', 'cd /var/lib/juju/agents/unit-url-name/charm']
                }}
                generatePath={sinon.stub()}>
                SSH to unit
              </Link>
            </li>
          </ul>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.unit-details__terminal-actions'), expected);
  });

  it('can show extra terminal buttons if the unit is in error', function() {
    unit.agent_state = 'error';
    const wrapper = renderComponent({showSSHButtons: true});
    const expected = (
      <ul className="unit-details__action-list">
        <li className="unit-details__action-list-item"
          key="SSH to unit">
          <Link
            changeState={sinon.stub()}
            clickState={{
              terminal: ['juju ssh unit1', 'cd /var/lib/juju/agents/unit-url-name/charm']
            }}
            generatePath={sinon.stub()}>
            SSH to unit
          </Link>
        </li>
        <li className="unit-details__action-list-item"
          key="Tail logs">
          <Link
            changeState={sinon.stub()}
            clickState={{
              terminal: ['juju ssh unit1', 'sudo tail -f /var/log/juju/unit-url-name.log']
            }}
            generatePath={sinon.stub()}>
            Tail logs
          </Link>
        </li>
        <li className="unit-details__action-list-item"
          key="Debug hooks">
          <Link
            changeState={sinon.stub()}
            clickState={{
              terminal: ['juju debug-hooks unit1']
            }}
            generatePath={sinon.stub()}>
            Debug hooks
          </Link>
        </li>
      </ul>);
    assert.compareJSX(
      wrapper.find('.unit-details__terminal-actions').find('.unit-details__action-list'),
      expected);
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
