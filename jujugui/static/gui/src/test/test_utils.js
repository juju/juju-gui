/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {
  describe('juju-views-utils', function() {
    var views;
    before(function(done) {
      YUI(GlobalConfig).use(
          'juju-view-utils', 'node-event-simulate',
          function(Y) {
            views = Y.namespace('juju.views');
            done();
          });
    });

    it('can generate a hash', function() {
      // We aren't testing the algorithm here, just basic hash characteristics.
      // It's a number.
      assert.strictEqual(views.utils.generateHash(''), 0);
      assert.isNumber(views.utils.generateHash('kumquat'));
      assert.isNumber(views.utils.generateHash('qumquat'));
      // It's stable.
      assert.strictEqual(
          views.utils.generateHash('kumquat'),
          views.utils.generateHash('kumquat'));
      // Different values hash differently.
      assert.notEqual(
          views.utils.generateHash('kumquat'),
          views.utils.generateHash('qumquat'));
    });

    it('can generate safe relation ids', function() {
      var relationId;
      relationId = 'foo:Bar relation-00000006!@#';
      assert.strictEqual(
          views.utils.generateSafeDOMId(relationId),
          'e-foo_Bar_relation_00000006___-' +
          views.utils.generateHash(relationId));
    });

    it('can generate safe relation ids with a parent id', function() {
      var relationId;
      relationId = 'foo:Bar relation-00000006!@#';
      assert.notEqual(
          views.utils.generateSafeDOMId(relationId, 'topo1'),
          views.utils.generateSafeDOMId(relationId, 'topo2'));
      assert.strictEqual(
          views.utils.generateSafeDOMId(relationId, 'topo1'),
          'e-foo_Bar_relation_00000006___-' +
          views.utils.generateHash(relationId + 'topo1'));
    });

    it('should create a confirmation panel', function() {
      var confirmed = false;
      var panel = views.createModalPanel(
          'Description',
          '#main',
          'Action Label',
          function() {confirmed = true;}
     );
      panel.show();
      var panel_node = panel.get('boundingBox'),
          button = panel_node.all('.button').item(0);
      button.getHTML().should.equal('Action Label');
      button.simulate('click');
      confirmed.should.equal(true);
      panel.destroy();
    });

    it('should hide the panel when the Cancel button is clicked', function() {
      var confirmed = false;
      var panel = views.createModalPanel(
          'Description',
          '#main',
          'Action Label',
          function() {confirmed = true;});
      panel.show();
      var panel_node = panel.get('boundingBox'),
          button = panel_node.all('.button').item(1);
      button.getHTML().should.equal('Cancel');
      button.simulate('click');
      confirmed.should.equal(false);
      panel.destroy();
    });

    it('should allow you to reset the buttons', function() {
      var confirmed = false;
      var panel = views.createModalPanel(
          'Description',
          '#main',
          'First Action Label',
          function() {confirmed = false;});
      panel.get('buttons').footer.length.should.equal(2);
      views.setModalButtons(
          panel, 'Second Action Label', function() { confirmed = true; });
      panel.get('buttons').footer.length.should.equal(2);
      panel.show();
      var panel_node = panel.get('boundingBox'),
          button = panel_node.all('.button').item(0);
      button.getHTML().should.equal('Second Action Label');
      button.simulate('click');
      confirmed.should.equal(true);
      panel.destroy();
    });
  });

  describe('Utilities for handling relations', function() {
    var endpoints, utils;

    before(function(done) {
      YUI(GlobalConfig).use(
          'juju-view-utils', 'node-event-simulate',
          function(Y) {
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    beforeEach(function() {
      var MockCharm = function(attrs) {
        var _attrs = attrs;

        return {
          set: function(key, value) {
            _attrs[key] = value;
          },

          get: function(key) {
            return _attrs[key];
          }
        };
      };
      var wordpressProvides = {
        website: {
          'interface': 'http',
          scope: 'global'
        }
      };
      var wordpressRequires = {
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
      var mysqlProvides = {
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
      var mysqlRequires = {
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

    it('finds endpoint matches for relations', function() {
      var actual = utils.findEndpointMatch(endpoints);
      var expected = {
        'interface': 'mysql',
        scope: 'global',
        provides: endpoints[1],
        requires: endpoints[0],
        provideType: 'db',
        requireType: 'db'
      };
      assert.deepEqual(actual, expected);
    });

    it('errors when no endpoint matches exist', function() {
      endpoints[1].charm.set('provides', {});
      var actual = utils.findEndpointMatch(endpoints);
      assert.equal(actual.error, 'Specified relation is unavailable.');
    });

    it('errors when multiple explicit endpoint matches exist', function() {
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
        },
      });
      endpoints[1].charm.set('provides', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'db-admin': {
          'interface': 'mysql',
          scope: 'global'
        },
      });
      var actual = utils.findEndpointMatch(endpoints);
      assert.equal(actual.error, 'Ambiguous relationship is not allowed.');
    });

    it('chooses the explicit relation over matching implicit', function() {
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
        },
      });
      endpoints[1].charm.set('provides', {
        db: {
          'interface': 'mysql',
          scope: 'global'
        },
        'juju-info': {
          'interface': 'juju-info',
          scope: 'container'
        },
      });
      var actual = utils.findEndpointMatch(endpoints);
      var expected = {
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
}) ();

describe('utilities', function() {
  var Y, views, models, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'], function(Y) {
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju.views.utils');
      done();
    });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = Y.Lang.now();
    // Javascript timestamps are in milliseconds
    views.humanizeTimestamp(now).should.equal('less than a minute ago');
    views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');
  });

  it('generate a list of status by unit counts', function() {
    var units = [
      {id: 1, agent_state: 'started'},
      {id: 2, agent_state: 'pending'},
      {id: 3, agent_state: 'error'},
      {id: 4},
      {id: 5},
      {id: 6, agent_state: 'started'},
      {id: 7, agent_state: 'error'},
      {id: 8, agent_state: 'error'},
      {id: 9}
    ];
    assert.deepEqual(utils.getUnitStatusCounts(units), {
      uncommitted: {priority: 3, size: 3},
      started: {priority: 2, size: 2},
      pending: {priority: 1, size: 1},
      error: {priority: 0, size: 3}
    });
  });

  it('can calculate the number of unplaced units', function() {
    var db = new models.Database();
    db.services.add({
      id: 'django'
    });
    db.addUnits([{
      id: 'django/42'
    }, {
      id: 'django/43',
      machine: '15'
    }, {
      id: 'django/44'
    }]);
    assert.equal(utils.getUnplacedUnitCount(db.units), 2);
  });

  it('can calculate the number of unplaced units for zero', function() {
    var db = new models.Database();
    db.services.add({
      id: 'django'
    });
    db.addUnits([{
      id: 'django/43',
      machine: '15'
    }]);
    assert.equal(utils.getUnplacedUnitCount(db.units), 0);
  });

  describe('isPythonRelation', function() {
    var isPythonRelation;

    before(function() {
      isPythonRelation = utils.isPythonRelation;
    });

    it('identifies PyJuju relations', function() {
      var relations = ['relation-0000000002', 'relation-42', 'relation-0'];
      relations.forEach(function(relation) {
        assert.isTrue(isPythonRelation(relation), relation);
      });
    });

    it('identifies juju-core relations', function() {
      var relations = [
        'wordpress:loadbalancer',
        'haproxy:reverseproxy wordpress:website',
        'relation-0000000002:mysql'
      ];
      relations.forEach(function(relation) {
        assert.isFalse(isPythonRelation(relation), relation);
      });
    });

  });


  describe('relations visualization', function() {
    var db, service, getById;

    beforeEach(function() {
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

    afterEach(function() {
      db.services.getById = getById;
    });

    it('shows a PyJuju rel from the perspective of a service', function() {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'server', name: 'mydb'}],
          ['mediawiki', {role: 'client', name: 'db'}]
        ],
        'id': 'relation-0000000002'
      });
      var results = utils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      var result = results[0];
      assert.strictEqual('mysql', result['interface'], 'interface');
      assert.strictEqual('global', result.scope, 'scope');
      assert.strictEqual('relation-0000000002', result.id, 'id');
      assert.strictEqual(
          utils.generateSafeDOMId('relation-0000000002'),
          result.elementId,
          'elementId'
      );
      assert.strictEqual('mydb:2', result.ident, 'ident');
      assert.strictEqual('mysql', result.near.service, 'near service');
      assert.strictEqual('server', result.near.role, 'near role');
      assert.strictEqual('mydb', result.near.name, 'near name');
      assert.strictEqual('mediawiki', result.far.service, 'far service');
      assert.strictEqual('client', result.far.role, 'far role');
      assert.strictEqual('db', result.far.name, 'far name');
    });

    it('shows a juju-core rel from the perspective of a service', function() {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      var results = utils.getRelationDataForService(db, service);
      assert.strictEqual(1, results.length);
      var result = results[0];
      assert.strictEqual('mysql', result['interface'], 'interface');
      assert.strictEqual('global', result.scope, 'scope');
      assert.strictEqual('mediawiki:db mysql:mydb', result.id, 'id');
      assert.strictEqual(
          utils.generateSafeDOMId('mediawiki:db mysql:mydb'),
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

    it('includes the service names', function() {
      db.relations.add({
        'interface': 'mysql',
        scope: 'global',
        endpoints: [
          ['mysql', {role: 'provider', name: 'mydb'}],
          ['mediawiki', {role: 'requirer', name: 'db'}]
        ],
        'id': 'mediawiki:db mysql:mydb'
      });
      var results = utils.getRelationDataForService(db, service);
      var result = results[0];
      assert.strictEqual(result.near.serviceName, 'cs:mysql');
      assert.strictEqual(result.far.serviceName, 'mediawiki');
    });

  });
});

(function() {
  describe('form validation', function() {

    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils',

          function(Y) {
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    it('should handle int fields', function() {
      var schema = {an_int: {type: 'int'}};

      // If an int field has a valid value, no error is given.
      assert.equal(utils.validate({an_int: '0'}, schema).an_int, undefined);
      // If an int field has an invalid value, an error is reported.
      assert.equal(utils.validate({an_int: 'nope!'}, schema).an_int,
          'The value "nope!" is not an integer.');
      // Floating point numbers are not valid ints.
      assert.equal(utils.validate({an_int: '3.14159'}, schema).an_int,
          'The value "3.14159" is not an integer.');
      // Just starting with a number is not enough.
      assert.equal(utils.validate({an_int: '3peat'}, schema).an_int,
          'The value "3peat" is not an integer.');

      assert.equal(utils.validate({an_int: ''}, schema).an_int,
          'This field is required.');
      assert.equal(utils.validate({an_int: '  '}, schema).an_int,
          'This field is required.');

      // Floating point numbers are not valid ints.
      assert.equal(utils.validate({an_int: '+'}, schema).an_int,
          'The value "+" is not an integer.');
      assert.equal(utils.validate({an_int: '+1'}, schema).an_int,
          undefined);
      assert.equal(utils.validate({an_int: ' +1 '}, schema).an_int,
          undefined);
      // Just starting with a number is not enough.
      assert.equal(utils.validate({an_int: '-'}, schema).an_int,
          'The value "-" is not an integer.');
      assert.equal(utils.validate({an_int: '-1'}, schema).an_int,
          undefined);
      assert.equal(utils.validate({an_int: ' -1 '}, schema).an_int,
          undefined);

    });

    it('should handle float fields', function() {
      var schema = {a_float: {type: 'float'}};

      // Floating point numbers are valid floats.
      assert.equal(utils.validate({a_float: '3.14159'}, schema).a_float,
          undefined);
      // Decimal points are not strictly required.
      assert.equal(utils.validate({a_float: '42'}, schema).a_float, undefined);

      // Test numbers with - + and spaces
      assert.equal(utils.validate({a_float: '-42'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: '+42'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: ' +42 '}, schema).a_float,
          undefined);

      // Digits before the decimal point are not strictly required.
      assert.equal(utils.validate({a_float: '.5'}, schema).a_float, undefined);

      // Test numbers with - + and spaces
      assert.equal(utils.validate({a_float: '-0.5'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: '+0.5'}, schema).a_float,
          undefined);
      assert.equal(utils.validate({a_float: ' -0.5 '}, schema).a_float,
          undefined);

      // If a float field has an invalid value, an error is reported.
      assert.equal(utils.validate({a_float: 'nope!'}, schema).a_float,
          'The value "nope!" is not a float.');
      // Just starting with a number is not enough.
      assert.equal(utils.validate({a_float: '3peat'}, schema).a_float,
          'The value "3peat" is not a float.');

      assert.equal(utils.validate({a_float: ''}, schema).a_float,
          'This field is required.');
      assert.equal(utils.validate({a_float: '  '}, schema).a_float,
          'This field is required.');

      assert.equal(utils.validate({a_float: '+'}, schema).a_float,
          'The value "+" is not a float.');
      assert.equal(utils.validate({a_float: '-'}, schema).a_float,
          'The value "-" is not a float.');
      assert.equal(utils.validate({a_float: '.'}, schema).a_float,
          'The value "." is not a float.');
    });

    it('should handle fields with defaults', function() {
      var defaults_schema =
          { an_int:
                { type: 'int',
                  'default': '7'},
            a_float:
                { type: 'float',
                  'default': '2.5'},
            a_string:
                { type: 'string',
                  'default': 'default'}};

      // If a field has a default and it is a numeric field and the value is an
      // empty string, then no error is generated.

      // Int:
      assert.equal(utils.validate({an_int: ''}, defaults_schema).an_int,
          undefined);
      // Float:
      assert.equal(utils.validate({a_float: ''}, defaults_schema).a_float,
          undefined);
    });

    it('should handle fields without defaults', function() {
      var no_defaults_schema =
          { an_int:
                { type: 'int'},
            a_float:
                { type: 'float'},
            a_string:
                { type: 'string'}};

      // If a field has no default and it is a numeric field and the value is
      // an empty string, then an error is generated.

      // Int without default:
      assert.equal(utils.validate({an_int: ''}, no_defaults_schema).an_int,
          'This field is required.');
      // Float without default
      assert.equal(utils.validate({a_float: ''}, no_defaults_schema).a_float,
          'This field is required.');
      // String fields do not generate errors when they are empty and do not
      // have a default because an empty string is still a string.
      assert.equal(utils.validate({a_string: ''}, no_defaults_schema).a_string,
          undefined);
    });

  });
})();

(function() {
  describe('service state simplification', function() {

    var simplifyState;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        simplifyState = Y.namespace('juju.views.utils').simplifyState;
        done();
      });
    });

    var makeUnit = function(state, relationErrors) {
      var unit = {agent_state: state};
      if (relationErrors) {
        unit.relation_errors = {myrelation: ['service']};
      }
      return unit;
    };

    it('translates service running states correctly', function() {
      var unit = makeUnit('started');
      assert.strictEqual('running', simplifyState(unit));
    });

    it('translates service error states correctly', function() {
      var states = ['install-error', 'foo-error', '-error', 'error'];
      states.forEach(function(state) {
        var unit = makeUnit(state);
        assert.strictEqual(simplifyState(unit), 'error', state);
      });
    });

    it('translates service pending states correctly', function() {
      var states = ['pending', 'installed', 'waiting', 'stopped'];
      states.forEach(function(state, index) {
        var unit = makeUnit(state);
        assert.strictEqual(simplifyState(unit), states[index], state);
      });
    });

  });
})();

