/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusUnitList = require('./unit-list');

describe('StatusUnitList', () => {
  let applications, units;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusUnitList
      applications={options.applications || applications}
      changeState={options.changeState || sinon.stub()}
      generateMachineURL={options.generateCharmURL || sinon.stub()}
      generatePath={options.generatePath || sinon.stub()}
      generateUnitOnClick={
        options.generateUnitOnClick || sinon.stub().returns(sinon.stub())}
      generateUnitURL={
        options.generateUnitURL || sinon.stub().returns('http://example.com')}
      onMachineClick={options.onCharmClick || sinon.stub()}
      statusFilter={options.statusFilter}
      units={options.units || units} />
  );

  beforeEach(() => {
    applications = {
      etcd: {
        modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
        name: 'etcd',
        exposed: false,
        charmURL: 'cs:~containers/etcd-126',
        ownerTag: '',
        life: 'alive',
        minUnits: 0,
        constraints: {
          'root-disk': 8192
        },
        config: {
          channel: '3.2/stable'
        },
        subordinate: false,
        status: {
          current: 'waiting',
          message: 'waiting for machine',
          since: '2018-09-18T12:31:14.763574172Z',
          version: ''
        },
        workloadVersion: ''
      }
    };
    units = {
      'etcd/0': {
        modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
        name: 'etcd/0',
        application: 'etcd',
        series: 'xenial',
        charmURL: 'cs:~containers/etcd-126',
        publicAddress: '13.211.141.188',
        privateAddress: '172.31.6.46',
        machineID: '2',
        ports: [{
          protocol: 'tcp',
          number: 2379
        }],
        portRanges: [{
          fromPort: 2379,
          toPort: 2379,
          protocol: 'tcp'
        }],
        subordinate: false,
        workloadStatus: {
          current: 'active',
          message: 'Healthy with 3 known peers',
          since: '2018-09-18T12:37:52.738056612Z',
          version: ''
        },
        agentStatus: {
          current: 'idle',
          message: '',
          since: '2018-09-18T12:43:05.056981166Z',
          version: '2.4.3'
        }
      }
    };
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('displays a link for exposed units', () => {
    applications.etcd.exposed = true;
    const wrapper = renderComponent();
    assert.equal(
      wrapper.prop('rows')[0].columns[4].content.props.className.includes('status-view__link'),
      true);
  });
});
