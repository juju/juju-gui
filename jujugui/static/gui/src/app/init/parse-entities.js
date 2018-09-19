/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const parsers = {};

parsers.parseAnnotations = response => {
  // {
  //   'application-kubeapi-load-balancer': {
  //     'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
  //     tag: 'application-kubeapi-load-balancer',
  //     annotations: {
  //       'bundle-url': 'canonical-kubernetes/bundle/254',
  //       'gui-x': '450',
  //       'gui-y': '250'
  //     }
  //   }
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      tag: entity.tag,
      annotations: {
        bundleURL: entity.annotations['bundle-url'],
        guiX: entity.annotations['gui-x'],
        guiY: entity.annotations['gui-y']
      }
    };
  });
  return entities;
},

parsers.parseApplications = response => {
  // {
  //   'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
  //   name: 'easyrsa',
  //   exposed: false,
  //   'charm-url': 'cs:~containers/easyrsa-68',
  //   'owner-tag': '',
  //   life: 'alive',
  //   'min-units': 0,
  //   constraints: {
  //     'root-disk': 8192
  //   },
  //   subordinate: false,
  //   status: {
  //     current: 'waiting',
  //     message: 'waiting for machine',
  //     since: '2018-09-18T12:31:14.500547298Z',
  //     version: ''
  //   },
  //   'workload-version': ''
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      name: entity.name,
      exposed: entity.exposed,
      charmURL: entity['charm-url'],
      ownerTag: entity['owner-tag'],
      life: entity.life,
      minUnits: entity['min-units'],
      // Constraints are user defined so leave the keys as defined.
      constraints: entity.constraints,
      // Config is user defined so leave the keys as defined.
      config: entity.config,
      subordinate: entity.subordinate,
      status: {
        current: entity.status.current,
        message: entity.status.message,
        since: entity.status.since,
        version: entity.status.version
      },
      workloadVersion: entity['workload-version']
    };
  });
  return entities;
};

parsers.parseMachines = response => {
  // {
  //   'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
  //   id: '0',
  //   'instance-id': 'i-06d8e73e06dcddb38',
  //   'agent-status': {
  //     current: 'started',
  //     message: '',
  //     since: '2018-09-18T12:34:11.436151064Z',
  //     version: '2.4.3'
  //   },
  //   'instance-status': {
  //     current: 'running',
  //     message: 'running',
  //     since: '2018-09-18T12:31:37.695183714Z',
  //     version: ''
  //   },
  //   life: 'alive',
  //   series: 'xenial',
  //   'supported-containers': [
  //     'lxd'
  //   ],
  //   'supported-containers-known': true,
  //   'hardware-characteristics': {
  //     arch: 'amd64',
  //     mem: 3840,
  //     'root-disk': 8192,
  //     'cpu-cores': 1,
  //     'cpu-power': 350,
  //     'availability-zone': 'ap-southeast-2a'
  //   },
  //   jobs: [
  //     'JobHostUnits'
  //   ],
  //   addresses: [
  //     {
  //       value: '13.210.238.155',
  //       type: 'ipv4',
  //       scope: 'public'
  //     },
  //     {
  //       value: '172.31.1.216',
  //       type: 'ipv4',
  //       scope: 'local-cloud'
  //     },
  //     {
  //       value: '252.1.216.1',
  //       type: 'ipv4',
  //       scope: 'local-fan'
  //     },
  //     {
  //       value: '127.0.0.1',
  //       type: 'ipv4',
  //       scope: 'local-machine'
  //     },
  //     {
  //       value: '::1',
  //       type: 'ipv6',
  //       scope: 'local-machine'
  //     }
  //   ],
  //   'has-vote': false,
  //   'wants-vote': false
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      id: entity.id,
      instanceID: entity['instance-id'],
      agentStatus: {
        current: entity['agent-status'].current,
        message: entity['agent-status'].message,
        since: entity['agent-status'].since,
        version: entity['agent-status'].version
      },
      instanceStatus: {
        current: entity['instance-status'].current,
        message: entity['instance-status'].message,
        since: entity['instance-status'].since,
        version: entity['instance-status'].version
      },
      life: entity.life,
      series: entity.series,
      supportedContainers: entity['supported-containers'],
      supportedContainersKnown: entity['supported-containers-known'],
      // Hardware characteristics are user defined so leave the keys as defined.
      hardwareCharacteristics: entity['hardware-characteristics'],
      jobs: entity.jobs,
      addresses: entity.addresses.map(address => ({
        value: address.value,
        type: address.type,
        scope: address.scope
      })),
      hasVote: entity['has-vote'],
      wantsVote: entity['wants-vote']
    };
  });
  return entities;
};

