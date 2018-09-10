/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusMachineList = require('./machine-list');

describe('StatusMachineList', () => {
  let machines;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusMachineList
      changeState={options.changeState || sinon.stub()}
      generateMachineClickState={
        options.generateMachineClickState || sinon.stub().returns({ app: 'state' })}
      generatePath={options.generatePath || sinon.stub()}
      machines={options.machines || machines}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    machines = [{
      agent_state: 'pending',
      agent_state_info: '',
      displayName: '1',
      id: 'm1',
      instance_id: 'machine-1',
      public_address: '1.2.3.6',
      series: 'zesty'
    }, {
      agent_state: 'started',
      agent_state_info: 'yes, I am started',
      displayName: '2',
      id: 'm2',
      instance_id: 'machine-2',
      public_address: '1.2.3.7',
      series: 'trusty'
    }, {
      // Uncommitted machines are excluded.
      agent_state: '',
      agent_state_info: '',
      displayName: '3',
      id: 'new1',
      instance_id: '',
      public_address: '',
      series: 'trusty'
    }];
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
