/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const changesUtils = require('./changes-utils');

describe('ChangesUtils', () => {
  let cleanups, db, ECS, ecs, models, Y;

  beforeAll(done => {
    let requirements = [
      'changes-utils',
      'environment-change-set',
      'juju-models',
      'node'
    ];
    Y = YUI(GlobalConfig).use(requirements, function(Y) {
      models = Y.namespace('juju.models');
      ECS = Y.namespace('juju').EnvironmentChangeSet;
      done();
    });
  });

  beforeEach(() => {
    cleanups = [];
    db = new models.Database();
    ecs = new ECS({db: db});
  });

  afterEach(() => {
    cleanups.forEach(cleanup => cleanup());
    cleanups = null;
    window.clearTimeout(ecs.descriptionTimer);
    ecs.destroy();
  });

  // Add a service and a unit to the given database.
  const addEntities = db => {
    db.services.add({
      id: 'django', charm: 'cs:trusty/django-1', icon: 'django.svg'});
    db.addUnits({id: 'django/0'});
  };

  describe('getServiceByUnitId', () => {
    it('returns the service', () => {
      addEntities(db);
      const service = changesUtils.getServiceByUnitId('django/0',
        db.services, db.units);
      assert.strictEqual(service.get('id'), 'django');
    });

    it('raises an error if the service is not found', () => {
      assert.throw(() => {
        changesUtils.getServiceByUnitId('no-such/42', db.services, db.units);
      }, 'unit no-such/42 not found');
    });
  });

  it('can convert relation endpoints to their real names', () => {
    let services = new Y.ModelList();
    const args = [
      ['wordpress', {
        name: 'db',
        role: 'server'
      }],
      ['84882221$', {
        name: 'db',
        role: 'client'
      }],
      () => {}
    ];
    services.add([
      {id: 'foobar'},
      {id: '84882221$', displayName: '(mysql)'},
      {id: 'wordpress', displayName: 'wordpress'}
    ]);
    services = changesUtils.getRealRelationEndpointNames(args, services);
    assert.deepEqual(services, ['mysql', 'wordpress']);
  });

  it('can generate descriptions for any change type', () => {
    addEntities(db);
    const tests = [{
      icon: 'django.svg',
      msg: ' cs:trusty/django-1 will be added to the controller.',
      change: {
        command: {
          method: '_addCharm',
          args: ['cs:trusty/django-1', 'cookies are better'],
          options: {applicationId: 'django'}
        }
      }
    }, {
      icon: 'django.svg',
      msg: ' django resources will be added.',
      change: {
        command: {
          method: '_addPendingResources',
          args: [{applicationName: 'django', charmURL: 'cs:trusty/django-1'}]
        }
      }
    }, {
      icon: 'django.svg',
      msg: ' django will be added to the model.',
      change: {
        command: {
          method: '_deploy',
          args: ['cs:trusty/django-1', 'django'],
          options: {modelId: 'django'}
        }
      },
      time: '12:34 PM'
    }, {
      icon: 'changes-units-added',
      msg: ' 1 django unit will be added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['django', 1],
          options: {modelId: 'django/0'}
        }
      }
    }, {
      icon: 'changes-units-removed',
      msg: '1 unit will be removed from foo',
      change: {
        command: {
          method: '_remove_units',
          args: [['foo/0']]
        }
      }
    }, {
      // Note that this case is never used in production code.
      // We always add a single unit to a service.
      icon: 'changes-units-added',
      msg: ' 2 django units will be added.',
      change: {
        command: {
          method: '_add_unit',
          args: ['django', 2],
          options: {modelId: 'django/0'}
        }
      }
    }, {
      icon: 'changes-relation-added',
      msg: 'bar relation will be added between foo and baz.',
      change: {
        command: {
          method: '_add_relation',
          args: [
            ['foo', {name: 'bar'}],
            ['baz']
          ]
        }
      }
    }, {
      icon: 'changes-container-created',
      msg: '1 container will be added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{parentId: 1}]]
        }
      }
    }, {
      icon: 'changes-container-created',
      msg: '2 containers will be added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{parentId: 1}, {parentId: 1}]]
        }
      }
    }, {
      icon: 'changes-machine-created',
      msg: '1 machine will be added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}]]
        }
      }
    }, {
      icon: 'changes-machine-created',
      msg: '2 machines will be added.',
      change: {
        command: {
          method: '_addMachines',
          args: [[{}, {}]]
        }
      }
    }, {
      icon: 'changes-config-changed',
      msg: 'Configuration values will be changed for django.',
      change: {
        command: {
          method: '_set_config',
          args: ['django']
        }
      }
    }, {
      icon: 'changes-unknown',
      msg: 'An unknown change has been made to this model via the CLI.',
      change: {
        command: {
          method: '_anUnknownMethod'
        }
      }
    }];
    // This method needs to be stubbed out for the add relation path.
    const endpointNames = sinon.stub(
      changesUtils, 'getRealRelationEndpointNames').returns(['foo', 'baz']);
    cleanups.push(endpointNames.restore);
    tests.forEach(test => {
      const change = changesUtils.generateChangeDescription(
        db.services, db.units, test.change, true);
      assert.equal(change.icon, test.icon);
      assert.equal(change.description, test.msg);
      if (test.timestamp) {
        assert.equal(change.time, test.time);
      } else {
        assert.equal(change.time, '-');
      }
    });
  });

  it('can generate descriptions for all the changes in the ecs', () => {
    const stubDescription = sinon.stub(
      changesUtils,
      'generateChangeDescription');
    cleanups.push(stubDescription.restore);
    ecs.changeSet = {foo: {index: 0}, bar: {index: 0}};
    changesUtils.generateAllChangeDescriptions(
      db.services, db.units, ecs.changeSet);
    assert.equal(stubDescription.callCount, 2);
  });

  it('can get the counts of each type of ecs change', () => {
    const changeSet = {
      one: {command: {method: 'addMachine'}},
      two: {command: {method: 'addUnit'}},
      three: {command: {method: 'addMachine'}}
    };
    assert.deepEqual(changesUtils.getChangeCounts(changeSet), {
      addMachine: 2,
      addUnit: 1,
      total: 3
    });
  });

  it('can group the ecs change by type', () => {
    const changeSet = {
      one: {command: {method: 'addMachine'}},
      two: {command: {method: 'addUnit'}},
      three: {command: {method: 'addMachine'}}
    };
    assert.deepEqual(changesUtils.getGroupedChanges(changeSet), {
      addUnit: {
        two: {command: {method: 'addUnit'}}
      },
      addMachine: {
        one: {command: {method: 'addMachine'}},
        three: {command: {method: 'addMachine'}}
      }
    });
  });

  it('can filter the changeset by parent', () => {
    const changeSet = {
      one: {parents: ['parent1']},
      two: {parents: ['parent2']},
      three: {parents: ['parent1', 'parent2']}
    };
    assert.deepEqual(changesUtils.filterByParent(changeSet, 'parent1'), {
      one: {parents: ['parent1']},
      three: {parents: ['parent1', 'parent2']}
    });
  });

  describe('sortDescriptionsByApplication', () => {
    const getServiceById = sinon.stub();
    const descriptionsJSON = '[{"id":"addPendingResources-458","icon":"https://api.jujucharms.com/charmstore/v5/~containers/easyrsa-12/icon.svg","description":" easyrsa resources will be added.","time":"8:49 am"},{"id":"service-220","icon":"https://api.jujucharms.com/charmstore/v5/~containers/kubernetes-master-35/icon.svg","description":" kubernetes-master will be added to the model.","time":"8:49 am"},{"id":"expose-102","icon":"exposed_16","description":"kubernetes-master will be exposed","time":"8:49 am"},{"id":"addRelation-83","icon":"changes-relation-added","description":"kube-api-endpoint relation will be added between kubernetes-master and kubernetes-worker.","time":"8:49 am"},{"id":"addUnits-256","icon":"changes-units-added","description":" 1 easyrsa unit will be added.","time":"8:49 am"}]'; // eslint-disable-line max-len

    it('sorts additive descriptions by application', () => {
      const descriptions = JSON.parse(descriptionsJSON);
      const changeSet = {
        'addPendingResources-458': {
          command: {
            method: '_addPendingResources',
            args: [{applicationName: 'easyrsa'}]}},
        'service-220': {
          command: {
            method: '_deploy',
            args: [{applicationName: 'kubernetes-master'}]}},
        'expose-102': {
          command: {
            method: '_expose',
            args: ['kubernetes-master']}},
        'addRelation-83': {
          command: {
            method: '_add_relation',
            args: [['kubernetes-worker'], ['kubernetes-master']]}},
        'addUnits-256': {
          command: {
            method: '_add_unit',
            args: ['easyrsa']}}
      };
      const sorted = changesUtils.sortDescriptionsByApplication(
        getServiceById, changeSet, descriptions);
      const expected = {
        easyrsa: [{
          id: 'addPendingResources-458',
          icon: 'https://api.jujucharms.com/charmstore/v5/~containers/easyrsa-12/icon.svg', // eslint-disable-line max-len
          description: ' easyrsa resources will be added.',
          time: '8:49 am'
        }, {
          id: 'addUnits-256',
          icon: 'changes-units-added',
          description: ' 1 easyrsa unit will be added.',
          time: '8:49 am'
        }],
        'kubernetes-master': [{
          id: 'service-220',
          icon: 'https://api.jujucharms.com/charmstore/v5/~containers/kubernetes-master-35/icon.svg', // eslint-disable-line max-len
          description: ' kubernetes-master will be added to the model.',
          time: '8:49 am'
        }, {
          id: 'expose-102',
          icon: 'exposed_16',
          description: 'kubernetes-master will be exposed',
          time: '8:49 am'
        }, {
          id: 'addRelation-83',
          icon: 'changes-relation-added',
          description: 'kube-api-endpoint relation will be added between kubernetes-master and kubernetes-worker.', // eslint-disable-line max-len
          time: '8:49 am'
        }],
        'kubernetes-worker': [{
          id: 'addRelation-83',
          icon: 'changes-relation-added',
          description: 'kube-api-endpoint relation will be added between kubernetes-master and kubernetes-worker.', //eslint-disable-line max-len
          time: '8:49 am'
        }]
      };
      assert.deepEqual(sorted, expected);
    });

    it('skips methods in the blacklist', () => {
      const descriptions = [
        {id: 'addCharm-123'},
        {id: 'addMachines-123'},
        {id: 'addSSHKeys-123'},
        {id: 'importSSHKeys-123'},
        {id: 'destroyMachines-123'}
      ];
      const changeSet = {};
      const sorted = changesUtils.sortDescriptionsByApplication(
        getServiceById, changeSet, descriptions);
      assert.deepEqual(sorted, {});
    });

    it('does not error for removal commands', () => {
      const descriptions = [
        JSON.parse('{"id":"removeUnit-376","icon":"changes-units-removed","description":"1 unit will be removed from elasticsearch","time":"3:18 pm"}'), // eslint-disable-line max-len
        JSON.parse('{"id":"removeRelation-281","icon":"changes-relation-removed","description":"rest relation will be removed between kibana and elasticsearch.","time":"3:21 pm"}') // eslint-disable-line max-len
      ];

      const changeSet = {
        'removeUnit-376': {
          command: {
            method: '_remove_units',
            args: [['elasticsearch/0']]}},
        'removeRelation-281': {
          command: {
            method: '_remove_relation',
            args: [['kibana'],['elasticsearch']]
          }
        }
      };
      const sorted = changesUtils.sortDescriptionsByApplication(
        getServiceById, changeSet, descriptions);
      const expected = {
        elasticsearch: [{
          id: 'removeUnit-376',
          icon: 'changes-units-removed',
          description: '1 unit will be removed from elasticsearch',
          time: '3:18 pm'
        }, {
          id: 'removeRelation-281',
          icon: 'changes-relation-removed',
          description: 'rest relation will be removed between kibana and elasticsearch.', // eslint-disable-line max-len
          time: '3:21 pm'
        }],
        kibana: [{
          id: 'removeRelation-281',
          icon: 'changes-relation-removed',
          description: 'rest relation will be removed between kibana and elasticsearch.', // eslint-disable-line max-len
          time: '3:21 pm'
        }]
      };
      assert.deepEqual(sorted, expected);
    });
  });
});
