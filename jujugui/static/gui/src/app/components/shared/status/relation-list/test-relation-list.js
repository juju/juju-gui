/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StatusRelationList = require('./relation-list');

describe('StatusRelationList', () => {
  let applications, relations;

  const renderComponent = (options = {}) => enzyme.shallow(
    <StatusRelationList
      applications={options.applications || applications}
      changeState={options.changeState || sinon.stub()}
      generateApplicationURL={options.generateApplicationURL || sinon.stub()}
      generatePath={options.generatePath || sinon.stub()}
      onApplicationClick={options.onApplicationClick || sinon.stub()}
      relations={options.relations || relations}
      statusFilter={options.statusFilter} />
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
      },
      'kubernetes-master': {
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
    relations = {
      '1': {
        modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
        key: 'kubernetes-master:etcd etcd:db',
        id: 1,
        endpoints: [{
          applicationName: 'kubernetes-master',
          relation: {
            name: 'etcd',
            role: 'requirer',
            'interface': 'etcd',
            optional: false,
            limit: 1,
            scope: 'global'
          }
        }, {
          applicationName: 'etcd',
          relation: {
            name: 'db',
            role: 'provider',
            'interface': 'etcd',
            optional: false,
            limit: 0,
            scope: 'global'
          }
        }]
      }
    };
  });

  it('renders', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
