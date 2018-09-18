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
    const get = sinon.stub();
    get.withArgs('exposed').returns(false);
    get.withArgs('name').returns('django');
    applications = [{get}];
    units = [{
      agentStatus: 'idle',
      displayName: 'django/0',
      id: 'django/id0',
      machine: '1',
      public_address: '1.2.3.4',
      portRanges: [
        {from: 80, to: 80, protocol: 'tcp'},
        {from: 443, to: 443, protocol: 'tcp'}
      ],
      service: 'django',
      workloadStatus: 'installing',
      workloadStatusMessage: 'these are the voyages'
    }, {
      agentStatus: 'executing',
      displayName: 'django/1',
      id: 'django/id1',
      machine: '2',
      public_address: '1.2.3.5',
      portRanges: [
        {from: 80, to: 88, protocol: 'udp'}
      ],
      service: 'django',
      workloadStatus: 'error',
      workloadStatusMessage: 'exterminate!'
    }, {
      agentStatus: 'idle',
      displayName: 'django/42',
      id: 'django/id42',
      machine: '2',
      public_address: '1.2.3.6',
      // Simulate that the unit didn't open ports yet.
      portRanges: [],
      service: 'django',
      workloadStatus: 'installing',
      workloadStatusMessage: ''
    }, {
      // Unplaced units are excluded.
      agentStatus: '',
      displayName: 'django/2',
      id: 'django/id2',
      public_address: '',
      portRanges: [],
      service: 'django',
      workloadStatus: '',
      workloadStatusMessage: ''
    }, {
      // Uncommitted units are excluded.
      agentStatus: '',
      displayName: 'django/3',
      id: 'django/id3',
      machine: 'new42',
      public_address: '',
      portRanges: [],
      service: 'django',
      workloadStatus: '',
      workloadStatusMessage: ''
    }];
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('displays a link for exposed units', () => {
    applications[0].get.withArgs('exposed').returns(true);
    const wrapper = renderComponent();
    assert.equal(
      wrapper.prop('rows')[0].columns[4].content.props.className.includes('status-view__link'),
      true);
  });
});