parsers.parseRelations = response => {
  // {
  //   'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
  //   key: 'kubernetes-master:etcd etcd:db',
  //   id: 1,
  //   endpoints: [
  //     {
  //       'application-name': 'kubernetes-master',
  //       relation: {
  //         name: 'etcd',
  //         role: 'requirer',
  //         'interface': 'etcd',
  //         optional: false,
  //         limit: 1,
  //         scope: 'global'
  //       }
  //     },
  //     {
  //       'application-name': 'etcd',
  //       relation: {
  //         name: 'db',
  //         role: 'provider',
  //         'interface': 'etcd',
  //         optional: false,
  //         limit: 0,
  //         scope: 'global'
  //       }
  //     }
  //   ]
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      key: entity.key,
      id: entity.id,
      endpoints: entity.endpoints.map(endpoint => ({
        applicationName: endpoint['application-name'],
        relation: {
          name: endpoint.relation.name,
          role: endpoint.relation.role,
          'interface': endpoint.relation.interface,
          optional: endpoint.relation.optional,
          limit: endpoint.relation.limit,
          scope: endpoint.relation.scope
        }
      }))
    };
  });
  return entities;
};

parsers.parseRemoteApplications = response => {
  // {
  //   'model-uuid': 'fe1060e8-0a10-424f-8007-d45c69ca04b5',
  //   name: 'mysql',
  //   'offer-uuid': 'efb9f9b7-65f3-4f6f-86a4-58bebf32c1f4',
  //   'offer-url': 'localhost-localhost:admin/saas.mysql',
  //   life: 'alive',
  //   status: {
  //     current: 'waiting',
  //     message: 'waiting for machine',
  //     since: '2018-09-19T12:30:05.572836696Z',
  //     version: ''
  //   }
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      name: entity.name,
      offerUUID: entity['offer-uuid'],
      offerURL: entity['offer-url'],
      life: entity.life,
      status: {
        current: entity.status.current,
        message: entity.status.message,
        since: entity.status.since,
        version: entity.status.version
      }
    };
  });
  return entities;
};

parsers.parseUnits = response => {
  // {
  //   modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
  //   name: 'etcd/1',
  //   application: 'etcd',
  //   series: 'xenial',
  //   charmURL: 'cs:~containers/etcd-126',
  //   publicAddress: '13.236.7.30',
  //   privateAddress: '172.31.16.206',
  //   machineId: '3',
  //   ports: [
  //     {
  //       protocol: 'tcp',
  //       number: 2379
  //     }
  //   ],
  //   portRanges: [
  //     {
  //       fromPort: 2379,
  //       toPort: 2379,
  //       protocol: 'tcp'
  //     }
  //   ],
  //   subordinate: false,
  //   workloadStatus: {
  //     current: 'active',
  //     message: 'Healthy with 3 known peers',
  //     since: '2018-09-18T12:37:49.29953925Z',
  //     version: ''
  //   },
  //   agentStatus: {
  //     current: 'idle',
  //     message: '',
  //     since: '2018-09-18T12:43:00.589952423Z',
  //     version: '2.4.3'
  //   }
  // }
  let entities = {};
  Object.keys(response).forEach(key => {
    const entity = response[key];
    entities[key] = {
      modelUUID: entity['model-uuid'],
      name: entity.name,
      application: entity.application,
      series: entity.series,
      charmURL: entity['charm-url'],
      publicAddress: entity['public-address'],
      privateAddress: entity['private-address'],
      machineId: entity['machine-id'],
      ports: entity.ports.map(port => ({
        protocol: port.protocol,
        number: port.number
      })),
      portRanges: entity['port-ranges'].map(range => ({
        fromPort: range['from-port'],
        toPort: range['to-port'],
        protocol: range.protocol
      })),
      subordinate: entity.subordinate,
      workloadStatus: {
        current: entity['workload-status'].current,
        message: entity['workload-status'].message,
        since: entity['workload-status'].since,
        version: entity['workload-status'].version
      },
      agentStatus: {
        current: entity['agent-status'].current,
        message: entity['agent-status'].message,
        since: entity['agent-status'].since,
        version: entity['agent-status'].version
      }
    };
  });
  return entities;
};

parsers.parseMegaWatcher = response => {
  return {
    annotations: parsers.parseAnnotations(response.annotations),
    applications: parsers.parseApplications(response.applications),
    machines: parsers.parseMachines(response.machines),
    relations: parsers.parseRelations(response.relations),
    remoteApplications: parsers.parseRemoteApplications(response['remote-applications']),
    units: parsers.parseUnits(response.units)
  };
};

module.exports = parsers;
