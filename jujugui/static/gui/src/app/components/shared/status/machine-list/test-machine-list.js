/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusMachineList = require('./machine-list');

describe('StatusMachineList', () => {
  let machines;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusMachineList
      generateMachineOnClick={
        options.generateMachineOnClick || sinon.stub().returns(sinon.stub())}
      generateMachineURL={
        options.generateMachineURL || sinon.stub().returns('http://example.com')}
      machines={options.machines || machines}
      statusFilter={options.statusFilter} />
  );

  beforeEach(() => {
    machines = {
      '0': {
        modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
        id: '0',
        instanceID: 'i-06d8e73e06dcddb38',
        agentStatus: {
          current: 'started',
          message: '',
          since: '2018-09-18T12:34:11.436151064Z',
          version: '2.4.3'
        },
        instanceStatus: {
          current: 'running',
          message: 'running',
          since: '2018-09-18T12:31:37.695183714Z',
          version: ''
        },
        life: 'alive',
        series: 'xenial',
        supportedContainers: [
          'lxd'
        ],
        supportedContainersKnown: true,
        hardwareCharacteristics: {
          arch: 'amd64',
          mem: 3840,
          'root-disk': 8192,
          'cpu-cores': 1,
          'cpu-power': 350,
          'availability-zone': 'ap-southeast-2a'
        },
        jobs: [
          'JobHostUnits'
        ],
        addresses: [{
          value: '13.210.238.155',
          type: 'ipv4',
          scope: 'public'
        }],
        hasVote: false,
        wantsVote: false
      }
    };
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
