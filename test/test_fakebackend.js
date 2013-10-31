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

  // Helpers
  // Verify that an expected Error was found.
  var ERROR = function(errString, done) {
    return function(result) {
      assert.equal(errString, result.error);
      done();
    };
  };


  describe('FakeBackend.login', function() {
    var requires = ['node', 'juju-env-fakebackend'];
    var Y, environmentsModule, fakebackend;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        environmentsModule = Y.namespace('juju.environments');
        done();
      });
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('authenticates', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('admin', 'password'), true);
      assert.equal(fakebackend.get('authenticated'), true);
    });

    it('refuses to authenticate', function() {
      fakebackend = new environmentsModule.FakeBackend();
      assert.equal(fakebackend.get('authenticated'), false);
      assert.equal(fakebackend.login('admin', 'not my password'), false);
      assert.equal(fakebackend.get('authenticated'), false);
    });
  });

  describe('FakeBackend.deploy', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, result, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      result = undefined;
      callback = function(response) {
        result = response;
      };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error, 'Please log in.');
    });

    it('rejects poorly formed charm ids', function() {
      fakebackend.deploy('shazam!!!!!!', callback);
      assert.equal(result.error, 'Invalid charm id: shazam!!!!!!');
    });

    it('deploys a charm', function() {
      // Defaults service name to charm name; defaults unit count to 1.
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      assert.isUndefined(
          fakebackend.deploy('cs:precise/wordpress-15', callback),
          'Fakebackend deploy returned something when undefined was expected.');
      assert.isUndefined(
          result.error,
          'result.error was something when undefined was expected.');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'),
          'Fakebackend returned null when a charm was expected.');
      var service = fakebackend.db.services.getById('wordpress');
      assert.isObject(
          service,
          'Null returend when a service was expected.');
      assert.strictEqual(service, result.service);
      var attrs = service.getAttrs();
      // clientId varies.
      assert.isTrue(Y.Lang.isString(attrs.clientId));
      delete attrs.clientId;
      // when doing a deep equals on an object which contains a LazyModelList
      // call toArray() on it first else it will fail and it won't tell you why.
      // We make specific checks around unit/rel size counts outside of the
      // deepEquals check so we can make these easily testable.
      attrs.relations = [];
      attrs.units = [];
      // deepEquals compares order, even though that's not guaranteed by any
      // JS engine - if there are failures here check the order first.
      // Be aware of issues with mocha's diff reporting, see issues:
      // https://github.com/visionmedia/mocha/issues/905
      // https://github.com/visionmedia/mocha/issues/903
      var expectedAttrs = {
        initialized: true,
        destroyed: false,
        id: 'wordpress',
        displayName: 'wordpress',
        name: 'wordpress',
        aggregateRelationError: undefined,
        aggregateRelations: undefined,
        aggregated_status: undefined,
        charm: 'cs:precise/wordpress-15',
        config: {
          debug: 'no',
          engine: 'nginx',
          tuning: 'single',
          'wp-content': ''
        },
        annotations: {},
        charmChanged: false,
        constraints: {},
        constraintsStr: undefined,
        exposed: false,
        subordinate: false,
        icon: undefined,
        pending: false,
        placeFromGhostPosition: false,
        life: 'alive',
        units: [],
        relations: [],
        unit_count: undefined,
        upgrade_available: false,
        upgrade_to: undefined,
        packageName: 'wordpress'
      };

      // Assert some key properties
      assert.equal(attrs.id, expectedAttrs.id);
      assert.equal(attrs.charm, expectedAttrs.charm);
      assert.deepEqual(attrs.config, expectedAttrs.config);
      assert.deepEqual(attrs.annotations, expectedAttrs.annotations);
      var units = service.get('units').toArray();
      assert.lengthOf(units, 1);
      assert.lengthOf(result.units, 1);
      assert.strictEqual(units[0], result.units[0]);
      assert.equal(units[0].service, 'wordpress');
    });

    it('deploys a charm with constraints', function() {
      var options = {
        constraints: {
          cpu: 1,
          mem: '4G',
          arch: 'i386'
        }
      };
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      fakebackend.deploy('cs:precise/wordpress-15', callback, options);
      var service = fakebackend.db.services.getById('wordpress');
      assert.isObject(
          service,
          'Null returend when a service was expected.');
      assert.strictEqual(service, result.service);
      var attrs = service.getAttrs();
      var deployedConstraints = attrs.constraints;
      assert.deepEqual(
          options.constraints,
          deployedConstraints
      );
    });

    it('rejects names that duplicate an existing service', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(result.error);
      // The service name is provided explicitly.
      fakebackend.deploy(
          'cs:precise/haproxy-18', callback, {name: 'wordpress'});
      assert.equal(result.error,
          'A service with this name already exists (wordpress).');
      // The service name is derived from charm.
      result = undefined;
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error,
          'A service with this name already exists (wordpress).');
    });

    it('reuses already-loaded charms with the same explicit id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-15');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'));
      fakebackend.set('store', undefined);
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(result.error);
      assert.isObject(result.service);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('reuses already-loaded charms with the same id.', function() {
      fakebackend._loadCharm('cs:precise/wordpress-15');
      var charm = fakebackend.db.charms.getById('cs:precise/wordpress-15');
      assert.equal(fakebackend.db.charms.size(), 1);
      // The charm data shows that this is not a subordinate charm.  We will
      // change this in the db, to show that the db data is used within the
      // deploy code.
      assert.isFalse(charm.get('is_subordinate'));
      // The _set forces a change to a writeOnly attribute.
      charm._set('is_subordinate', true);
      fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 0});
      assert.isUndefined(result.error);
      assert.strictEqual(
          fakebackend.db.charms.getById('cs:precise/wordpress-15'), charm);
      assert.equal(fakebackend.db.charms.size(), 1);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-15');
      // This is the clearest indication that we used the db version, as
      // opposed to the api version, per the comments above.
      assert.isTrue(result.service.get('subordinate'));
    });

    it('accepts a config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15', callback, {config: {engine: 'apache'}});
      assert.deepEqual(result.service.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('deploys a charm with no config options', function(done) {
      // Charms that don't specify options would previously
      // not deploy properly as the code path expected them
      // to exist.
      fakebackend.promiseDeploy('cs:precise/puppetmaster-4')
      .then(function(result) {
            var service = fakebackend.db.services.getById('puppetmaster');
            assert.isObject(
                service,
                'Null returend when a service was expected.');
            assert.strictEqual(service, result.service);
            done();
          });
    });


    it('deploys multiple units.', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 3});
      var units = result.service.get('units').toArray();
      assert.lengthOf(units, 3);
      assert.lengthOf(result.units, 3);
      assert.deepEqual(units, result.units);
    });

    it('reports when the API is inaccessible.', function() {
      fakebackend.get('store').charm = function(path, callbacks, bindscope) {
        callbacks.failure({boo: 'hiss'});
      };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.equal(result.error, 'Error interacting with the charmworld API.');
    });

    it('honors the optional service name', function() {
      assert.isUndefined(
          fakebackend.deploy(
              'cs:precise/wordpress-15', callback, {name: 'kumquat'}));
      assert.equal(result.service.get('id'), 'kumquat');
    });

    it('prefers config YAML to config.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
          callback,
          {config: {funny: 'business'}, configYAML: 'engine: apache'});
      assert.deepEqual(result.service.get('config'), {
        debug: 'no',
        engine: 'apache',
        tuning: 'single',
        'wp-content': ''
      });
    });

    it('rejects a non-string configYAML', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback, {configYAML: {}});
      assert.equal(
          result.error, 'Developer error: configYAML is not a string.');
    });

    it('accepts a YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
          callback,
          {configYAML:
                Y.io('assets/mysql-config.yaml', {sync: true}).responseText});
      assert.isObject(result.service.get('config'));
      assert.equal(result.service.get('config').tuning, 'super bad');
    });

    it('rejects unparseable YAML config string.', function() {
      fakebackend.deploy(
          'cs:precise/wordpress-15',
          callback,
          {configYAML: 'auto_id: %n'});
      assert.equal(
          result.error,
          'Error parsing YAML.\n' +
          'JS-YAML: end of the stream or a document separator is expected ' +
          'at line 1, column 10:\n' +
          '    auto_id: %n\n' +
          '             ^');
    });
  });

  describe('FakeBackend.setCharm', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sets a charm.', function() {
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', false,
          callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
    });

    it('fails when the service does not exist', function() {
      fakebackend.setCharm('nope', 'nuh-uh', false, callback);
      assert.equal(result.error, 'Service "nope" not found.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('fails if a service is in error without force.', function() {
      fakebackend.db.services.getById('wordpress').get('units')
      .each(function(unit) {
            unit.agent_state = 'error';
          });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', false,
          callback);
      assert.equal(result.error, 'Cannot set charm on a service with units ' +
          'in error without the force flag.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-15');
    });

    it('succeeds if a service is in error with force.', function() {
      fakebackend.db.services.each(function(service) {
        service.get('units').each(function(unit) {
          unit.agent_state = 'error';
        });
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-8', true,
                           callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-8');
    });
  });

  describe('FakeBackend.expose', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.expose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('exposes a service', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid service', function() {
      var result = fakebackend.expose('Je ne suis pas un service');
      assert.equal(
          '"Je ne suis pas un service" is an invalid service name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if a service is already exposed', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      result = fakebackend.expose('wordpress');
      assert.isUndefined(result.error);
      assert.equal(
          'Service "wordpress" was already exposed.',
          result.warning);
    });
  });

  describe('FakeBackend.unexpose', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, result, callback, service;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.unexpose('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('unexposes a service', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.expose('wordpress');
      assert.isTrue(service.get('exposed'));
      result = fakebackend.unexpose('wordpress');
      assert.isFalse(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.isUndefined(result.warning);
    });

    it('errors on invalid service', function() {
      var result = fakebackend.unexpose('Je ne suis pas un service');
      assert.equal(
          '"Je ne suis pas un service" is an invalid service name.',
          result.error);
      assert.isUndefined(result.warning);
    });

    it('warns if a service is already unexposed', function() {
      assert.isFalse(service.get('exposed'));
      var result = fakebackend.unexpose('wordpress');
      assert.isFalse(service.get('exposed'));
      assert.isUndefined(result.error);
      assert.equal(
          'Service "wordpress" is not exposed.',
          result.warning);
    });
  });

  describe('FakeBackend deployer support', function() {
    var requires = ['node',
      'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
    });

    afterEach(function() {
      if (fakebackend) {
        fakebackend.destroy();
      }
    });

    it('should support YAML imports', function(done) {
      utils.promiseImport('data/wp-deployer.yaml')
        .then(function(resolve) {
            var result = resolve.result;
            fakebackend = resolve.backend;
            assert.equal(result.Error, undefined);
            assert.equal(result.DeploymentId, 1,
                         'deployment id incorrect');
            assert.isNotNull(fakebackend.db.services.getById('wordpress'),
                             'failed to import wordpress');
            assert.isNotNull(fakebackend.db.services.getById('mysql'),
                             'failed to import mysql');
            assert.equal(fakebackend.db.relations.size(), 1,
                         'failed to import relations');
            // Verify units created.
            assert.equal(fakebackend.db.services.getById('wordpress')
                         .get('units').size(), 2,
                         'Unit count wrong');

            // Verify config.
            var wordpress = fakebackend.db.services.getById('wordpress');
            var wordpressCharm = fakebackend.db.charms.getById(
                'cs:precise/wordpress-15');
            var mysql = fakebackend.db.services.getById('mysql');
            // This value is different from the default (nginx).
            assert.equal(wordpressCharm.get('options.engine.default'), 'nginx');
            assert.equal(wordpress.get('config.engine'), 'apache');
            // This value is the default, as provided by the charm.
            assert.equal(wordpress.get('config.tuning'), 'single');
            assert.isTrue(wordpress.get('exposed'));
            assert.isFalse(mysql.get('exposed'));

            // Constraints
            var constraints = mysql.get('constraints');
            assert.equal(constraints['cpu-power'], '2', 'wrong cpu power');
            assert.equal(constraints['cpu-cores'], '4', 'wrong cpu cores');
            done();
          }).then(undefined, done);
    });

    it('should provide status of imports', function(done) {
      utils.promiseImport('data/wp-deployer.yaml')
        .then(function(resolve) {
            fakebackend = resolve.backend;
            fakebackend.statusDeployer(
                function(status) {
                  assert.lengthOf(status.LastChanges, 1);
                  assert.equal(status.LastChanges[0].Status, 'completed');
                  assert.equal(status.LastChanges[0].DeploymentId, 1);
                  assert.isNumber(status.LastChanges[0].Timestamp);
                  done();
                });
          });
    });

    it('throws an error with more than one import target', function() {
      fakebackend = utils.makeFakeBackend();
      assert.throws(function() {
        fakebackend.importDeployer({a: {}, b: {}});
      }, 'Import target ambigious, aborting.');
    });

    it('detects service id collisions', function() {
      fakebackend = utils.makeFakeBackend();
      fakebackend.db.services.add({id: 'mysql', charm: 'cs:precise/mysql-26'});
      var data = {
        a: {services: {mysql: {
          charm: 'cs:precise/mysql-26',
          num_units: 2, options: {debug: false}}}}
      };
      assert.throws(function() {
        fakebackend.importDeployer(data);
      }, 'mysql is already present in the database.');
    });

    it('properly implements inheritence in target definitions', function(done) {
      fakebackend = utils.makeFakeBackend();
      var data = {
        a: {services: {mysql: {charm: 'cs:precise/mysql-26',
          num_units: 2, options: {debug: false}}}},
        b: {inherits: 'a', services: {mysql: {num_units: 5,
          options: {debug: true}}}},
        c: {inherits: 'b', services: {mysql: {num_units: 3 }}},
        d: {inherits: 'z', services: {mysql: {num_units: 3 }}}
      };


      // No 'z' available.
      assert.throws(function() {
        fakebackend.importDeployer(data, 'd');
      }, 'Unable to resolve bundle inheritence.');

      fakebackend.promiseImport(data, 'c')
        .then(function() {
            // Insure that we inherit the debug options from 'b'
            var mysql = fakebackend.db.services.getById('mysql');
            assert.isNotNull(mysql);
            var config = mysql.get('config');
            assert.equal(config['block-size'], 5);
            done();
          });
    });

    it('properly builds relations on import', function(done) {
      fakebackend = utils.makeFakeBackend();
      var data = {
        a: {
          services: {
            mysql: {
              charm: 'cs:precise/mysql-26',
              num_units: 2, options: {debug: false}},
            wordpress: {
              charm: 'cs:precise/wordpress-15',
              num_units: 1
            }},
          relations: [['mysql', 'wordpress']]
        }};

      fakebackend.promiseImport(data)
          .then(function() {
            var mysql = fakebackend.db.services.getById('mysql');
            var wordpress = fakebackend.db.services.getById('wordpress');
            assert.isNotNull(mysql);
            assert.isNotNull(wordpress);

            var rel = fakebackend.db.relations.item(0);
            var ep = rel.get('endpoints');
            // Validate we got the proper interfaces
            assert.equal(ep[0][0], 'wordpress');
            assert.equal(ep[0][1].name, 'db');
            assert.equal(ep[1][0], 'mysql');
            assert.equal(ep[1][1].name, 'db');
            assert.isFalse(rel.get('pending'));
            done();
          }).then(undefined, function(e) {done(e);});
    });

    it('should support finding charms through a search', function(done) {
      // Use import to import many charms and then resolve them with a few
      // different keys.
      var defaultSeries = 'precise';
      utils.promiseImport('data/blog.yaml', 'wordpress-prod')
        .then(function(resolve) {
            var db = resolve.backend.db;
            assert.isNotNull(db.charms.find('wordpress', defaultSeries));
            assert.isNotNull(db.charms.find('precise/wordpress',
                                            defaultSeries));
            assert.isNotNull(db.charms.find('precise/wordpress'));
            assert.isNotNull(db.charms.find('cs:precise/wordpress'));
            assert.isNotNull(db.charms.find('cs:precise/wordpress-999'));
            // Can't find this w/o a series
            assert.isNull(db.charms.find('wordpress'));
            // Find fails on missing items as well.
            assert.isNull(db.charms.find('foo'));
            assert.isNull(db.charms.find('foo', defaultSeries));
            done();
          }).then(undefined, done);
    });
  });

  describe('FakeBackend.uniformOperations', function() {
    var requires = ['node',
      'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    describe('FakeBackend.resolved', function(done) {

      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Please log in.');
      });

      it('reports invalid units', function() {
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Unit "wordpress/0" does not exist.');
      });

      it('reports invalid relations', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function(result) {
          result = fakebackend.resolved('wordpress/0', 'db');
          assert.equal(result.error, 'Relation db not found for wordpress/0');
          done();
        });
      });
    });

    describe('FakeBackend.getCharm', function() {

      it('rejects unauthenticated calls', function(done) {
        fakebackend.logout();
        fakebackend.getCharm(
            'cs:precise/wordpress-15', ERROR('Please log in.', done));
      });

      it('disallows malformed charm names', function(done) {
        fakebackend.getCharm('^invalid', ERROR('Invalid charm id: ^invalid', done));
      });

      it('successfully returns valid charms', function(done) {
        fakebackend.getCharm('cs:precise/wordpress-15', function(data) {
          assert.equal(data.result.name, 'wordpress');
          done();
        });
      });

      it('loads subordinate charms properly', function(done) {
        fakebackend.getCharm('cs:precise/puppet-5', function(data) {
          assert.equal(data.result.name, 'puppet');
          assert.isTrue(data.result.is_subordinate);
          done();
        });
      });
    });

    describe('FakeBackend.getService', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.getService('cs:precise/wordpress-15');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.getService('^invalid');
        assert.equal(result.error, 'Invalid service id: ^invalid');
      });

      it('successfully returns a valid service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.equal(service.name, 'wordpress');
          done();
        });
      });
    });

    describe('FakeBackend.setConfig', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.setConfig('wordpress', {'foo': 'bar'});
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.setConfig('scaling', {});
        assert.equal(result.error, 'Service \"scaling\" does not exist.');
      });

      it('successfully returns a valid service configuration', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConfig('wordpress', {
            'blog-title': 'Silence is Golden.'});
          var service = fakebackend.getService('wordpress').result;
          var config = service.config;
          assert.equal(config['blog-title'], 'Silence is Golden.');
          done();
        });
      });
    });

    describe('FakeBackend.setConstraints', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.setConstraints('wordpress', {'cpu': '4'});
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.setConstraints('scaling', {});
        assert.equal(result.error, 'Service \"scaling\" does not exist.');
      });

      it('successfully returns a valid constraints', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints('wordpress', {'cpu': '4'});
          var service = fakebackend.getService('wordpress').result;
          var constraints = service.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('successfully returns a valid constraints as array', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.setConstraints('wordpress', ['cpu=4']);
          var service = fakebackend.getService('wordpress').result;
          var constraints = service.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });
    });

    describe('FakeBackend.destroyService', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.destroyService('dummy');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.destroyService('missing');
        assert.equal('Invalid service id: missing', result.error);
      });

      it('successfully destroys a valid service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          // Ensure the service can no longer be retrieved.
          result = fakebackend.getService('wordpress');
          assert.equal(result.error, 'Invalid service id: wordpress');
          done();
        });
      });

      it('removes relations when destroying a service', function(done) {
        // Add a couple of services and hook up relations.
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          fakebackend.deploy('cs:precise/mysql-26', function() {
            var result = fakebackend.addRelation('wordpress:db', 'mysql:db');
            assert.isUndefined(result.error);
            var mysql = fakebackend.getService('mysql').result;
            assert.lengthOf(mysql.rels, 1);
            // Now destroy one of the services.
            result = fakebackend.destroyService('wordpress').result;
            assert.isUndefined(result.error);
            assert.equal('wordpress', result);
            // Ensure the destroyed service can no longer be retrieved.
            result = fakebackend.getService('wordpress');
            assert.equal(result.error, 'Invalid service id: wordpress');
            // But the other one exists and has no relations.
            mysql = fakebackend.getService('mysql').result;
            assert.lengthOf(mysql.rels, 0);
            done();
          });
        });
      });

      it('removes units when destroying a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function(data) {
          var service = fakebackend.db.services.getById('wordpress');
          var units = service.get('units').toArray();
          assert.lengthOf(units, 1);
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          units = service.get('units').toArray();
          assert.lengthOf(units, 0);
          done();
        });
      });

    });

    describe('FakeBackend.Annotations', function() {
      it('must require authentication', function() {
        fakebackend.logout();
        var reply = fakebackend.getAnnotations('env');
        assert.equal(reply.error, 'Please log in.');
      });

      it('must get annotations from a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.deepEqual(service.annotations, {});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });
      });

      it('must update annotations to a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Apply an update and verify that merge happened.
          fakebackend.updateAnnotations('wordpress', {'gone': 'too far'});
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'too far');
          done();
        });
      });

      it('must update annotations on a unit', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.updateAnnotations('wordpress/0',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress/0').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Apply an update and verify that merge happened.
          fakebackend.updateAnnotations('wordpress/0', {'gone': 'too far'});
          anno = fakebackend.getAnnotations('wordpress/0').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'too far');
          done();
        });
      });

      it('must update annotations on the environment', function() {
        fakebackend.updateAnnotations('env',
                                      {'foo': 'bar', 'gone': 'away'});
        var anno = fakebackend.getAnnotations('env').result;
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'away');

        // Apply an update and verify that merge happened.
        fakebackend.updateAnnotations('env', {'gone': 'too far'});
        anno = fakebackend.getAnnotations('env').result;
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'too far');

        // Verify the annotations on the model directly.
        anno = fakebackend.db.environment.get('annotations');
        assert.equal(anno.foo, 'bar');
        assert.equal(anno.gone, 'too far');

        // Verify changes make it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         fakebackend.db.environment);
      });

      it('must remove annotations from a service', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, 'away');

          // Remove an annotation and verify that happened.
          fakebackend.removeAnnotations('wordpress', ['gone']);
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno.foo, 'bar');
          assert.equal(anno.gone, undefined);

          // Finally remove annotations with falsey keys.
          fakebackend.removeAnnotations('wordpress');
          anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });

      });
    });
  });

  describe('FakeBackend.addUnit', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addUnit('wordpress');
      assert.equal(result.error, 'Please log in.');
    });

    it('returns an error for an invalid number of units', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('wordpress', 'goyesca').error,
          'Invalid number of units [goyesca] for service: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', 0).error,
          'Invalid number of units [0] for service: wordpress');
      assert.equal(
          fakebackend.addUnit('wordpress', -1).error,
          'Invalid number of units [-1] for service: wordpress');
    });

    it('returns error for invalid number of subordinate units', function() {
      fakebackend.deploy('cs:puppet', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('puppet', 'goyesca').error,
          'Invalid number of units [goyesca] for service: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', 1).error,
          'Invalid number of units [1] for service: puppet');
      assert.equal(
          fakebackend.addUnit('puppet', -1).error,
          'Invalid number of units [-1] for service: puppet');
      // It also ignores empty requests
      assert.isUndefined(
          fakebackend.addUnit('puppet', 0).error);
      assert.isUndefined(
          fakebackend.addUnit('puppet').error);
    });

    it('returns an error if the service does not exist.', function() {
      assert.equal(
          fakebackend.addUnit('foo').error,
          'Service "foo" does not exist.');
    });

    it('defaults to adding just one unit', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress');
      assert.lengthOf(result.units, 1);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 2);
      // Units are simple objects, not models.
      assert.equal(result.units[0].id, 'wordpress/1');
      assert.equal(result.units[0].agent_state, 'started');
      // Creating units also created/assigned associated machines.  Like units,
      // these are simple objects, not models.
      assert.lengthOf(result.machines, 1);
      assert.equal(
          result.machines[0].machine_id, result.units[0].machine);
      assert.isString(result.machines[0].machine_id);
      assert.isString(result.machines[0].public_address);
      assert.match(
          result.machines[0].public_address, /^[^.]+\.example\.com$/);
      assert.equal(result.machines[0].agent_state, 'running');
    });

    it('deploys subordinates without adding units', function() {
      fakebackend.deploy('cs:precise/puppet-5', callback);
      assert.equal(deployResult.service.get('name'), 'puppet');
      assert.equal(deployResult.units.length, 0);
      assert.equal(deployResult.service.get('units').size(), 0);
    });

    it('adds multiple units', function() {
      fakebackend.deploy('cs:precise/wordpress-15', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          deployResult.service.get('units').toArray(), 1);
      var result = fakebackend.addUnit('wordpress', 5);
      assert.lengthOf(result.units, 5);
      assert.lengthOf(deployResult.service.get('units').toArray(), 6);
      assert.equal(result.units[0].id, 'wordpress/1');
      assert.equal(result.units[1].id, 'wordpress/2');
      assert.equal(result.units[2].id, 'wordpress/3');
      assert.equal(result.units[3].id, 'wordpress/4');
      assert.equal(result.units[4].id, 'wordpress/5');
      assert.lengthOf(result.machines, 5);
    });

  });

  describe('FakeBackend.next*', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    describe('FakeBackend.nextChanges', function() {
      it('rejects unauthenticated calls.', function() {
        fakebackend.logout();
        var result = fakebackend.nextChanges();
        assert.equal(result.error, 'Please log in.');
      });

      it('reports no changes initially.', function() {
        assert.isNull(fakebackend.nextChanges());
      });

      it('reports a call to addUnit correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-15', callback);
        assert.isUndefined(deployResult.error);
        assert.isObject(fakebackend.nextChanges());
        var result = fakebackend.addUnit('wordpress');
        assert.lengthOf(result.units, 1);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 0);
        assert.lengthOf(Y.Object.keys(changes.units), 1);
        assert.lengthOf(Y.Object.keys(changes.machines), 1);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
        assert.deepEqual(
            changes.units['wordpress/1'], [result.units[0], true]);
        assert.deepEqual(
            changes.machines[result.machines[0].machine_id],
            [result.machines[0], true]);
      });

      it('reports a deploy correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-15', callback);
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 1);
        assert.deepEqual(
            changes.services.wordpress, [deployResult.service, true]);
        assert.lengthOf(Y.Object.keys(changes.units), 1);
        assert.deepEqual(
            changes.units['wordpress/0'], [deployResult.units[0], true]);
        assert.lengthOf(Y.Object.keys(changes.machines), 1);
        assert.deepEqual(
            changes.machines[deployResult.machines[0].machine_id],
            [deployResult.machines[0], true]);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
      });

      it('reports a deploy of multiple units correctly.', function() {
        fakebackend.deploy('cs:precise/wordpress-15', callback, {unitCount: 5});
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 1);
        assert.lengthOf(Y.Object.keys(changes.units), 5);
        assert.lengthOf(Y.Object.keys(changes.machines), 5);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
      });

      it('reports no changes when no changes have occurred.',
          function() {
            fakebackend.deploy('cs:precise/wordpress-15', callback);
            assert.isUndefined(deployResult.error);
            assert.isObject(fakebackend.nextChanges());
            assert.isNull(fakebackend.nextChanges());
          }
      );
    });

    describe('FakeBackend.nextAnnotations', function() {
      it('rejects unauthenticated calls.', function() {
        fakebackend.logout();
        var result = fakebackend.nextAnnotations();
        assert.equal(result.error, 'Please log in.');
      });

      it('reports no changes initially.', function() {
        assert.isNull(fakebackend.nextAnnotations());
      });

      it('reports service changes correctly', function(done) {
        fakebackend.deploy('cs:precise/wordpress-15', function() {
          fakebackend.updateAnnotations('wordpress',
                                        {'foo': 'bar', 'gone': 'away'});

          var changes = fakebackend.nextAnnotations();
          assert.deepEqual(changes.services.wordpress,
                           fakebackend.db.services.getById('wordpress'));
          done();
        });
      });

      it('reports env changes correctly', function() {
        fakebackend.updateAnnotations('env',
                                      {'foo': 'bar', 'gone': 'away'});

        // Verify changes name it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         fakebackend.db.environment);
      });
    });
  });

  describe('FakeBackend.addRelation', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createRelation(charms, relation, mock, done) {
      fakebackend.promiseDeploy(charms[0])
      .then(fakebackend.promiseDeploy(charms[1]))
      .then(function() {
            relation.push(true);
            var result = fakebackend.addRelation.apply(fakebackend, relation);
            assert.equal(result.error, undefined);
            assert.equal(result.relationId, 'relation-0');
            assert.equal(typeof result.relation, 'object');
            // Check those elements we care about.
            assert.equal(result.endpoints[0][0], mock.endpoints[0][0]);
            assert.equal(result.endpoints[0][1].name,
                         mock.endpoints[0][1].name);
            assert.equal(result.endpoints[1][0], mock.endpoints[1][0]);
            assert.equal(result.endpoints[1][1].name,
                         mock.endpoints[1][1].name);
            assert.equal(result.scope, mock.scope);
            assert.equal(result.type, mock.type);
            done();
          }).then(undefined, done);
    }

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Please log in.');
    });

    it('requires two string endpoint names', function() {
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Two string endpoint names' +
              ' required to establish a relation');
    });

    it('requires relationships to be explicit if more than one ' +
        'shared interface', function(done) {
          fakebackend.deploy('cs:mediawiki', function() {
            fakebackend.deploy('cs:mysql', function() {
              var result = fakebackend.addRelation('mediawiki', 'mysql');
              assert.equal(result.error,
                  'Ambiguous relationship is not allowed.');
              done();
            });
          });
        });

    it('throws an error if there are no shared interfaces', function(done) {
      fakebackend.deploy('cs:hadoop', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('hadoop', 'mysql');
          assert.equal(result.error, 'Specified relation is unavailable.');
          done();
        });
      });
    });

    it('requires the specified interfaces to match', function(done) {
      fakebackend.deploy('cs:precise/wordpress-15', function() {
        fakebackend.deploy('cs:precise/haproxy-18', function() {
          var result = fakebackend.addRelation(
              'wordpress:cache', 'haproxy:munin');
          assert.equal(result.error, 'Specified relation is unavailable.');
          done();
        });
      });
    });

    it('can create a relation with a explicit interfaces', function(done) {
      createRelation(
          ['cs:wordpress', 'cs:mysql'],
          ['wordpress:db', 'mysql:db'],
          { type: 'mysql', scope: 'global',
            endpoints:
                [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
          done);
    });

    it('can create a relation with double explicit interface (reverse)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['mysql:db', 'wordpress:db'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with a double explicit interface and a ' +
        'subordinate charm', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress:juju-info', 'puppet:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a double explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet:juju-info', 'wordpress:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}],
                     ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with a single explicit interface (reverse)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['mysql', 'wordpress:db'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with a single explicit interface (other)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress', 'mysql:db'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with a single explicit interface (other,' +
        ' reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['mysql:db', 'wordpress'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a' +
        ' subordinate charm', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet:juju-info', 'wordpress'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (other)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress', 'puppet:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet', 'wordpress:juju-info'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with a single explicit interface and a ' +
        'subordinate charm (reverse)', function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress:juju-info', 'puppet'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with an inferred interface', function(done) {
      createRelation(
          ['cs:wordpress', 'cs:mysql'],
          ['wordpress', 'mysql'],
          { type: 'mysql', scope: 'global',
            endpoints:
                [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
          done);
    });

    it('can create a relation with an inferred interface (reverse)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['mysql', 'wordpress'],
              { type: 'mysql', scope: 'global',
                endpoints:
                    [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
              done);
        });

    it('can create a relation with an inferred subordinate charm',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['wordpress', 'puppet'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

    it('can create a relation with an inferred subordinate charm (reverse)',
        function(done) {
          createRelation(
              ['cs:wordpress', 'cs:puppet'],
              ['puppet', 'wordpress'],
              { type: 'juju-info', scope: 'container',
                endpoints:
                    [['puppet', {name: 'juju-info'}],
                      ['wordpress', {name: 'juju-info'}]]},
              done);
        });

  });

  describe('FakeBackend.removeRelation', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      fakebackend = utils.makeFakeBackend();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createAndRemoveRelation(charms, relation,
        removeRelation, mock, done) {
      fakebackend.deploy(charms[0], function() {
        fakebackend.deploy(charms[1], function() {
          fakebackend.addRelation.apply(fakebackend, relation);
          var result = fakebackend.removeRelation.apply(
              fakebackend, removeRelation);

          assert.equal(result.error, mock.error);
          assert.equal(typeof result, 'object');
          done();
        });
      });
    }

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Please log in.');
    });

    it('requires two string endpoint names', function() {
      var result = fakebackend.addRelation();
      assert.equal(result.error, 'Two string endpoint names' +
              ' required to establish a relation');
    });

    it('removes a relation when supplied with two string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql:db'],
              ['wordpress:db', 'mysql:db'],
              {},
              done);
        });

    it('removes a relation when supplied with two string endpoints (reverse)',
        function(done) {
          createAndRemoveRelation(
              ['cs:wordpress', 'cs:mysql'],
              ['wordpress:db', 'mysql:db'],
              ['mysql:db', 'wordpress:db'],
              {},
              done);
        });

    it('removes a relation when supplied with two different string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:mediawiki', 'cs:haproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              {},
              done);
        });

    it('removes a relation when supplied with two different string endpoints',
        function(done) {
          createAndRemoveRelation(
              ['cs:mediawiki', 'cs:haproxy'],
              ['mediawiki:website', 'haproxy:reverseproxy'],
              ['haproxy:reverseproxy', 'mediawiki:website'],
              {},
              done);
        });

    it('throws an error if the charms do not exist', function(done) {
      createAndRemoveRelation(
          ['cs:mediawiki', 'cs:haproxy'],
          ['mediawiki:website', 'haproxy:reverseproxy'],
          ['wordpress:db', 'mysql:db'],
          {error: 'Charm not loaded.'},
          done);
    });

    it('throws an error if the relationship does not exist', function(done) {
      createAndRemoveRelation(
          ['cs:wordpress', 'cs:mysql'],
          ['wordpress:db', 'mysql:db'],
          ['wordpress:bar', 'mysql:baz'],
          {error: 'Relationship does not exist'},
          done);
    });

  });

})();
