/* Copyright (C) 2018 Canonical Ltd. */
'use strict';


const parsers = require('./parsers');

describe('parse entities', () => {
  let parsed, response;

  beforeEach(() => {
    parsed = {
      annotations: {
        'application-kubeapi-load-balancer': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubeapi-load-balancer',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '450',
            guiY: '250'
          }
        }
      },
      applications: {
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
      },
      machines: {
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
      },
      relations: {
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
      },
      remoteApplications: {
        'mysql': {
          modelUUID: 'fe1060e8-0a10-424f-8007-d45c69ca04b5',
          name: 'mysql',
          offerUUID: 'efb9f9b7-65f3-4f6f-86a4-58bebf32c1f4',
          offerURL: 'localhost-localhost:admin/saas.mysql',
          life: 'alive',
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-19T12:30:05.572836696Z',
            version: ''
          }
        }
      },
      units: {
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
      }
    };
    response = {
      annotations: {
        'application-kubeapi-load-balancer': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubeapi-load-balancer',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '450',
            'gui-y': '250'
          }
        }
      },
      applications: {
        etcd: {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd',
          exposed: false,
          'charm-url': 'cs:~containers/etcd-126',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
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
          'workload-version': ''
        }
      },
      machines: {
        '0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '0',
          'instance-id': 'i-06d8e73e06dcddb38',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:11.436151064Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:37.695183714Z',
            version: ''
          },
          life: 'alive',
          series: 'xenial',
          'supported-containers': [
            'lxd'
          ],
          'supported-containers-known': true,
          'hardware-characteristics': {
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
          'has-vote': false,
          'wants-vote': false
        }
      },
      relations: {
        '1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-master:etcd etcd:db',
          id: 1,
          endpoints: [{
            'application-name': 'kubernetes-master',
            relation: {
              name: 'etcd',
              role: 'requirer',
              'interface': 'etcd',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'etcd',
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
      },
      'remote-applications': {
        'mysql': {
          'model-uuid': 'fe1060e8-0a10-424f-8007-d45c69ca04b5',
          name: 'mysql',
          'offer-uuid': 'efb9f9b7-65f3-4f6f-86a4-58bebf32c1f4',
          'offer-url': 'localhost-localhost:admin/saas.mysql',
          life: 'alive',
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-19T12:30:05.572836696Z',
            version: ''
          }
        }
      },
      units: {
        'etcd/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/0',
          application: 'etcd',
          series: 'xenial',
          'charm-url': 'cs:~containers/etcd-126',
          'public-address': '13.211.141.188',
          'private-address': '172.31.6.46',
          'machine-id': '2',
          ports: [{
            protocol: 'tcp',
            number: 2379
          }],
          'port-ranges': [{
            'from-port': 2379,
            'to-port': 2379,
            protocol: 'tcp'
          }],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Healthy with 3 known peers',
            since: '2018-09-18T12:37:52.738056612Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:05.056981166Z',
            version: '2.4.3'
          }
        }
      }
    };
  });

  it('parses annotations', () => {
    assert.deepEqual(parsers.parseAnnotations(response.annotations), parsed.annotations);
  });

  it('parses applications', () => {
    assert.deepEqual(parsers.parseApplications(response.applications), parsed.applications);
  });

  it('parses machines', () => {
    assert.deepEqual(parsers.parseMachines(response.machines), parsed.machines);
  });

  it('parses relations', () => {
    assert.deepEqual(parsers.parseRelations(response.relations), parsed.relations);
  });

  it('parses remote applications', () => {
    assert.deepEqual(
      parsers.parseRemoteApplications(response['remote-applications']),
      parsed.remoteApplications);
  });

  it('parses units', () => {
    assert.deepEqual(parsers.parseUnits(response.units), parsed.units);
  });

  it('parses the megawatcher response', () => {
    assert.deepEqual(parsers.parseMegaWatcher(response), parsed);
  });
});
