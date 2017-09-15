/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const relationUtils = require('./relation-utils');

describe('RelationUtils', () => {
  let models;

  beforeAll(done => {
    YUI(GlobalConfig).use('juju-models', function(Y) {
      models = Y.namespace('juju.models');
      done();
    });
  });

  describe('generateSafeDOMId', () => {
    it('can generate a hash', () => {
      // We aren't testing the algorithm here, just basic hash characteristics.
      // It's a number.
      assert.strictEqual(relationUtils.generateHash(''), 0);
      assert.isNumber(relationUtils.generateHash('kumquat'));
      assert.isNumber(relationUtils.generateHash('qumquat'));
      // It's stable.
      assert.strictEqual(
        relationUtils.generateHash('kumquat'),
        relationUtils.generateHash('kumquat'));
      // Different values hash differently.
      assert.notEqual(
        relationUtils.generateHash('kumquat'),
        relationUtils.generateHash('qumquat'));
    });

    it('can generate safe relation ids', () => {
      const relationId = 'foo:Bar relation-00000006!@#';
      assert.strictEqual(
        relationUtils.generateSafeDOMId(relationId),
        'e-foo_Bar_relation_00000006___-' +
          relationUtils.generateHash(relationId));
    });

    it('can generate safe relation ids with a parent id', () => {
      const relationId = 'foo:Bar relation-00000006!@#';
      assert.notEqual(
        relationUtils.generateSafeDOMId(relationId, 'topo1'),
        relationUtils.generateSafeDOMId(relationId, 'topo2'));
      assert.strictEqual(
        relationUtils.generateSafeDOMId(relationId, 'topo1'),
        'e-foo_Bar_relation_00000006___-' +
          relationUtils.generateHash(relationId + 'topo1'));
    });
  });

  describe('Utilities for handling relations', () => {
    let endpoints;

    beforeEach(() => {
      const MockCharm = function(attrs) {
        const _attrs = attrs;
        return {
          set: function(key, value) {
            _attrs[key] = value;
          },
          get: function(key) {
            return _attrs[key];
          }
        };
      };
      const wordpressProvides = {
        website: {
          'interface': 'http',
          scope: 'global'
        }
      };
      const wordpressRequires = {
        cache: {
          'interface': 'memcache',
          scope: 'global'
        },
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        nfs: {
          'interface': 'mount',
          scope: 'global'
        }
      };
      const mysqlProvides = {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'db-admin': {
          'interface': 'mysql-root',
          scope: 'global'
        },
        'local-monitors': {
          'interface': 'local-monitors',
          scope: 'container'
        },
        master: {
          'interface': 'mysql-oneway-replication',
          scope: 'global'
        },
        monitors: {
          'interface': 'monitors',
          scope: 'global'
        },
        munin: {
          'interface': 'munin-node',
          scope: 'global'
        },
        'shared-db': {
          'interface': 'mysql-shared',
          scope: 'global'
        }
      };
      const mysqlRequires = {
        ceph: {
          'interface': 'ceph-client',
          scope: 'global'
        },
        ha: {
          'interface': 'hacluster',
          scope: 'global'
        },
        slave: {
          'interface': 'mysql-oneway-replication',
          scope: 'global'
        }
      };
      endpoints = [
        {
          charm: MockCharm({
            provides: wordpressProvides,
            requires: wordpressRequires
          }),
          name: 'wordpress',
          service: {},
          type: 'db'
        },
        {
          charm: MockCharm({
            provides: mysqlProvides,
            requires: mysqlRequires
          }),
          name: 'mysql',
          service: {},
          type: 'db'
        }
      ];
    });

    it('finds endpoint matches for relations', () => {
      const actual = relationUtils.findEndpointMatch(endpoints);
      const expected = {
        'interface': 'mysql',
        scope: 'global',
        provides: endpoints[1],
        requires: endpoints[0],
        provideType: 'db',
        requireType: 'db'
      };
      assert.deepEqual(actual, expected);
    });

    it('errors when no endpoint matches exist', () => {
      endpoints[1].charm.set('provides', {});
      const actual = relationUtils.findEndpointMatch(endpoints);
      assert.equal(actual.error, 'Specified relation is unavailable.');
    });

    it('errors when multiple explicit endpoint matches exist', () => {
      // In order to force an ambiguous relation, we need to null these out.
      endpoints[0].type = null;
      endpoints[1].type = null;
      endpoints[0].charm.set('requires', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'db-admin': {
          'interface': 'mysql',
          scope: 'global'
        }
      });
      endpoints[1].charm.set('provides', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'db-admin': {
          'interface': 'mysql',
          scope: 'global'
        }
      });
      const actual = relationUtils.findEndpointMatch(endpoints);
      assert.equal(actual.error, 'Ambiguous relationship is not allowed.');
    });

    it('chooses the explicit relation over matching implicit', () => {
      // In order to force an ambiguous relation, we need to null these out.
      endpoints[0].type = null;
      endpoints[1].type = null;
      endpoints[0].charm.set('requires', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'juju-info': {
          'interface': 'juju-info',
          scope: 'container'
        }
      });
      endpoints[1].charm.set('provides', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'juju-info': {
          'interface': 'juju-info',
          scope: 'container'
        }
      });
      const actual = relationUtils.findEndpointMatch(endpoints);
      const expected = {
        'interface': 'mysql',
        scope: 'global',
        provides: endpoints[1],
        requires: endpoints[0],
        provideType: 'db',
        requireType: 'db'
      };
      assert.deepEqual(actual, expected);
    });
  });

  describe('relations visualization', function() {
    let db, service, getById;

    beforeEach(() => {
      db = new models.Database();
      service = new models.Service({
        id: 'mysql',
        charm: 'cs:mysql',
        unit_count: 1,
        loaded: true
      });
      db.services.add(service);
      getById = db.services.getById;
      db.services.getById = function() {
        return {
          get: function() {
            return 'mediawiki';
          }
        };
      };
    });

    afterEach(() => {
      db.services.getById = getById;
    });

    it('returns unique relations between applications', () => {
      const secondApplication = new models.Service({
        id: 'mediawiki-a',
        charm: 'cs:mediawiki',
        unit_count: 1,
        loaded: true
      });
      db.services.add(secondApplication);
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'server', name: 'mydb'}],
          ['mediawiki', {role: 'client', name: 'db'}]
        ],
        'id': 'relation-0000000002'
      });
      const results = relationUtils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      const results2 = relationUtils.getRelationDataForService(db, service,
        secondApplication);
      assert.strictEqual(0, results2.length);
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'server', name: 'mydb'}],
          ['mediawiki-a', {role: 'client', name: 'db'}]
        ],
        'id': 'relation-0000000003'
      });
      const results3 = relationUtils.getRelationDataForService(db, service,
        secondApplication);
      assert.strictEqual(1, results3.length);
    });

    it('shows a juju-core rel from the perspective of a service', () => {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      const results = relationUtils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      const result = results[0];
      assert.strictEqual('mysql', result['interface'], 'interface');
      assert.strictEqual('global', result.scope, 'scope');
      assert.strictEqual('mediawiki:db mysql:mydb', result.id, 'id');
      assert.strictEqual(
        relationUtils.generateSafeDOMId('mediawiki:db mysql:mydb'),
        result.elementId,
        'elementId'
      );
      assert.strictEqual('mediawiki:db mysql:mydb', result.ident, 'ident');
      assert.strictEqual('mysql', result.near.service, 'near service');
      assert.strictEqual('provider', result.near.role, 'near role');
      assert.strictEqual('mydb', result.near.name, 'near name');
      assert.strictEqual('mediawiki', result.far.service, 'far service');
      assert.strictEqual('requirer', result.far.role, 'far role');
      assert.strictEqual('db', result.far.name, 'far name');
    });

    it('includes the service names', () => {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      const result = relationUtils.getRelationDataForService(db, service)[0];
      assert.strictEqual(result.near.serviceName, 'cs:mysql');
      assert.strictEqual(result.far.serviceName, 'mediawiki');
    });

    it('does not fail if the far application has been removed', () => {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      // By not returning an application we're simulating that the service no
      // longer exists, i.e. has been destroyed.
      db.services.getById = sinon.stub().returns(null);
      const result = relationUtils.getRelationDataForService(db, service)[0];
      assert.strictEqual(result.near.serviceName, 'cs:mysql');
      assert.isUndefined(result.far);
    });
  });

  describe('DecoratedRelation and RelationCollection', () => {
    let unit, inputRelation, source, target;

    beforeEach(() => {
      source = {
        id: 'source-id',
        model: { get: function() {} },
        modelId: function() {
          return 'source-id';
        },
        _units: [],
        units: { toArray: () => source._units }
      };
      target = {
        id: 'target-id',
        model: { get: function() {} },
        modelId: function() {
          return 'target-id';
        },
        _units: [],
        units: { toArray: () => target._units }
      };
      inputRelation = new models.Relation({
        endpoints: [
          ['source-id', {name: 'endpoint-1'}],
          ['target-id', {name: 'endpoint-2'}]
        ]
      });
      unit = {
        'agent_state': undefined,
        'agent_state_data': {
          'hook': undefined
        }
      };
    });

    it('mirrors the relation\'s properties', () => {
      inputRelation.set('foo', 'bar');
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.nestedProperty(relation, 'foo');
      assert.equal(relation.foo, 'bar');
    });

    it('exposes the source and target as attributes', () => {
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.equal(relation.source, source);
      assert.equal(relation.target, target);
    });

    it('generates an ID that includes source and target IDs', () => {
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(source.modelId()));
      assert.match(relation.compositeId, new RegExp(target.modelId()));
    });

    it('includes endpoint names in its ID, if they exist', () => {
      const firstEndpointName = 'endpoint-1';
      const secondEndpointName = 'endpoint-2';
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(firstEndpointName));
      assert.match(relation.compositeId, new RegExp(secondEndpointName));
    });

    it('exposes the fact that a relation is a subordinate', () => {
      inputRelation.set('scope', 'container');
      // Return true when checking source.model.get('subordinate')
      source.model.get = function() { return true; };
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.isTrue(relation.isSubordinate);
    });

    it('exposes the fact that a relation is not a subordinate', () => {
      inputRelation.set('scope', 'not-container');
      // Return false when checking source.model.get('subordinate')
      source.model.get = function() { return false; };
      let relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
      // Return true for subordinate, but maintain non-container scope.
      source.model.get = function() { return true; };
      relation = relationUtils.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
      // Return false for subordinate on both models but 'container' for scope
      source.model.get = function() { return false; };
      target.model.get = function() { return false; };
      inputRelation.set('scope', 'container');
      relation = relationUtils.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
    });

    it('can tell when a relation is in error', () => {
      source._units = [Object.assign({}, unit)];
      target._units = [Object.assign({}, unit)];
      const relation = relationUtils.DecoratedRelation(
        inputRelation, source, target);
      // Test no error scenario.
      assert.isFalse(relation.sourceHasError());
      assert.isFalse(relation.targetHasError());
      assert.isFalse(relation.hasRelationError());
      // Test error scenario.
      source._units[0].agent_state = 'error';
      source._units[0].agent_state_data.hook = 'endpoint-1-relation';
      assert.isTrue(relation.sourceHasError());
      assert.isFalse(relation.targetHasError());
      assert.isTrue(relation.hasRelationError());
      // Verify that we degrade gracefully with less data.
      source._units[0].agent_state = 'error';
      source._units[0].agent_state_data = null;
      source._units[0].agent_state_info = 'hook failed: "endpoint-1-relation"';
      assert.isTrue(relation.sourceHasError());
      assert.isFalse(relation.targetHasError());
      assert.isTrue(relation.hasRelationError());
      // Verify that we degrade gracefull with no data.
      source._units[0].agent_state = 'error';
      source._units[0].agent_state_data = null;
      source._units[0].agent_state_info = null;
      assert.isFalse(relation.sourceHasError());
      assert.isFalse(relation.targetHasError());
      assert.isFalse(relation.hasRelationError());
    });

    it('can store relations in collections', () => {
      const thirdModel = {
        model: { get: function() {} },
        modelId: function() {
          return 'third-id';
        }
      };
      // Add two relations between the same two models, plus a third.
      const relations = [
        relationUtils.DecoratedRelation(inputRelation, source, target),
        relationUtils.DecoratedRelation(inputRelation, source, target),
        relationUtils.DecoratedRelation(inputRelation, source, thirdModel)
      ];
      const collections = relationUtils.toRelationCollections(relations);
      assert.equal(collections.length, 2);
      assert.equal(collections[0].relations.length, 2);
      assert.equal(collections[0].aggregatedStatus, 'healthy');
      assert.isFalse(collections[0].isSubordinate);
      assert.equal(collections[0].id, collections[0].relations[0].id);
      assert.equal(collections[0].compositeId, collections[0].relations[0].id);
    });

    it('can aggregate relation statuses', () => {
      // Mock a service with one unit in error.
      const thirdModel = Object.assign({}, source);
      thirdModel.modelId = 'third-id';
      thirdModel._units = [Object.assign({}, unit)];
      thirdModel._units[0].agent_state = 'error';
      thirdModel._units[0].agent_state_data.hook = 'endpoint-1-relation';
      thirdModel.units = { toArray: function() { return thirdModel._units; } };
      // Add two relations between the same two models, plus a third.
      const relations = [
        relationUtils.DecoratedRelation(inputRelation, source, target),
        relationUtils.DecoratedRelation(inputRelation, source, target),
        relationUtils.DecoratedRelation(inputRelation, source, thirdModel)
      ];
      const collections = relationUtils.toRelationCollections(relations);
      // Multiple healthy relations - healthy.
      assert.equal(collections[0].aggregatedStatus, 'healthy');
      // Any error relations - error.
      assert.equal(collections[1].aggregatedStatus, 'error');

      // n-1 or fewer subordinate relations - healthy.
      collections[0].relations[0].isSubordinate = true;
      assert.equal(collections[0].aggregatedStatus, 'healthy');
      // Healthy relation pending deletion.
      collections[0].relations[0].deleted = true;
      assert.equal(collections[0].aggregatedStatus, 'pending-healthy');
      // n subordinate relations - subordinate.
      collections[0].relations[1].isSubordinate = true;
      assert.equal(collections[0].aggregatedStatus, 'subordinate');
      // Any subordinate relations with any errors - error.
      collections[1].relations[0].isSubordinate = true;
      assert.equal(collections[1].aggregatedStatus, 'error');
      // Errored relations pending deletion.
      collections[1].relations[0].deleted = true;
      assert.equal(collections[1].aggregatedStatus, 'pending-error');
      // Any pending relation - pending.
      collections[1].relations[0].pending = true;
      assert.equal(collections[1].aggregatedStatus, 'pending');
    });
  });

  describe('isSubordinateRelation', () => {
    it('can tell if a relation is a subordinate', () => {
      const relation = {scope: 'container'};
      assert.isTrue(relationUtils.isSubordinateRelation(relation));
    });

    it('can tell if a relation is not a subordinate', () => {
      const relation = {scope: 'not-a-container'};
      assert.isFalse(relationUtils.isSubordinateRelation(relation));
    });
  });

  describe('createRelation', () => {

    it('properly creates a relation', () => {
      const relationId = 'pending-19984570$:db23212464$:db';
      const charmGet = sinon.stub();
      charmGet.withArgs('requires').onFirstCall().returns({
        db: {
          interface: 'db',
          scope: 'global'
        }
      });
      charmGet.withArgs('requires').onSecondCall().returns({
        misc: {
          interface: 'misc',
          scope: 'global'
        }
      });
      charmGet.withArgs('provides').returns({
        db: {
          interface: 'db',
          scope: 'global'
        }
      });
      const db = {
        charms: {
          getById: sinon.stub().returns({
            get: charmGet
          }),
          size: sinon.stub()
        },
        relations: {
          add: sinon.stub(),
          remove: sinon.stub(),
          create: sinon.stub(),
          getById: sinon.stub().returns(relationId)
        },
        services: {
          getById: sinon.stub().returns({
            get: sinon.stub()
          })
        }
      };
      const env = {
        add_relation: sinon.stub()
      };
      const endpoints = [[
        '19984570$', {
          name: 'db',
          role: 'client'
        }
      ], [
        '23212464$', {
          name: 'db',
          role: 'server'
        }
      ]];
      relationUtils.createRelation(db, env, endpoints, sinon.stub());
      assert.equal(db.relations.add.callCount, 1);
      assert.deepEqual(db.relations.add.lastCall.args[0], {
        relation_id: relationId,
        interface: 'db',
        endpoints: endpoints,
        pending: true,
        scope: 'global',
        display_name: 'pending'
      });
      assert.equal(env.add_relation.callCount, 1);
      assert.deepEqual(env.add_relation.lastCall.args[0], endpoints[0]);
      assert.deepEqual(env.add_relation.lastCall.args[1], endpoints[1]);
      // Call the add_relation callback.
      env.add_relation.lastCall.args[2]({
        result: { id: 'foo', 'interface': 'bar', scope: 'global' }
      });
      // Callback method assertions.
      assert.equal(db.relations.remove.callCount, 1);
      assert.equal(db.relations.remove.lastCall.args[0], relationId);
      assert.equal(db.relations.create.callCount, 1);
      assert.deepEqual(db.relations.create.lastCall.args[0], {
        relation_id: 'foo',
        type: 'bar',
        endpoints: endpoints,
        pending: false,
        scope: 'global'
      });
    });

    it('relates a subordinate with a matching series', () => {
      const relationId = 'pending-19984570$:db23212464$:db';
      const charmGet = sinon.stub();
      charmGet.withArgs('requires').onFirstCall().returns({
        db: {
          interface: 'db',
          scope: 'global'
        }
      });
      charmGet.withArgs('requires').onSecondCall().returns({
        misc: {
          interface: 'misc',
          scope: 'global'
        }
      });
      charmGet.withArgs('provides').returns({
        db: {
          interface: 'db',
          scope: 'global'
        }
      });
      const serviceSet = sinon.stub();
      const serviceGet = sinon.stub();
      serviceGet.withArgs('subordinate').onFirstCall().returns(true);
      serviceGet.withArgs('subordinate').onSecondCall().returns(false);
      serviceGet.withArgs('series').returns('xenial');
      const db = {
        charms: {
          getById: sinon.stub().returns({
            get: charmGet
          }),
          size: sinon.stub()
        },
        relations: {
          add: sinon.stub(),
          remove: sinon.stub(),
          create: sinon.stub(),
          getById: sinon.stub().returns(relationId)
        },
        services: {
          getById: sinon.stub().returns({
            get: serviceGet,
            set: serviceSet
          })
        }
      };
      const env = {
        add_relation: sinon.stub()
      };
      const endpoints = [[
        '19984570$', {
          name: 'db',
          role: 'client'
        }
      ], [
        '23212464$', {
          name: 'db',
          role: 'server'
        }
      ]];
      relationUtils.createRelation(
        db, env, endpoints, sinon.stub());
      assert.equal(db.relations.add.callCount, 1);
      assert.deepEqual(db.relations.add.lastCall.args[0], {
        relation_id: relationId,
        interface: 'db',
        endpoints: endpoints,
        pending: true,
        scope: 'global',
        display_name: 'pending'
      });
      assert.equal(env.add_relation.callCount, 1);
      assert.deepEqual(env.add_relation.lastCall.args[0], endpoints[0]);
      assert.deepEqual(env.add_relation.lastCall.args[1], endpoints[1]);
      // Call the add_relation callback.
      env.add_relation.lastCall.args[2]({
        result: { id: 'foo', 'interface': 'bar', scope: 'global' }
      });
      // Callback method assertions.
      assert.equal(db.relations.remove.callCount, 1);
      assert.equal(db.relations.remove.lastCall.args[0], relationId);
      assert.equal(db.relations.create.callCount, 1);
      assert.deepEqual(db.relations.create.lastCall.args[0], {
        relation_id: 'foo',
        type: 'bar',
        endpoints: endpoints,
        pending: false,
        scope: 'global'
      });
      assert.equal(serviceSet.callCount, 0);
    });

    it('relates multi-series subordinate with non-matching series', () => {
      const relationId = 'pending-19984570$:db23212464$:db';
      const charmGet = sinon.stub();
      charmGet.withArgs('requires').onFirstCall().returns({
        db: {
          interface: 'db',
          scope: 'global'
        }
      });
      charmGet.withArgs('requires').onSecondCall().returns({
        misc: {
          interface: 'misc',
          scope: 'global'
        }
      });
      charmGet.withArgs('provides').returns({
        db: {
          interface: 'db',
          scope: 'container'
        }
      });
      const serviceSet = sinon.stub();
      const serviceGet = sinon.stub();
      serviceGet.withArgs('subordinate').onFirstCall().returns(true);
      serviceGet.withArgs('subordinate').onSecondCall().returns(false);
      serviceGet.withArgs('series').onFirstCall().returns('trusty');
      serviceGet.withArgs('series').onSecondCall().returns('xenial');
      const db = {
        charms: {
          getById: sinon.stub().returns({
            get: charmGet
          }),
          size: sinon.stub()
        },
        relations: {
          add: sinon.stub(),
          remove: sinon.stub(),
          create: sinon.stub(),
          getById: sinon.stub().returns(relationId),
          get_relations_for_service: sinon.stub().returns([])
        },
        services: {
          getById: sinon.stub().returns({
            get: serviceGet,
            set: serviceSet
          })
        }
      };
      const env = {
        add_relation: sinon.stub()
      };
      const endpoints = [[
        '19984570$', {
          name: 'db',
          role: 'client'
        }
      ], [
        '23212464$', {
          name: 'db',
          role: 'server'
        }
      ]];
      relationUtils.createRelation(
        db, env, endpoints, sinon.stub());
      assert.equal(db.relations.add.callCount, 1);
      assert.deepEqual(db.relations.add.lastCall.args[0], {
        relation_id: relationId,
        interface: 'db',
        endpoints: endpoints,
        pending: true,
        scope: 'container',
        display_name: 'pending'
      });
      assert.equal(env.add_relation.callCount, 1);
      assert.deepEqual(env.add_relation.lastCall.args[0], endpoints[0]);
      assert.deepEqual(env.add_relation.lastCall.args[1], endpoints[1]);
      // Call the add_relation callback.
      env.add_relation.lastCall.args[2]({
        result: { id: 'foo', 'interface': 'bar', scope: 'global' }
      });
      // Callback method assertions.
      assert.equal(db.relations.remove.callCount, 1);
      assert.equal(db.relations.remove.lastCall.args[0], relationId);
      assert.equal(db.relations.create.callCount, 1);
      assert.deepEqual(db.relations.create.lastCall.args[0], {
        relation_id: 'foo',
        type: 'bar',
        endpoints: endpoints,
        pending: false,
        scope: 'global'
      });
      assert.equal(serviceSet.callCount, 1);
      assert.equal(serviceSet.args[0][0], 'series');
      assert.equal(serviceSet.args[0][1], 'trusty');
    });
  });

  describe('getAvailableEndpoints', () => {

    function runGetAvailableEndpoints(vals, context) {
      const endpointsController = 'endpointsController';
      const endpointData = {};
      endpointData[vals.applicationToId] = JSON.parse(vals.getEndpoints);
      const getEndpoints = sinon.stub().returns(endpointData);
      const applicationFrom = vals.applicationFrom || {};
      const applicationTo = { get: function() { return vals.applicationToId; } };
      return relationUtils.getAvailableEndpoints(
        endpointsController, 'db', getEndpoints, applicationFrom,
        applicationTo, JSON.parse(vals.getRelationDataForService));
    }

    describe('works with...', () => {
      /* eslint-disable max-len */
      it('two services, one possible endpoint', () => {
        const relatableEndpoints = '[[{"service":"8784924$","name":"db","type":"mysql"},{"service":"38546607$","name":"db","type":"mysql"}]]';
        const availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '38546607$',
          getEndpoints: relatableEndpoints,
          getRelationDataForService: '[]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse(relatableEndpoints));
      });

      it('two services, one full endpoint', () => {
        const availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '38546607$',
          getEndpoints: '[[{"service":"8784924$","name":"db","type":"mysql"},{"service":"38546607$","name":"db","type":"mysql"}]]',
          getRelationDataForService: '[{"interface":"db","initialized":true,"destroyed":false,"clientId":"relation_10","id":"pending-8784924$:db38546607$:db","relation_id":"pending-8784924$:db38546607$:db","endpoints":[["8784924$",{"name":"db","role":"client"}],["38546607$",{"name":"db","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"38546607$","serviceName":"wordpress","role":"server","name":"db"},"far":{"service":"8784924$","serviceName":"mariadb","role":"client","name":"db"},"ident":"pending-8784924$:db38546607$:db","elementId":"e-pending_8784924__db38546607__db-1455252509"}]'
        }, this);
        assert.deepEqual(availableEndpoints, []);
      });

      it('two services, two possible and empty endpoints', () => {
        const relatableEndpoints = '[[{"service":"1485178$","name":"master","type":"mysql-oneway-replication"},{"service":"81820288$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"1485178$","name":"slave","type":"mysql-oneway-replication"},{"service":"81820288$","name":"master","type":"mysql-oneway-replication"}]]';
        const availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '1485178$',
          getEndpoints: relatableEndpoints,
          getRelationDataForService: '[]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse(relatableEndpoints));
      });

      it('two services, one possible and one full endpoint', () => {
        const availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '12648410$',
          getEndpoints: '[[{"service":"96799599$","name":"master","type":"mysql-oneway-replication"},{"service":"12648410$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"96799599$","name":"slave","type":"mysql-oneway-replication"},{"service":"12648410$","name":"master","type":"mysql-oneway-replication"}]]',
          getRelationDataForService: '[{"initialized":true,"destroyed":false,"clientId":"relation_72","id":"pending-96799599$12648410$slavemaster","relation_id":"pending-96799599$12648410$slavemaster","endpoints":[["96799599$",{"name":"slave","role":"server"}],["12648410$",{"name":"master","role":"client"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"12648410$","serviceName":"mysql","role":"client","name":"master"},"far":{"service":"96799599$","serviceName":"mysql-a","role":"server","name":"slave"},"ident":"pending-96799599$12648410$slavemaster","elementId":"e-pending_96799599_12648410_slavemaster-1611657570"}]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse('[[{"service":"96799599$","name":"master","type":"mysql-oneway-replication"},{"service":"12648410$","name":"slave","type":"mysql-oneway-replication"}]]'));
      });

      it('two services, no possible and two full endpoints', () => {
        const availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '93057667$',
          getEndpoints: '[[{"service":"24412010$","name":"master","type":"mysql-oneway-replication"},{"service":"93057667$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"24412010$","name":"slave","type":"mysql-oneway-replication"},{"service":"93057667$","name":"master","type":"mysql-oneway-replication"}]]',
          getRelationDataForService: '[{"interface":"master","initialized":true,"destroyed":false,"clientId":"relation_72","id":"pending-24412010$:master93057667$:slave","relation_id":"pending-24412010$:master93057667$:slave","endpoints":[["24412010$",{"name":"master","role":"client"}],["93057667$",{"name":"slave","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"93057667$","serviceName":"mysql","role":"server","name":"slave"},"far":{"service":"24412010$","serviceName":"mysql-a","role":"client","name":"master"},"ident":"pending-24412010$:master93057667$:slave","elementId":"e-pending_24412010__master93057667__slave-278287960"},{"interface":"slave","initialized":true,"destroyed":false,"clientId":"relation_73","id":"pending-24412010$:slave93057667$:master","relation_id":"pending-24412010$:slave93057667$:master","endpoints":[["24412010$",{"name":"slave","role":"client"}],["93057667$",{"name":"master","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"93057667$","serviceName":"mysql","role":"server","name":"master"},"far":{"service":"24412010$","serviceName":"mysql-a","role":"client","name":"slave"},"ident":"pending-24412010$:slave93057667$:master","elementId":"e-pending_24412010__slave93057667__master-1283641382"}]'
        }, this);
        assert.deepEqual(availableEndpoints, []);
      });
      /* eslint-enable max-len */
    });
  });

  describe('getRelatableApplications', () => {

    it('properly returns relatable applications', () => {
      const service1 = 'service1';
      const db = {
        services: {
          getById: function (appName) { return service1; }
        }
      };
      const endpoints = {
        '7117087$': [
          [{
            service: '2003212$',
            name: 'db',
            type: 'mysql'
          }, {
            service: '7117087$',
            name: 'db',
            type: 'mysql'
          }]
        ]};

      assert.deepEqual(
        [service1], relationUtils.getRelatableApplications(db, endpoints));
    });
  });

  describe('destroyRelations', () => {
    it('can destroy a list of relations', () => {
      const db = {
        relations: {
          getById: sinon.stub().returns({
            get: sinon.stub().returns(['endpoint1', 'endpoint2'])
          })
        }
      };
      const env = {remove_relation: sinon.stub()};
      const callback = sinon.stub();
      relationUtils.destroyRelations(db, env, ['relation1'], callback);
      assert.equal(env.remove_relation.callCount, 1);
      const args = env.remove_relation.args[0];
      assert.equal(args[0], 'endpoint1');
      assert.equal(args[1], 'endpoint2');
      assert.equal(args[2], callback);
    });
  });
});