(function() {

  describe('utils.getUnitSeries', function() {
    var utils, db;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      db = {
        services: {
          getServiceByName: function(name) {
            assert.equal(name, 'rails');
            return {
              get: function(arg) {
                assert.equal(arg, 'series');
                return 'precise';
              }
            };
          }
        }
      };
    });

    it('returns the series of a charmstore charm', function() {
      var series = utils.getUnitSeries({id: 'rails/47'}, db);
      assert.strictEqual(series, 'precise');
    });
  });
})();

(function() {

  describe('utils.getName', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('returns the name of a charm', function() {
      var name = utils.getName('cs:~uros/precise/rails-server-47');
      assert.strictEqual(name, 'rails-server');
    });

    it('returns the name of a charm when version is missing', function() {
      var name = utils.getName('cs:~uros/precise/rails-server');
      assert.strictEqual(name, 'rails-server');
    });

  });
})();

(function() {
  describe('DecoratedRelation and RelationCollection', function() {

    var models, views, unit, utils, Y, inputRelation, source, target;

    before(function(done) {
      var modules = ['juju-models', 'juju-views', 'juju-view-utils'];
      Y = YUI(GlobalConfig).use(modules, function(Y) {
        models = Y.namespace('juju.models');
        views = Y.namespace('juju.views');
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      source = {
        id: 'source-id',
        model: { get: function() {} },
        modelId: function() {
          return 'source-id';
        },
        _units: [],
        units: { toArray: function() { return source._units; } }
      };
      target = {
        id: 'target-id',
        model: { get: function() {} },
        modelId: function() {
          return 'target-id';
        },
        _units: [],
        units: { toArray: function() { return target._units; } }
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

    it('mirrors the relation\'s properties', function() {
      inputRelation.set('foo', 'bar');
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.deepProperty(relation, 'foo');
      assert.equal(relation.foo, 'bar');
    });

    it('exposes the source and target as attributes', function() {
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.equal(relation.source, source);
      assert.equal(relation.target, target);
    });

    it('generates an ID that includes source and target IDs', function() {
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(source.modelId()));
      assert.match(relation.compositeId, new RegExp(target.modelId()));
    });

    it('includes endpoint names in its ID, if they exist', function() {
      var firstEndpointName = 'endpoint-1';
      var secondEndpointName = 'endpoint-2';
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.match(relation.compositeId, new RegExp(firstEndpointName));
      assert.match(relation.compositeId, new RegExp(secondEndpointName));
    });

    it('exposes the fact that a relation is a subordinate', function() {
      inputRelation.set('scope', 'container');
      // Return true when checking source.model.get('subordinate')
      source.model.get = function() { return true; };
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isTrue(relation.isSubordinate);
    });

    it('exposes the fact that a relation is not a subordinate', function() {
      inputRelation.set('scope', 'not-container');
      // Return false when checking source.model.get('subordinate')
      source.model.get = function() { return false; };
      var relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
      // Return true for subordinate, but maintain non-container scope.
      source.model.get = function() { return true; };
      relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
      // Return false for subordinate on both models but 'container' for scope
      source.model.get = function() { return false; };
      target.model.get = function() { return false; };
      inputRelation.set('scope', 'container');
      relation = views.DecoratedRelation(inputRelation, source, target);
      assert.isFalse(relation.isSubordinate);
    });

    it('can tell when a relation is in error', function() {
      source._units = [Y.clone(unit)];
      target._units = [Y.clone(unit)];
      var relation = views.DecoratedRelation(inputRelation, source, target);
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

    it('can store relations in collections', function() {
      var thirdModel = {
        model: { get: function() {} },
        modelId: function() {
          return 'third-id';
        }
      };
      // Add two relations between the same two models, plus a third.
      var relations = [
        views.DecoratedRelation(inputRelation, source, target),
        views.DecoratedRelation(inputRelation, source, target),
        views.DecoratedRelation(inputRelation, source, thirdModel)
      ];
      var collections = utils.toRelationCollections(relations);
      assert.equal(collections.length, 2);
      assert.equal(collections[0].relations.length, 2);
      assert.equal(collections[0].aggregatedStatus, 'healthy');
      assert.isFalse(collections[0].isSubordinate);
      assert.equal(collections[0].id, collections[0].relations[0].id);
      assert.equal(collections[0].compositeId, collections[0].relations[0].id);
    });

    it('can aggregate relation statuses', function() {
      // Mock a service with one unit in error.
      var thirdModel = Y.clone(source);
      thirdModel.modelId = 'third-id';
      thirdModel._units = [Y.clone(unit)];
      thirdModel._units[0].agent_state = 'error';
      thirdModel._units[0].agent_state_data.hook = 'endpoint-1-relation';
      thirdModel.units = { toArray: function() { return thirdModel._units; } };
      // Add two relations between the same two models, plus a third.
      var relations = [
        views.DecoratedRelation(inputRelation, source, target),
        views.DecoratedRelation(inputRelation, source, target),
        views.DecoratedRelation(inputRelation, source, thirdModel)
      ];
      var collections = utils.toRelationCollections(relations);
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
})();

(function() {
  describe('utils.isSubordinateRelation', function() {

    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can tell if a relation is a subordinate', function() {
      var relation = {scope: 'container'};
      assert.isTrue(utils.isSubordinateRelation(relation));
    });

    it('can tell if a relation is not a subordinate', function() {
      var relation = {scope: 'not-a-container'};
      assert.isFalse(utils.isSubordinateRelation(relation));
    });

  });
})();

(function() {
  describe('utils.ensureTrailingSlash', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('adds a trailing slash if not already there', function() {
      var text = utils.ensureTrailingSlash('/foo/bar');
      assert.strictEqual(text, '/foo/bar/');
    });

    it('avoids adding a trailing slash if not required', function() {
      var text = utils.ensureTrailingSlash('/foo/bar/');
      assert.strictEqual(text, '/foo/bar/');
    });

  });

  describe('utils.getLandscapeURL', function() {
    var environment, models, service, unit, utils;
    var requirements = ['juju-models', 'juju-view-utils'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju.views.utils');
        var db = new models.Database();
        // Set up environment annotations for testing.
        environment = db.environment;
        environment.set('annotations', {
          'landscape-url': 'http://landscape.example.com',
          'landscape-computers': '/computers/criteria/environment:test',
          'landscape-reboot-alert-url': '+alert:computer-reboot/info#power',
          'landscape-security-alert-url':
              '+alert:security-upgrades/packages/list?filter=security'
        });
        // Create the Service and a Unit model instances for testing.
        service = db.services.add({
          id: 'django',
          annotations: {'landscape-computers': '+service:django'}
        });
        var unitObj = db.addUnits({
          id: 'django/42',
          annotations: {'landscape-computer': '+unit:django-42'}
        });
        unit = db.units.revive(unitObj);
        done();
      });
    });

    // Create and return a Landscape URL including the given path.
    var makeURL = function(path) {
      var address = 'http://landscape.example.com';
      var lastSegment = path || '/';
      return address + '/computers/criteria/environment:test' + lastSegment;
    };

    it('returns the generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment);
      var expected = makeURL();
      assert.strictEqual(url, expected);
    });

    it('returns the reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'reboot');
      var expected = makeURL('+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'security');
      var expected = makeURL(
          '+alert:security-upgrades/packages/list?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the service generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service);
      var expected = makeURL('+service:django/');
      assert.strictEqual(url, expected);
    });

    it('returns the service reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'reboot');
      var expected = makeURL(
          '+service:django/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the service security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'security');
      var expected = makeURL(
          '+service:django/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the unit generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit);
      var expected = makeURL('+unit:django-42/');
      assert.strictEqual(url, expected);
    });

    it('returns the unit reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'reboot');
      var expected = makeURL(
          '+unit:django-42/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the unit security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'security');
      var expected = makeURL(
          '+unit:django-42/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

  });

  describe('getIconPath', function() {
    var config, utils;

    before(function(done) {
      window.juju_config = {charmstoreURL: 'local/'};
      YUI(GlobalConfig).use('juju-view-utils',
          function(Y) {
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    beforeEach(function() {
      // Store the juju_config so that it can be reset after the test runs.
      config = window.juju_config;
    });

    afterEach(function() {
      window.juju_config = config;
    });

    it('returns local default bundle icon location for bundles', function() {
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('uses staticURL if provided for bundle icon location', function() {
      window.juju_config = {
        staticURL: 'static'
      };
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
          path,
          'local/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });

    after(function() {
      delete window.juju_config;
    });
  });

  describe('addGhostAndEcsUnits', function() {
    var utils, testUtils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    function testScaleUp(applicationName) {
      var service = {
        get: function(key) {
          var returnVal;
          switch (key) {
            case 'id':
              returnVal = applicationName;
              break;
            case 'units':
              returnVal = {
                size: function() { return 2; },
                toArray: function() { return [
                  {id: applicationName + '/1'},
                  {id: applicationName + '/2'}
                ]; }};
              break;
            case 'displayName':
              if (applicationName.indexOf('$') > 0) {
                returnVal = '(' + applicationName + ')';
              } else {
                returnVal = applicationName;
              }
              break;
            case 'charm':
              returnVal = 'I am a charm url';
              break;
            case 'subordinate':
              returnVal = false;
              break;
          }
          return returnVal;
        }
      };
      var db = {
        addUnits: testUtils.makeStubFunction(),
        removeUnits: testUtils.makeStubFunction()
      };
      var env = {
        add_unit: testUtils.makeStubFunction()
      };
      var unitCount = 2;
      var callback = testUtils.makeStubFunction();

      var units = utils.addGhostAndEcsUnits(
          db, env, service, unitCount, callback);
      // Test the db.addUnits call.
      assert.equal(db.addUnits.callCount(), 2, 'db addUnits not called');
      var addUnitsArgs = db.addUnits.allArguments();
      // The numbers for the id's are important. The mocks have existing units
      // having indexes of 1 and 2. There was a bug where the next value wasn't
      // being properly computed when there was no 0 unit.
      assert.deepEqual(addUnitsArgs[0][0], {
        id: applicationName + '/' + 3,
        displayName: applicationName + '/' + 3,
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits first not called with proper data');
      assert.deepEqual(addUnitsArgs[1][0], {
        id: applicationName + '/' + 4,
        displayName: applicationName + '/' + 4,
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits second not called with proper data');
      // Test the env.add_unit call.
      assert.equal(env.add_unit.callCount(), 2, 'add unit not called');
      var add_unit_args = env.add_unit.allArguments();
      assert.equal(add_unit_args[0][0], applicationName);
      assert.equal(add_unit_args[0][1], 1);
      assert.strictEqual(add_unit_args[0][2], null);
      assert.equal(typeof add_unit_args[0][3], 'function');
      assert.deepEqual(add_unit_args[0][4], {
        modelId: applicationName + '/' + 3
      });
      assert.equal(add_unit_args[1][0], applicationName);
      assert.equal(add_unit_args[1][1], 1);
      assert.strictEqual(add_unit_args[1][2], null);
      assert.equal(typeof add_unit_args[1][3], 'function');
      assert.deepEqual(add_unit_args[1][4], {
        modelId: applicationName + '/' + 4
      });
      assert.equal(units.length, 2);
    }

    it('creates machines, units; places units; updates unit lists',
       function() {
         testScaleUp('myService');
       }
    );

    it('creates machines, units; places units; updates unit lists for ghosts',
        function() {
          testScaleUp('myGhostService$');
        }
    );

    it('properly removes the ghost units on env add_unit callback', function() {
      var ghostUnit = { ghostUnit: 'I am' };
      var db = {
        removeUnits: testUtils.makeStubFunction()
      };
      var callback = testUtils.makeStubFunction();
      var e = {
        applicationName: 'appName'
      };
      utils.removeGhostAddUnitCallback(ghostUnit, db, callback, e);
      assert.equal(db.removeUnits.calledOnce(), true);
      assert.equal(db.removeUnits.lastArguments()[0].service, 'appName');
      assert.equal(callback.calledOnce(), true);
      assert.deepEqual(callback.lastArguments(), [e, db, ghostUnit]);
    });

  });

  describe('destroyService', function() {
    var utils, testUtils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    it('responds to service removal failure by alerting the user', function() {
      var notificationAdded;
      var APPNAME = 'the name of the application being removed';
      var evt = {
        err: true,
        applicationName: APPNAME
      };
      var service = ['service', 'mediawiki'];

      var db = {
        notifications: {
          add: function(notification) {
            // The notification has the required attributes.
            assert.isOk(notification.title);
            assert.isOk(notification.message);
            // The service name is mentioned in the error message.
            assert.notEqual(notification.message.indexOf(APPNAME, -1));
            assert.equal(notification.level, 'error');
            assert.deepEqual(notification.modelId, ['service', 'mediawiki']);
            notificationAdded = true;
          }
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
    });

    it('removes the relations when the service is destroyed', function() {
      var notificationAdded = false;
      var APPNAME = 'the name of the application being removed';
      var evt = {
        err: false,
        applicationName: APPNAME
      };
      var service = {
        get: function () {
          return [];
        }
      };

      var db = {
        notifications: {
          add: function(attrs) {
            // The notification has the required attributes.
            assert.equal(attrs.hasOwnProperty('title'), true,
                'Does not have a title');
            assert.equal(attrs.hasOwnProperty('message'), true,
                'Does not have a message');
            // The service name is mentioned in the error message.
            assert.notEqual(attrs.message.indexOf(APPNAME, -1));
            assert.equal(attrs.level, 'important');
            notificationAdded = true;
          }
        },
        relations: {
          remove: testUtils.makeStubFunction()
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
      // Check that relations were removed.
      assert.equal(db.relations.remove.calledOnce(), true,
          'Remove relations not called');
    });
  });

  describe('numToLetter', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.juju.views.utils;
        done();
      });
    });

    it('converts numbers to letters correctly', function() {
      // Map of numbers and output to check. This list isn't exhaustive
      // but checks some important milestones for common issues with this
      // technique.
      var mapping = {
        1: 'a',
        2: 'b',
        10: 'j',
        15: 'o',
        26: 'z',
        27: 'aa',
        28: 'ab',
        52: 'az',
        53: 'ba',
        54: 'bb',
        703: 'aaa',
        748: 'abt',
        1982: 'bxf'
      };
      Object.keys(mapping).forEach(function(key) {
        assert.equal(
          utils.numToLetter(key), mapping[key],
          key + ' did not properly convert to ' + mapping[key]);
      });
    });
  });

  describe('letterToNum', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.juju.views.utils;
        done();
      });
    });

    it('converts letters to numbers correctly', function() {
      // Map of numbers and output to check. This list isn't exhaustive
      // but checks some important milestones for common issues with this
      // technique.
      var mapping = {
        a: 1,
        b: 2,
        j: 10,
        o: 15,
        z: 26,
        aa: 27,
        ab: 28,
        az: 52,
        ba: 53,
        bb: 54,
        aaa: 703,
        abt: 748,
        bxf: 1982
      };
      Object.keys(mapping).forEach(function(key) {
        assert.equal(
          utils.letterToNum(key), mapping[key],
          key + ' did not properly convert to ' + mapping[key]);
      });
    });
  });

  describe('compareSemver', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('properly compares semver values', function() {
      var versions = [
        '1.2.3',
        '2.0-alpha-foo-bar',
        '4.11.6',
        '4.2.0',
        '1.5.19',
        '1.5.5',
        '1.5.5-foo',
        '3.7.1-alpha-foo',
        '4.1.3',
        '2.3.1',
        '10.5.5',
        '5.1',
        '11.3.0'
      ];

      assert.deepEqual(
        versions.sort(utils.compareSemver), [
          '1.2.3',
          '1.5.5',
          '1.5.5-foo',
          '1.5.19',
          '2.0-alpha-foo-bar',
          '2.3.1',
          '3.7.1-alpha-foo',
          '4.1.3',
          '4.2.0',
          '4.11.6',
          '5.1',
          '10.5.5',
          '11.3.0'
        ]);
    });

  });

  describe('linkify', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    var testLinks = [
      {
        text: 'google.com',
        expected: '<a href="google.com" target="_blank">google.com</a>'
      },
      {
        text: 'www.domain.com',
        expected: '<a href="www.domain.com" target="_blank">www.domain.com</a>'  // eslint-disable-line max-len
      },
      {
        text: 'thisisareallylongdomainnamewithunder62parts.co',
        expected: '<a href="thisisareallylongdomainnamewithunder62parts.co" target="_blank">thisisareallylongdomainnamewithunder62parts.co</a>'  // eslint-disable-line max-len
      },
      {
        text: 'node-1.www4.example.com.jp',
        expected: '<a href="node-1.www4.example.com.jp" target="_blank">node-1.www4.example.com.jp</a>'  // eslint-disable-line max-len
      },
      {
        text: 'http://domain.com',
        expected: '<a href="http://domain.com" target="_blank">http://domain.com</a>'  // eslint-disable-line max-len
      },
      {
        text: 'ftp://foo.1.example.com.uk',
        expected: '<a href="ftp://foo.1.example.com.uk" target="_blank">ftp://foo.1.example.com.uk</a>'  // eslint-disable-line max-len
      },
      {
        text: 'example.com/?foo=bar',
        expected: '<a href="example.com/?foo=bar" target="_blank">example.com/?foo=bar</a>'  // eslint-disable-line max-len
      },
      {
        text: 'example.com/foo/bar?baz=true&something=%20alsotrue',
        expected: '<a href="example.com/foo/bar?baz=true&amp;something=%20alsotrue" target="_blank">example.com/foo/bar?baz=true&amp;something=%20alsotrue</a>'  // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/index?foo=bar<script>alert(\'xss\')</script>',  // eslint-disable-line max-len
        expected: '<a href="http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt" target="_blank">http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt</a>;'  // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/foo"bar',
        expected: '<a href="http://example.com/foo&quot;bar" target="_blank">http://example.com/foo"bar</a>'  // eslint-disable-line max-len
      },
      {
        text: 'Hi there John.Bob',
        expected: 'Hi there John.Bob'
      }
    ];

    testLinks.forEach(function(test) {
      it('correctly linkifies: ' + test.text, function() {
        var actual = utils.linkify(test.text);
        assert.equal(actual, test.expected);
      });
    });
  });

  describe('switchModel', function() {
    var utils, testUtils, _showUncommittedConfirm, _hidePopup,
        models;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      _hidePopup = utils._hidePopup;
      utils._hidePopup = testUtils.makeStubFunction();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = testUtils.makeStubFunction();
      utils.changeState = testUtils.makeStubFunction();
      utils.set = testUtils.makeStubFunction();
      utils.showConnectingMask = testUtils.makeStubFunction();
      models = [{
        uuid: 'uuid1',
        user: 'spinach',
        password: 'hasselhoff',
        hostPorts: ['localhost:80', 'localhost:443']
      }];
    });

    afterEach(function() {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
    });

    it('can switch directly if there are no uncommitted changes', function() {
      var createSocketURL = testUtils.makeStubFunction('newaddress:80');
      var switchEnv = testUtils.makeStubFunction();
      var env = {
        get: testUtils.makeStubFunction({
          getCurrentChangeSet: testUtils.makeStubFunction({})
        })
      };
      var callback = testUtils.makeStubFunction();
      var _switchModel = utils._switchModel;
      utils._switchModel = testUtils.makeStubFunction();
      utils.switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);
      assert.deepEqual(utils._switchModel.callCount(), 1);
      var switchArgs = utils._switchModel.lastArguments();
      assert.deepEqual(switchArgs, [
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback]);
      utils._switchModel = _switchModel;
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      var createSocketURL = testUtils.makeStubFunction('newaddress:80');
      var switchEnv = testUtils.makeStubFunction();
      var env = {
        get: testUtils.makeStubFunction({
          getCurrentChangeSet: testUtils.makeStubFunction({change: 'a change'})
        })
      };
      var callback = testUtils.makeStubFunction();
      var _switchModel = utils._switchModel;
      utils._switchModel = testUtils.makeStubFunction();
      utils.switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);
      assert.deepEqual(utils._showUncommittedConfirm.callCount(), 1);
      assert.deepEqual(utils._switchModel.callCount(), 0);
      utils._switchModel = _switchModel;
    });

    it('can switch models', function() {
      var createSocketURL = testUtils.makeStubFunction('newaddress:80');
      var switchEnv = testUtils.makeStubFunction();
      var env = {set: testUtils.makeStubFunction()};
      var callback = testUtils.makeStubFunction();
      utils._switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);

      assert.deepEqual(utils._hidePopup.callCount(), 1);
      assert.deepEqual(createSocketURL.callCount(), 1);
      var socketArgs = createSocketURL.lastArguments();
      assert.deepEqual(socketArgs[0], models[0].uuid);
      assert.deepEqual(socketArgs[1], 'localhost');
      assert.deepEqual(socketArgs[2], '80');

      assert.deepEqual(switchEnv.callCount(), 1);
      var switchEnvArgs = switchEnv.lastArguments();
      assert.deepEqual(switchEnvArgs[0], 'newaddress:80');
      assert.deepEqual(switchEnvArgs[1], models[0].user);
      assert.deepEqual(switchEnvArgs[2], models[0].password);
      assert.deepEqual(switchEnvArgs[3], callback);

      assert.deepEqual(env.set.callCount(), 1);
      var envSet = env.set.lastArguments();
      assert.deepEqual(envSet[0], 'environmentName');
      assert.deepEqual(envSet[1], 'ev');

      assert.deepEqual(utils.showConnectingMask.callCount(), 1);
      assert.deepEqual(utils.changeState.callCount(), 1);
    });

    it('just disconnects if uuid is missing', function() {
      var createSocketURL = testUtils.makeStubFunction();
      var switchEnv = testUtils.makeStubFunction();
      var env = {set: testUtils.makeStubFunction()};
      utils._switchModel(createSocketURL, switchEnv, env, undefined, models);
      assert.deepEqual(createSocketURL.callCount(), 0);
      assert.deepEqual(switchEnv.callCount(), 1);
      assert.deepEqual(
        switchEnv.lastArguments(), [null, null, null, undefined]);
    });

    it('just disconnects if modelList is missing', function() {
      var createSocketURL = testUtils.makeStubFunction();
      var switchEnv = testUtils.makeStubFunction();
      var env = {set: testUtils.makeStubFunction()};
      utils._switchModel(createSocketURL, switchEnv, env, 'model1', undefined);
      assert.deepEqual(createSocketURL.callCount(), 0);
      assert.deepEqual(switchEnv.callCount(), 1);
      assert.deepEqual(
        switchEnv.lastArguments(), [null, null, null, undefined]);
    });
  });

  describe('showProfile', function() {
    var utils, testUtils, _showUncommittedConfirm, _hidePopup;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      _hidePopup = utils._hidePopup;
      utils._hidePopup = testUtils.makeStubFunction();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = testUtils.makeStubFunction();
    });

    afterEach(function() {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
    });

    it('can show the profile if there are no uncommitted changes', function() {
      var ecs = {
        getCurrentChangeSet: testUtils.makeStubFunction({})
      };
      var changeState = testUtils.makeStubFunction();
      utils.showProfile(ecs, changeState);
      assert.deepEqual(changeState.callCount(), 1);
      assert.deepEqual(utils._showUncommittedConfirm.callCount(), 0);
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      var ecs = {
        getCurrentChangeSet: testUtils.makeStubFunction({change: 'one'})
      };
      var changeState = testUtils.makeStubFunction();
      utils.showProfile(ecs, changeState);
      assert.deepEqual(changeState.callCount(), 0);
      assert.deepEqual(utils._showUncommittedConfirm.callCount(), 1);
    });

    it('can show a confirmation and clear changes', function() {
      var ecs = {
        clear: testUtils.makeStubFunction(),
        getCurrentChangeSet: testUtils.makeStubFunction({change: 'one'})
      };
      var changeState = testUtils.makeStubFunction();
      utils._showProfile(ecs, changeState, true);
      assert.deepEqual(changeState.callCount(), 1);
      assert.deepEqual(changeState.lastArguments()[0], {
        sectionB: {
          component: 'profile',
          metadata: null
        }
      });
      assert.deepEqual(utils._hidePopup.callCount(), 1);
      assert.deepEqual(ecs.clear.callCount(), 1);
    });
  });

  describe('listModels', function() {
    var utils, testUtils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    it('requests jem envs if jem is provided', function() {
      var env = {};
      var listModels = testUtils.makeStubFunction();
      var jem = {listModels: listModels};
      var user = {usernameDisplay: 'test owner'};
      var callback = testUtils.makeStubFunction();
      utils.set = testUtils.makeStubFunction();
      utils.listModels(env, jem, user, true, callback);
      assert.equal(listModels.callCount(), 1);
    });

    it('requests controller models if no jem is passed', function() {
      var listModelsWithInfo = testUtils.makeStubFunction();
      var env = {listModelsWithInfo: listModelsWithInfo};
      var user = {usernameDisplay: 'test owner'};
      var callback = testUtils.makeStubFunction();
      utils.set = testUtils.makeStubFunction();
      utils.listModels(env, null, user, true, callback);
      assert.equal(listModelsWithInfo.callCount(), 1);
      assert.equal(listModelsWithInfo.lastArguments().length, 1);
      assert.equal(typeof listModelsWithInfo.lastArguments()[0], 'function');
    });

    it('gets the default model for older versions of Juju', function() {
      var env = {
        findFacadeVersion: function(val) {
          if (val === 'ModelManager') {
            return null;
          } else if (val === 'EnvironmentManager') {
            return null;
          }
        },
        get: testUtils.makeStubFunction('default')
      };
      var jem = {};
      var user = {usernameDisplay: 'test owner'};
      var callback = testUtils.makeStubFunction();
      utils.set = testUtils.makeStubFunction();
      utils.listModels(env, jem, user, false, callback);
      assert.equal(callback.callCount(), 1);
      var callbackArgs = callback.lastArguments();
      assert.deepEqual(callbackArgs[1].models[0], {
        name: 'default',
        ownerTag: 'test owner',
        uuid: '',
        lastConnection: 'now'
      });
    });

    it('generates the correct export file name', function() {
      var envName = 'foobar';
      var date = new Date('October 13, 2014 11:13:00');
      var exportFilename = utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foobar-2014-10-13.yaml');

      var envName = 'foo-bar';
      var date = new Date('January 13, 2014 11:13:00');
      var exportFilename = utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foo-bar-2014-01-13.yaml');

      var envName = 'sandbox';
      var date = new Date('October 1, 2014 11:13:00');
      var exportFilename = utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'sandbox-2014-10-01.yaml');
    });
  });

  describe('createRelation', function() {
    var utils, testUtils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    // Necessary for the _cleanups to be attached.
    beforeEach(function() {});
    afterEach(function() {});

    it('properly creates a relation', function() {
      var relationId = 'pending-19984570$:db23212464$:db';
      var db = {
        relations: {
          add: testUtils.makeStubFunction(),
          remove: testUtils.makeStubFunction(),
          create: testUtils.makeStubFunction(),
          getById: testUtils.makeStubFunction(relationId)
        }
      };
      var env = {
        add_relation: testUtils.makeStubFunction()
      };
      var relations = [{
        service: '19984570$',
        name: 'db',
        type: 'mysql'
      }, {
        service: '23212464$',
        name: 'db',
        type: 'mysql'
      }];
      utils.createRelation(db, env, relations, testUtils.makeStubFunction());
      assert.equal(db.relations.add.callCount(), 1);
      var endpoints = [[
        '19984570$', {
          name: 'db', role: 'client'
        }],
        ['23212464$', {
          name: 'db', role: 'server'
        }]
      ];
      assert.deepEqual(db.relations.add.lastArguments()[0], {
        relation_id: relationId,
        'interface': 'db',
        endpoints: endpoints,
        pending: true,
        scope: 'global',
        display_name: 'pending'
      });
      assert.equal(env.add_relation.callCount(), 1);
      assert.deepEqual(env.add_relation.lastArguments()[0], endpoints[0]);
      assert.deepEqual(env.add_relation.lastArguments()[1], endpoints[1]);
      // Call the add_relation callback.
      env.add_relation.lastArguments()[2]({
        result: { id: 'foo', 'interface': 'bar', scope: 'global' }
      });
      // Callback method assertions.
      assert.equal(db.relations.remove.callCount(), 1);
      assert.equal(db.relations.remove.lastArguments()[0], relationId);
      assert.equal(db.relations.create.callCount(), 1);
      assert.deepEqual(db.relations.create.lastArguments()[0], {
        relation_id: 'foo',
        type: 'bar',
        endpoints: endpoints,
        pending: false,
        scope: 'global'
      });
    });
  });

  describe('getAvailableEndpoints', function() {
    var utils, testUtils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', 'juju-tests-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    // Necessary for the _cleanups to be attached.
    beforeEach(function() {});
    afterEach(function() {});

    function runGetAvailableEndpoints(vals, context) {
      var endpointsController = 'endpointsController';
      var db = 'db';
      var endpointData = {};
      endpointData[vals.applicationToId] = JSON.parse(vals.getEndpoints);
      var getEndpoints = testUtils.makeStubFunction(endpointData);
      var applicationFrom = vals.applicationFrom || {};
      var applicationTo = { get: function() { return vals.applicationToId; } };
      var dataStub = testUtils.makeStubMethod(utils,
        'getRelationDataForService',
        JSON.parse(vals.getRelationDataForService));
      context._cleanups.push(dataStub.reset);
      return utils.getAvailableEndpoints(
        endpointsController, db, getEndpoints, applicationFrom, applicationTo);
    }

    describe('works with...', function() {
      /* eslint-disable max-len */
      it('two services, one possible endpoint', function() {
        var relatableEndpoints = '[[{"service":"8784924$","name":"db","type":"mysql"},{"service":"38546607$","name":"db","type":"mysql"}]]';
        var availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '38546607$',
          getEndpoints: relatableEndpoints,
          getRelationDataForService: '[]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse(relatableEndpoints));
      });

      it('two services, one full endpoint', function() {
        var availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '38546607$',
          getEndpoints: '[[{"service":"8784924$","name":"db","type":"mysql"},{"service":"38546607$","name":"db","type":"mysql"}]]',
          getRelationDataForService: '[{"interface":"db","initialized":true,"destroyed":false,"clientId":"relation_10","id":"pending-8784924$:db38546607$:db","relation_id":"pending-8784924$:db38546607$:db","endpoints":[["8784924$",{"name":"db","role":"client"}],["38546607$",{"name":"db","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"38546607$","serviceName":"wordpress","role":"server","name":"db"},"far":{"service":"8784924$","serviceName":"mariadb","role":"client","name":"db"},"ident":"pending-8784924$:db38546607$:db","elementId":"e-pending_8784924__db38546607__db-1455252509"}]'
        }, this);
        assert.deepEqual(availableEndpoints, []);
      });

      it('two services, two possible and empty endpoints', function() {
        var relatableEndpoints = '[[{"service":"1485178$","name":"master","type":"mysql-oneway-replication"},{"service":"81820288$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"1485178$","name":"slave","type":"mysql-oneway-replication"},{"service":"81820288$","name":"master","type":"mysql-oneway-replication"}]]';
        var availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '1485178$',
          getEndpoints: relatableEndpoints,
          getRelationDataForService: '[]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse(relatableEndpoints));
      });

      it('two services, one possible and one full endpoint', function() {
        var availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '12648410$',
          getEndpoints: '[[{"service":"96799599$","name":"master","type":"mysql-oneway-replication"},{"service":"12648410$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"96799599$","name":"slave","type":"mysql-oneway-replication"},{"service":"12648410$","name":"master","type":"mysql-oneway-replication"}]]',
          getRelationDataForService: '[{"initialized":true,"destroyed":false,"clientId":"relation_72","id":"pending-96799599$12648410$slavemaster","relation_id":"pending-96799599$12648410$slavemaster","endpoints":[["96799599$",{"name":"slave","role":"server"}],["12648410$",{"name":"master","role":"client"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"12648410$","serviceName":"mysql","role":"client","name":"master"},"far":{"service":"96799599$","serviceName":"mysql-a","role":"server","name":"slave"},"ident":"pending-96799599$12648410$slavemaster","elementId":"e-pending_96799599_12648410_slavemaster-1611657570"}]'
        }, this);
        assert.deepEqual(availableEndpoints, JSON.parse('[[{"service":"96799599$","name":"master","type":"mysql-oneway-replication"},{"service":"12648410$","name":"slave","type":"mysql-oneway-replication"}]]'));
      });

      it('two services, no possible and two full endpoints', function() {
        var availableEndpoints = runGetAvailableEndpoints({
          applicationToId: '93057667$',
          getEndpoints: '[[{"service":"24412010$","name":"master","type":"mysql-oneway-replication"},{"service":"93057667$","name":"slave","type":"mysql-oneway-replication"}],[{"service":"24412010$","name":"slave","type":"mysql-oneway-replication"},{"service":"93057667$","name":"master","type":"mysql-oneway-replication"}]]',
          getRelationDataForService: '[{"interface":"master","initialized":true,"destroyed":false,"clientId":"relation_72","id":"pending-24412010$:master93057667$:slave","relation_id":"pending-24412010$:master93057667$:slave","endpoints":[["24412010$",{"name":"master","role":"client"}],["93057667$",{"name":"slave","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"93057667$","serviceName":"mysql","role":"server","name":"slave"},"far":{"service":"24412010$","serviceName":"mysql-a","role":"client","name":"master"},"ident":"pending-24412010$:master93057667$:slave","elementId":"e-pending_24412010__master93057667__slave-278287960"},{"interface":"slave","initialized":true,"destroyed":false,"clientId":"relation_73","id":"pending-24412010$:slave93057667$:master","relation_id":"pending-24412010$:slave93057667$:master","endpoints":[["24412010$",{"name":"slave","role":"client"}],["93057667$",{"name":"master","role":"server"}]],"pending":true,"scope":"global","display_name":"pending","near":{"service":"93057667$","serviceName":"mysql","role":"server","name":"master"},"far":{"service":"24412010$","serviceName":"mysql-a","role":"client","name":"slave"},"ident":"pending-24412010$:slave93057667$:master","elementId":"e-pending_24412010__slave93057667__master-1283641382"}]'
        }, this);
        assert.deepEqual(availableEndpoints, []);
      });
      /* eslint-enable max-len */
    });
  });

  describe('getRelatableApplications', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('properly returns relatable applications', function() {
      var service1 = 'service1';
      var db = {
        services: {
          getById: function (appName) { return service1; }
        }
      };
      var endpoints = {
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
        [service1], utils.getRelatableApplications(db, endpoints));
    });
  });

})();
