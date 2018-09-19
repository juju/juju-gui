/* Copyright (C) 2018 Canonical Ltd. */
'use strict';


const parsers = require('./parse-entities');

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
        },
        'application-flannel': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-flannel',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '450',
            guiY: '750'
          }
        },
        'application-kubernetes-master': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubernetes-master',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '800',
            guiY: '850'
          }
        },
        'application-easyrsa': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-easyrsa',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '450',
            guiY: '550'
          }
        },
        'application-etcd': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-etcd',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '800',
            guiY: '550'
          }
        },
        'application-kubernetes-worker': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubernetes-worker',
          annotations: {
            bundleURL: 'canonical-kubernetes/bundle/254',
            guiX: '100',
            guiY: '850'
          }
        }
      },
      applications: {
        easyrsa: {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'easyrsa',
          exposed: false,
          charmURL: 'cs:~containers/easyrsa-68',
          ownerTag: '',
          life: 'alive',
          minUnits: 0,
          constraints: {
            'root-disk': 8192
          },
          config: undefined,
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-18T12:31:14.500547298Z',
            version: ''
          },
          workloadVersion: ''
        },
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
        flannel: {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel',
          exposed: false,
          charmURL: 'cs:~containers/flannel-81',
          ownerTag: '',
          life: 'alive',
          minUnits: 0,
          constraints: {},
          config: undefined,
          subordinate: true,
          status: {
            current: 'blocked',
            message: 'Waiting for etcd relation.',
            since: '2018-09-18T12:45:40.054341132Z',
            version: ''
          },
          workloadVersion: '0.10.0'
        },
        'kubeapi-load-balancer': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubeapi-load-balancer',
          exposed: true,
          charmURL: 'cs:~containers/kubeapi-load-balancer-88',
          ownerTag: '',
          life: 'alive',
          minUnits: 0,
          constraints: {
            'root-disk': 8192
          },
          config: undefined,
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-18T12:31:13.444275397Z',
            version: ''
          },
          workloadVersion: ''
        },
        'kubernetes-master': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master',
          exposed: false,
          charmURL: 'cs:~containers/kubernetes-master-144',
          ownerTag: '',
          life: 'alive',
          minUnits: 0,
          constraints: {
            cores: 2,
            mem: 4096,
            'root-disk': 16384
          },
          config: {
            channel: '1.11/stable'
          },
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'Waiting for kube-system pods to start',
            since: '2018-09-18T12:45:36.003628204Z',
            version: ''
          },
          workloadVersion: '1.11.3'
        },
        'kubernetes-worker': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker',
          exposed: true,
          charmURL: 'cs:~containers/kubernetes-worker-163',
          ownerTag: '',
          life: 'alive',
          minUnits: 0,
          constraints: {
            cores: 4,
            mem: 4096,
            'root-disk': 16384
          },
          config: {
            channel: '1.11/stable'
          },
          subordinate: false,
          status: {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:50.288886883Z',
            version: ''
          },
          workloadVersion: '1.11.3'
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
          }, {
            value: '172.31.1.216',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.1.216.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '1': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '1',
          instanceID: 'i-0030fbbe2223d0785',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:33.346748897Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:54.02618795Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.210.243.97',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.35.185',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.35.185.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '2': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '2',
          instanceID: 'i-09b6c2f653342e912',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:17.496756951Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:42.082624141Z',
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
            value: '13.211.141.188',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.6.46',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.6.46.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '3': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '3',
          instanceID: 'i-0f7b6d4d76641109d',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:19.411363185Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:54.025352007Z',
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
            'availability-zone': 'ap-southeast-2c'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.236.7.30',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.16.206',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.16.206.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '4': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '4',
          instanceID: 'i-00095d6ca36c1b3cf',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:28.497384109Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:50.040429508Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '54.252.208.34',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.42.148',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.42.148.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '5': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '5',
          instanceID: 'i-009add1df19f97caa',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:40.350046708Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:08.90558827Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '52.63.95.8',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.33.222',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.33.222.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '6': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '6',
          instanceID: 'i-0cd09a43297d0f024',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:27.355232313Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:57.601645829Z',
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
            value: '54.79.38.95',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.0.63',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.0.63.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '7': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '7',
          instanceID: 'i-04c0967163dafcbde',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:45.580155148Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:05.537095429Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.211.54.64',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.46.61',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.46.61.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '8': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '8',
          instanceID: 'i-086b8445c2374c59c',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:56.776052102Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:13.448830887Z',
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
            'availability-zone': 'ap-southeast-2c'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.236.6.16',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.16.207',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.16.207.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          hasVote: false,
          wantsVote: false
        },
        '9': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '9',
          instanceID: 'i-0b1670e0837e7263f',
          agentStatus: {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:47.882130508Z',
            version: '2.4.3'
          },
          instanceStatus: {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:05.537734348Z',
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
            value: '13.211.102.5',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.4.252',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.4.252.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
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
        },
        '2': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:cni kubernetes-worker:cni',
          id: 2,
          endpoints: [{
            applicationName: 'flannel',
            relation: {
              name: 'cni',
              role: 'requirer',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 1,
              scope: 'container'
            }
          }, {
            applicationName: 'kubernetes-worker',
            relation: {
              name: 'cni',
              role: 'provider',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 0,
              scope: 'container'
            }
          }]
        },
        '3': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:kube-api-endpoint kubeapi-load-balancer:website',
          id: 3,
          endpoints: [{
            applicationName: 'kubernetes-worker',
            relation: {
              name: 'kube-api-endpoint',
              role: 'requirer',
              'interface': 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'kubeapi-load-balancer',
            relation: {
              name: 'website',
              role: 'provider',
              'interface': 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '4': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'etcd:certificates easyrsa:client',
          id: 4,
          endpoints: [{
            applicationName: 'etcd',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '5': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:kube-control kubernetes-master:kube-control',
          id: 5,
          endpoints: [{
            applicationName: 'kubernetes-master',
            relation: {
              name: 'kube-control',
              role: 'provider',
              'interface': 'kube-control',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }, {
            applicationName: 'kubernetes-worker',
            relation: {
              name: 'kube-control',
              role: 'requirer',
              'interface': 'kube-control',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }]
        },
        '6': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubeapi-load-balancer:certificates easyrsa:client',
          id: 6,
          endpoints: [{
            applicationName: 'kubeapi-load-balancer',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '7': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-master:loadbalancer kubeapi-load-balancer:loadbalancer',
          id: 7,
          endpoints: [{
            applicationName: 'kubernetes-master',
            relation: {
              name: 'loadbalancer',
              role: 'requirer',
              'interface': 'public-address',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'kubeapi-load-balancer',
            relation: {
              name: 'loadbalancer',
              role: 'provider',
              'interface': 'public-address',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '8': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubeapi-load-balancer:apiserver kubernetes-master:kube-api-endpoint',
          id: 8,
          endpoints: [{
            applicationName: 'kubernetes-master',
            relation: {
              name: 'kube-api-endpoint',
              role: 'provider',
              'interface': 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }, {
            applicationName: 'kubeapi-load-balancer',
            relation: {
              name: 'apiserver',
              role: 'requirer',
              'interface': 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }]
        },
        '9': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:etcd etcd:db',
          id: 9,
          endpoints: [{
            applicationName: 'flannel',
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
        },
        '10': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:certificates easyrsa:client',
          id: 10,
          endpoints: [{
            applicationName: 'kubernetes-worker',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '11': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-master:certificates easyrsa:client',
          id: 11,
          endpoints: [{
            applicationName: 'kubernetes-master',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            applicationName: 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '12': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:cni kubernetes-master:cni',
          id: 12,
          endpoints: [{
            applicationName: 'flannel',
            relation: {
              name: 'cni',
              role: 'requirer',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 1,
              scope: 'container'
            }
          }, {
            applicationName: 'kubernetes-master',
            relation: {
              name: 'cni',
              role: 'provider',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 0,
              scope: 'container'
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
        'easyrsa/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'easyrsa/0',
          application: 'easyrsa',
          series: 'xenial',
          charmURL: 'cs:~containers/easyrsa-68',
          publicAddress: '54.252.208.34',
          privateAddress: '172.31.42.148',
          machineId: '4',
          ports: [],
          portRanges: [],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Certificate Authority connected.',
            since: '2018-09-18T12:36:40.864545172Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:55.49042857Z',
            version: '2.4.3'
          }
        },
        'etcd/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/0',
          application: 'etcd',
          series: 'xenial',
          charmURL: 'cs:~containers/etcd-126',
          publicAddress: '13.211.141.188',
          privateAddress: '172.31.6.46',
          machineId: '2',
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
        },
        'etcd/1': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/1',
          application: 'etcd',
          series: 'xenial',
          charmURL: 'cs:~containers/etcd-126',
          publicAddress: '13.236.7.30',
          privateAddress: '172.31.16.206',
          machineId: '3',
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
            since: '2018-09-18T12:37:49.29953925Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:00.589952423Z',
            version: '2.4.3'
          }
        },
        'etcd/2': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/2',
          application: 'etcd',
          series: 'xenial',
          charmURL: 'cs:~containers/etcd-126',
          publicAddress: '13.210.243.97',
          privateAddress: '172.31.35.185',
          machineId: '1',
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
            since: '2018-09-18T12:37:56.649171629Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:01.144625989Z',
            version: '2.4.3'
          }
        },
        'flannel/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/0',
          application: 'flannel',
          series: 'xenial',
          charmURL: 'cs:~containers/flannel-81',
          publicAddress: '52.63.95.8',
          privateAddress: '172.31.33.222',
          machineId: '',
          ports: [],
          portRanges: [],
          subordinate: true,
          workloadStatus: {
            current: 'blocked',
            message: 'Waiting for etcd relation.',
            since: '2018-09-18T12:45:40.054341132Z',
            version: ''
          },
          agentStatus: {
            current: 'executing',
            message: 'running config-changed hook',
            since: '2018-09-18T12:46:32.490781358Z',
            version: ''
          }
        },
        'flannel/1': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/1',
          application: 'flannel',
          series: 'xenial',
          charmURL: 'cs:~containers/flannel-81',
          publicAddress: '13.211.102.5',
          privateAddress: '172.31.4.252',
          machineId: '',
          ports: [],
          portRanges: [],
          subordinate: true,
          workloadStatus: {
            current: 'active',
            message: 'Flannel subnet 10.1.11.1/24',
            since: '2018-09-18T12:46:10.93245495Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:46:11.944951338Z',
            version: ''
          }
        },
        'flannel/2': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/2',
          application: 'flannel',
          series: 'xenial',
          charmURL: 'cs:~containers/flannel-81',
          publicAddress: '54.79.38.95',
          privateAddress: '172.31.0.63',
          machineId: '',
          ports: [],
          portRanges: [],
          subordinate: true,
          workloadStatus: {
            current: 'active',
            message: 'Flannel subnet 10.1.20.1/24',
            since: '2018-09-18T12:43:14.533738456Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:35.50164289Z',
            version: '2.4.3'
          }
        },
        'flannel/3': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/3',
          application: 'flannel',
          series: 'xenial',
          charmURL: 'cs:~containers/flannel-81',
          publicAddress: '13.211.54.64',
          privateAddress: '172.31.46.61',
          machineId: '',
          ports: [],
          portRanges: [],
          subordinate: true,
          workloadStatus: {
            current: 'active',
            message: 'Flannel subnet 10.1.4.1/24',
            since: '2018-09-18T12:43:30.733919413Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:32.155115905Z',
            version: '2.4.3'
          }
        },
        'flannel/4': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/4',
          application: 'flannel',
          series: 'xenial',
          charmURL: 'cs:~containers/flannel-81',
          publicAddress: '13.236.6.16',
          privateAddress: '172.31.16.207',
          machineId: '',
          ports: [],
          portRanges: [],
          subordinate: true,
          workloadStatus: {
            current: 'active',
            message: 'Flannel subnet 10.1.73.1/24',
            since: '2018-09-18T12:42:31.328799215Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:12.832040195Z',
            version: '2.4.3'
          }
        },
        'kubeapi-load-balancer/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubeapi-load-balancer/0',
          application: 'kubeapi-load-balancer',
          series: 'xenial',
          charmURL: 'cs:~containers/kubeapi-load-balancer-88',
          publicAddress: '13.210.238.155',
          privateAddress: '172.31.1.216',
          machineId: '0',
          ports: [{
            protocol: 'tcp',
            number: 443
          }],
          portRanges: [{
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp'
          }],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Loadbalancer ready.',
            since: '2018-09-18T12:44:56.906898265Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:55.499167305Z',
            version: '2.4.3'
          }
        },
        'kubernetes-master/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master/0',
          application: 'kubernetes-master',
          series: 'xenial',
          charmURL: 'cs:~containers/kubernetes-master-144',
          publicAddress: '52.63.95.8',
          privateAddress: '172.31.33.222',
          machineId: '5',
          ports: [{
            protocol: 'tcp',
            number: 6443
          }, {
            protocol: 'tcp',
            number: 6443
          }, {
            protocol: 'tcp',
            number: 6443
          }],
          portRanges: [{
            fromPort: 6443,
            toPort: 6443,
            protocol: 'tcp'
          }, {
            fromPort: 6443,
            toPort: 6443,
            protocol: 'tcp'
          }, {
            fromPort: 6443,
            toPort: 6443,
            protocol: 'tcp'
          }],
          subordinate: false,
          workloadStatus: {
            current: 'waiting',
            message: 'Waiting for kube-system pods to start',
            since: '2018-09-18T12:45:36.003628204Z',
            version: ''
          },
          agentStatus: {
            current: 'executing',
            message: 'running certificates-relation-changed hook',
            since: '2018-09-18T12:46:35.82151917Z',
            version: ''
          }
        },
        'kubernetes-master/1': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master/1',
          application: 'kubernetes-master',
          series: 'xenial',
          charmURL: 'cs:~containers/kubernetes-master-144',
          publicAddress: '13.211.102.5',
          privateAddress: '172.31.4.252',
          machineId: '9',
          ports: [],
          portRanges: [],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Kubernetes master running.',
            since: '2018-09-18T12:44:02.754694212Z',
            version: ''
          },
          agentStatus: {
            current: 'executing',
            message: 'running etcd-relation-changed hook',
            since: '2018-09-18T12:46:47.34900945Z',
            version: ''
          }
        },
        'kubernetes-worker/0': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/0',
          application: 'kubernetes-worker',
          series: 'xenial',
          charmURL: 'cs:~containers/kubernetes-worker-163',
          publicAddress: '54.79.38.95',
          privateAddress: '172.31.0.63',
          machineId: '6',
          ports: [],
          portRanges: [],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:50.288886883Z',
            version: ''
          },
          agentStatus: {
            current: 'executing',
            message: 'running kube-control-relation-changed hook',
            since: '2018-09-18T12:46:32.527342314Z',
            version: ''
          }
        },
        'kubernetes-worker/1': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/1',
          application: 'kubernetes-worker',
          series: 'xenial',
          charmURL: 'cs:~containers/kubernetes-worker-163',
          publicAddress: '13.211.54.64',
          privateAddress: '172.31.46.61',
          machineId: '7',
          ports: [],
          portRanges: [],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:53.253717724Z',
            version: ''
          },
          agentStatus: {
            current: 'executing',
            message: 'running kube-control-relation-changed hook',
            since: '2018-09-18T12:46:32.730449759Z',
            version: ''
          }
        },
        'kubernetes-worker/2': {
          modelUUID: '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/2',
          application: 'kubernetes-worker',
          series: 'xenial',
          charmURL: 'cs:~containers/kubernetes-worker-163',
          publicAddress: '13.236.6.16',
          privateAddress: '172.31.16.207',
          machineId: '8',
          ports: [{
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 443
          }, {
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 443
          }],
          portRanges: [{
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp'
          }, {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp'
          }, {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp'
          }, {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp'
          }, {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp'
          }],
          subordinate: false,
          workloadStatus: {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:51.072672087Z',
            version: ''
          },
          agentStatus: {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:46:58.222614399Z',
            version: ''
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
        },
        'application-flannel': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-flannel',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '450',
            'gui-y': '750'
          }
        },
        'application-kubernetes-master': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubernetes-master',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '800',
            'gui-y': '850'
          }
        },
        'application-easyrsa': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-easyrsa',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '450',
            'gui-y': '550'
          }
        },
        'application-etcd': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-etcd',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '800',
            'gui-y': '550'
          }
        },
        'application-kubernetes-worker': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          tag: 'application-kubernetes-worker',
          annotations: {
            'bundle-url': 'canonical-kubernetes/bundle/254',
            'gui-x': '100',
            'gui-y': '850'
          }
        }
      },
      applications: {
        easyrsa: {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'easyrsa',
          exposed: false,
          'charm-url': 'cs:~containers/easyrsa-68',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
          constraints: {
            'root-disk': 8192
          },
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-18T12:31:14.500547298Z',
            version: ''
          },
          'workload-version': ''
        },
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
        },
        flannel: {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel',
          exposed: false,
          'charm-url': 'cs:~containers/flannel-81',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
          constraints: {},
          subordinate: true,
          status: {
            current: 'blocked',
            message: 'Waiting for etcd relation.',
            since: '2018-09-18T12:45:40.054341132Z',
            version: ''
          },
          'workload-version': '0.10.0'
        },
        'kubeapi-load-balancer': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubeapi-load-balancer',
          exposed: true,
          'charm-url': 'cs:~containers/kubeapi-load-balancer-88',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
          constraints: {
            'root-disk': 8192
          },
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'waiting for machine',
            since: '2018-09-18T12:31:13.444275397Z',
            version: ''
          },
          'workload-version': ''
        },
        'kubernetes-master': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master',
          exposed: false,
          'charm-url': 'cs:~containers/kubernetes-master-144',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
          constraints: {
            cores: 2,
            mem: 4096,
            'root-disk': 16384
          },
          config: {
            channel: '1.11/stable'
          },
          subordinate: false,
          status: {
            current: 'waiting',
            message: 'Waiting for kube-system pods to start',
            since: '2018-09-18T12:45:36.003628204Z',
            version: ''
          },
          'workload-version': '1.11.3'
        },
        'kubernetes-worker': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker',
          exposed: true,
          'charm-url': 'cs:~containers/kubernetes-worker-163',
          'owner-tag': '',
          life: 'alive',
          'min-units': 0,
          constraints: {
            cores: 4,
            mem: 4096,
            'root-disk': 16384
          },
          config: {
            channel: '1.11/stable'
          },
          subordinate: false,
          status: {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:50.288886883Z',
            version: ''
          },
          'workload-version': '1.11.3'
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
          }, {
            value: '172.31.1.216',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.1.216.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '1',
          'instance-id': 'i-0030fbbe2223d0785',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:33.346748897Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:54.02618795Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.210.243.97',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.35.185',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.35.185.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '2': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '2',
          'instance-id': 'i-09b6c2f653342e912',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:17.496756951Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:42.082624141Z',
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
            value: '13.211.141.188',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.6.46',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.6.46.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '3': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '3',
          'instance-id': 'i-0f7b6d4d76641109d',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:19.411363185Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:54.025352007Z',
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
            'availability-zone': 'ap-southeast-2c'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.236.7.30',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.16.206',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.16.206.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '4': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '4',
          'instance-id': 'i-00095d6ca36c1b3cf',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:28.497384109Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:50.040429508Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '54.252.208.34',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.42.148',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.42.148.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '5': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '5',
          'instance-id': 'i-009add1df19f97caa',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:40.350046708Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:08.90558827Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '52.63.95.8',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.33.222',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.33.222.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '6': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '6',
          'instance-id': 'i-0cd09a43297d0f024',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:27.355232313Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:31:57.601645829Z',
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
            value: '54.79.38.95',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.0.63',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.0.63.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '7': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '7',
          'instance-id': 'i-04c0967163dafcbde',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:45.580155148Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:05.537095429Z',
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
            'availability-zone': 'ap-southeast-2b'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.211.54.64',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.46.61',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.46.61.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '8': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '8',
          'instance-id': 'i-086b8445c2374c59c',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:56.776052102Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:13.448830887Z',
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
            'availability-zone': 'ap-southeast-2c'
          },
          jobs: [
            'JobHostUnits'
          ],
          addresses: [{
            value: '13.236.6.16',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.16.207',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.16.207.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
          }],
          'has-vote': false,
          'wants-vote': false
        },
        '9': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          id: '9',
          'instance-id': 'i-0b1670e0837e7263f',
          'agent-status': {
            current: 'started',
            message: '',
            since: '2018-09-18T12:34:47.882130508Z',
            version: '2.4.3'
          },
          'instance-status': {
            current: 'running',
            message: 'running',
            since: '2018-09-18T12:32:05.537734348Z',
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
            value: '13.211.102.5',
            type: 'ipv4',
            scope: 'public'
          }, {
            value: '172.31.4.252',
            type: 'ipv4',
            scope: 'local-cloud'
          }, {
            value: '252.4.252.1',
            type: 'ipv4',
            scope: 'local-fan'
          }, {
            value: '127.0.0.1',
            type: 'ipv4',
            scope: 'local-machine'
          }, {
            value: '::1',
            type: 'ipv6',
            scope: 'local-machine'
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
        },
        '2': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:cni kubernetes-worker:cni',
          id: 2,
          endpoints: [{
            'application-name': 'flannel',
            relation: {
              name: 'cni',
              role: 'requirer',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 1,
              scope: 'container'
            }
          }, {
            'application-name': 'kubernetes-worker',
            relation: {
              name: 'cni',
              role: 'provider',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 0,
              scope: 'container'
            }
          }]
        },
        '3': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:kube-api-endpoint kubeapi-load-balancer:website',
          id: 3,
          endpoints: [{
            'application-name': 'kubernetes-worker',
            relation: {
              name: 'kube-api-endpoint',
              role: 'requirer',
              'interface': 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'kubeapi-load-balancer',
            relation: {
              name: 'website',
              role: 'provider',
              'interface': 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '4': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'etcd:certificates easyrsa:client',
          id: 4,
          endpoints: [{
            'application-name': 'etcd',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '5': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:kube-control kubernetes-master:kube-control',
          id: 5,
          endpoints: [{
            'application-name': 'kubernetes-master',
            relation: {
              name: 'kube-control',
              role: 'provider',
              'interface': 'kube-control',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }, {
            'application-name': 'kubernetes-worker',
            relation: {
              name: 'kube-control',
              role: 'requirer',
              'interface': 'kube-control',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }]
        },
        '6': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubeapi-load-balancer:certificates easyrsa:client',
          id: 6,
          endpoints: [{
            'application-name': 'kubeapi-load-balancer',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '7': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-master:loadbalancer kubeapi-load-balancer:loadbalancer',
          id: 7,
          endpoints: [{
            'application-name': 'kubernetes-master',
            relation: {
              name: 'loadbalancer',
              role: 'requirer',
              'interface': 'public-address',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'kubeapi-load-balancer',
            relation: {
              name: 'loadbalancer',
              role: 'provider',
              'interface': 'public-address',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '8': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubeapi-load-balancer:apiserver kubernetes-master:kube-api-endpoint',
          id: 8,
          endpoints: [{
            'application-name': 'kubernetes-master',
            relation: {
              name: 'kube-api-endpoint',
              role: 'provider',
              'interface': 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }, {
            'application-name': 'kubeapi-load-balancer',
            relation: {
              name: 'apiserver',
              role: 'requirer',
              'interface': 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }]
        },
        '9': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:etcd etcd:db',
          id: 9,
          endpoints: [{
            'application-name': 'flannel',
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
        },
        '10': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-worker:certificates easyrsa:client',
          id: 10,
          endpoints: [{
            'application-name': 'kubernetes-worker',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '11': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'kubernetes-master:certificates easyrsa:client',
          id: 11,
          endpoints: [{
            'application-name': 'kubernetes-master',
            relation: {
              name: 'certificates',
              role: 'requirer',
              'interface': 'tls-certificates',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'easyrsa',
            relation: {
              name: 'client',
              role: 'provider',
              'interface': 'tls-certificates',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }]
        },
        '12': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          key: 'flannel:cni kubernetes-master:cni',
          id: 12,
          endpoints: [{
            'application-name': 'flannel',
            relation: {
              name: 'cni',
              role: 'requirer',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 1,
              scope: 'container'
            }
          }, {
            'application-name': 'kubernetes-master',
            relation: {
              name: 'cni',
              role: 'provider',
              'interface': 'kubernetes-cni',
              optional: false,
              limit: 0,
              scope: 'container'
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
        'easyrsa/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'easyrsa/0',
          application: 'easyrsa',
          series: 'xenial',
          'charm-url': 'cs:~containers/easyrsa-68',
          'public-address': '54.252.208.34',
          'private-address': '172.31.42.148',
          'machine-id': '4',
          ports: [],
          'port-ranges': [],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Certificate Authority connected.',
            since: '2018-09-18T12:36:40.864545172Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:55.49042857Z',
            version: '2.4.3'
          }
        },
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
        },
        'etcd/1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/1',
          application: 'etcd',
          series: 'xenial',
          'charm-url': 'cs:~containers/etcd-126',
          'public-address': '13.236.7.30',
          'private-address': '172.31.16.206',
          'machine-id': '3',
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
            since: '2018-09-18T12:37:49.29953925Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:00.589952423Z',
            version: '2.4.3'
          }
        },
        'etcd/2': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'etcd/2',
          application: 'etcd',
          series: 'xenial',
          'charm-url': 'cs:~containers/etcd-126',
          'public-address': '13.210.243.97',
          'private-address': '172.31.35.185',
          'machine-id': '1',
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
            since: '2018-09-18T12:37:56.649171629Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:01.144625989Z',
            version: '2.4.3'
          }
        },
        'flannel/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/0',
          application: 'flannel',
          series: 'xenial',
          'charm-url': 'cs:~containers/flannel-81',
          'public-address': '52.63.95.8',
          'private-address': '172.31.33.222',
          'machine-id': '',
          ports: [],
          'port-ranges': [],
          subordinate: true,
          'workload-status': {
            current: 'blocked',
            message: 'Waiting for etcd relation.',
            since: '2018-09-18T12:45:40.054341132Z',
            version: ''
          },
          'agent-status': {
            current: 'executing',
            message: 'running config-changed hook',
            since: '2018-09-18T12:46:32.490781358Z',
            version: ''
          }
        },
        'flannel/1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/1',
          application: 'flannel',
          series: 'xenial',
          'charm-url': 'cs:~containers/flannel-81',
          'public-address': '13.211.102.5',
          'private-address': '172.31.4.252',
          'machine-id': '',
          ports: [],
          'port-ranges': [],
          subordinate: true,
          'workload-status': {
            current: 'active',
            message: 'Flannel subnet 10.1.11.1/24',
            since: '2018-09-18T12:46:10.93245495Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:46:11.944951338Z',
            version: ''
          }
        },
        'flannel/2': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/2',
          application: 'flannel',
          series: 'xenial',
          'charm-url': 'cs:~containers/flannel-81',
          'public-address': '54.79.38.95',
          'private-address': '172.31.0.63',
          'machine-id': '',
          ports: [],
          'port-ranges': [],
          subordinate: true,
          'workload-status': {
            current: 'active',
            message: 'Flannel subnet 10.1.20.1/24',
            since: '2018-09-18T12:43:14.533738456Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:35.50164289Z',
            version: '2.4.3'
          }
        },
        'flannel/3': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/3',
          application: 'flannel',
          series: 'xenial',
          'charm-url': 'cs:~containers/flannel-81',
          'public-address': '13.211.54.64',
          'private-address': '172.31.46.61',
          'machine-id': '',
          ports: [],
          'port-ranges': [],
          subordinate: true,
          'workload-status': {
            current: 'active',
            message: 'Flannel subnet 10.1.4.1/24',
            since: '2018-09-18T12:43:30.733919413Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:32.155115905Z',
            version: '2.4.3'
          }
        },
        'flannel/4': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'flannel/4',
          application: 'flannel',
          series: 'xenial',
          'charm-url': 'cs:~containers/flannel-81',
          'public-address': '13.236.6.16',
          'private-address': '172.31.16.207',
          'machine-id': '',
          ports: [],
          'port-ranges': [],
          subordinate: true,
          'workload-status': {
            current: 'active',
            message: 'Flannel subnet 10.1.73.1/24',
            since: '2018-09-18T12:42:31.328799215Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:12.832040195Z',
            version: '2.4.3'
          }
        },
        'kubeapi-load-balancer/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubeapi-load-balancer/0',
          application: 'kubeapi-load-balancer',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubeapi-load-balancer-88',
          'public-address': '13.210.238.155',
          'private-address': '172.31.1.216',
          'machine-id': '0',
          ports: [{
            protocol: 'tcp',
            number: 443
          }],
          'port-ranges': [{
            'from-port': 443,
            'to-port': 443,
            protocol: 'tcp'
          }],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Loadbalancer ready.',
            since: '2018-09-18T12:44:56.906898265Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:43:55.499167305Z',
            version: '2.4.3'
          }
        },
        'kubernetes-master/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master/0',
          application: 'kubernetes-master',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubernetes-master-144',
          'public-address': '52.63.95.8',
          'private-address': '172.31.33.222',
          'machine-id': '5',
          ports: [{
            protocol: 'tcp',
            number: 6443
          }, {
            protocol: 'tcp',
            number: 6443
          }, {
            protocol: 'tcp',
            number: 6443
          }],
          'port-ranges': [{
            'from-port': 6443,
            'to-port': 6443,
            protocol: 'tcp'
          }, {
            'from-port': 6443,
            'to-port': 6443,
            protocol: 'tcp'
          }, {
            'from-port': 6443,
            'to-port': 6443,
            protocol: 'tcp'
          }],
          subordinate: false,
          'workload-status': {
            current: 'waiting',
            message: 'Waiting for kube-system pods to start',
            since: '2018-09-18T12:45:36.003628204Z',
            version: ''
          },
          'agent-status': {
            current: 'executing',
            message: 'running certificates-relation-changed hook',
            since: '2018-09-18T12:46:35.82151917Z',
            version: ''
          }
        },
        'kubernetes-master/1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-master/1',
          application: 'kubernetes-master',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubernetes-master-144',
          'public-address': '13.211.102.5',
          'private-address': '172.31.4.252',
          'machine-id': '9',
          ports: [],
          'port-ranges': [],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Kubernetes master running.',
            since: '2018-09-18T12:44:02.754694212Z',
            version: ''
          },
          'agent-status': {
            current: 'executing',
            message: 'running etcd-relation-changed hook',
            since: '2018-09-18T12:46:47.34900945Z',
            version: ''
          }
        },
        'kubernetes-worker/0': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/0',
          application: 'kubernetes-worker',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubernetes-worker-163',
          'public-address': '54.79.38.95',
          'private-address': '172.31.0.63',
          'machine-id': '6',
          ports: [],
          'port-ranges': [],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:50.288886883Z',
            version: ''
          },
          'agent-status': {
            current: 'executing',
            message: 'running kube-control-relation-changed hook',
            since: '2018-09-18T12:46:32.527342314Z',
            version: ''
          }
        },
        'kubernetes-worker/1': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/1',
          application: 'kubernetes-worker',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubernetes-worker-163',
          'public-address': '13.211.54.64',
          'private-address': '172.31.46.61',
          'machine-id': '7',
          ports: [],
          'port-ranges': [],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:53.253717724Z',
            version: ''
          },
          'agent-status': {
            current: 'executing',
            message: 'running kube-control-relation-changed hook',
            since: '2018-09-18T12:46:32.730449759Z',
            version: ''
          }
        },
        'kubernetes-worker/2': {
          'model-uuid': '32c9c2db-0955-459a-8201-539657ef0da1',
          name: 'kubernetes-worker/2',
          application: 'kubernetes-worker',
          series: 'xenial',
          'charm-url': 'cs:~containers/kubernetes-worker-163',
          'public-address': '13.236.6.16',
          'private-address': '172.31.16.207',
          'machine-id': '8',
          ports: [{
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 443
          }, {
            protocol: 'tcp',
            number: 80
          }, {
            protocol: 'tcp',
            number: 443
          }],
          'port-ranges': [{
            'from-port': 80,
            'to-port': 80,
            protocol: 'tcp'
          }, {
            'from-port': 80,
            'to-port': 80,
            protocol: 'tcp'
          }, {
            'from-port': 443,
            'to-port': 443,
            protocol: 'tcp'
          }, {
            'from-port': 80,
            'to-port': 80,
            protocol: 'tcp'
          }, {
            'from-port': 443,
            'to-port': 443,
            protocol: 'tcp'
          }],
          subordinate: false,
          'workload-status': {
            current: 'active',
            message: 'Kubernetes worker running.',
            since: '2018-09-18T12:46:51.072672087Z',
            version: ''
          },
          'agent-status': {
            current: 'idle',
            message: '',
            since: '2018-09-18T12:46:58.222614399Z',
            version: ''
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
});
