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
      fakebackend = utils.makeFakeBackendWithCharmStore();
      result = undefined;
      callback = function(response) { result = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('rejects unauthenticated calls', function() {
      fakebackend.logout();
      fakebackend.deploy('cs:wordpress', callback);
      assert.equal(result.error, 'Please log in.');
    });

    it('rejects poorly formed charm ids', function() {
      fakebackend.deploy('shazam!!!!!!', callback);
      assert.equal(result.error, 'Invalid charm id.');
    });

    it('deploys a charm', function() {
      // Defaults service name to charm name; defaults unit count to 1.
      assert.isNull(
          fakebackend.db.charms.getById('cs:precise/wordpress-10'));
      assert.isUndefined(fakebackend.deploy('cs:wordpress', callback));
      assert.isUndefined(result.error);
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-10'));
      var service = fakebackend.db.services.getById('wordpress');
      assert.isObject(service);
      assert.strictEqual(service, result.service);
      var attrs = service.getAttrs();
      // clientId varies.
      assert.isTrue(Y.Lang.isString(attrs.clientId));
      delete attrs.clientId;
      assert.deepEqual(attrs, {
        annotations: {},
        aggregated_status: undefined,
        charm: 'cs:precise/wordpress-10',
        config: undefined,
        constraints: {},
        constraintsStr: undefined,
        destroyed: false,
        displayName: 'wordpress',
        exposed: false,
        id: 'wordpress',
        initialized: true,
        name: 'wordpress',
        pending: false,
        life: 'alive',
        subordinate: false,
        unit_count: undefined
      });
      var units = fakebackend.db.units.get_units_for_service(service);
      assert.lengthOf(units, 1);
      assert.lengthOf(result.units, 1);
      assert.strictEqual(units[0], result.units[0]);
      assert.equal(units[0].service, 'wordpress');
    });

    it('rejects names that duplicate an existing service', function() {
      fakebackend.deploy('cs:wordpress', callback);
      assert.isUndefined(result.error);
      // The service name is provided explicitly.
      fakebackend.deploy('cs:haproxy', callback, {name: 'wordpress'});
      assert.equal(result.error, 'A service with this name already exists.');
      // The service name is derived from charm.
      result = undefined;
      fakebackend.deploy('cs:wordpress', callback);
      assert.equal(result.error, 'A service with this name already exists.');
    });

    it('reuses already-loaded charms with the same explicit id.', function() {
      fakebackend._loadCharm('cs:wordpress');
      assert.isObject(
          fakebackend.db.charms.getById('cs:precise/wordpress-10'));
      // Eliminate the charmStore to show we reuse the pre-loaded charm.
      fakebackend.set('charmStore', undefined);
      fakebackend.deploy('cs:precise/wordpress-10', callback);
      assert.isUndefined(result.error);
      assert.isObject(result.service);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-10');
    });

    it('reuses already-loaded charms with the same id.', function() {
      fakebackend._loadCharm('cs:wordpress');
      var charm = fakebackend.db.charms.getById('cs:precise/wordpress-10');
      assert.equal(fakebackend.db.charms.size(), 1);
      // The charm data shows that this is not a subordinate charm.  We will
      // change this in the db, to show that the db data is used within the
      // deploy code.
      assert.isUndefined(charm.get('is_subordinate'));
      // The _set forces a change to a writeOnly attribute.
      charm._set('is_subordinate', true);
      fakebackend.deploy('cs:wordpress', callback);
      assert.isUndefined(result.error);
      assert.strictEqual(
          fakebackend.db.charms.getById('cs:precise/wordpress-10'), charm);
      assert.equal(fakebackend.db.charms.size(), 1);
      assert.equal(result.service.get('charm'), 'cs:precise/wordpress-10');
      // This is the clearest indication that we used the db version, as
      // opposed to the charmStore version, per the comments above.
      assert.isTrue(result.service.get('subordinate'));
    });

    it('accepts a config.', function() {
      fakebackend.deploy(
          'cs:wordpress', callback, {config: {funny: 'business'}});
      assert.deepEqual(result.service.get('config'), {funny: 'business'});
    });

    it('deploys multiple units.', function() {
      fakebackend.deploy('cs:wordpress', callback, {unitCount: 3});
      var units = fakebackend.db.units.get_units_for_service(result.service);
      assert.lengthOf(units, 3);
      assert.lengthOf(result.units, 3);
      assert.deepEqual(units, result.units);
    });

    it('reports when the charm store is inaccessible.', function() {
      fakebackend.get('charmStore').loadByPath = function(path, options) {
        options.failure({boo: 'hiss'});
      };
      fakebackend.deploy('cs:wordpress', callback);
      assert.equal(result.error, 'Error interacting with Charm store.');
    });

    it('honors the optional service name', function() {
      assert.isUndefined(
          fakebackend.deploy('cs:wordpress', callback, {name: 'kumquat'}));
      assert.equal(result.service.get('id'), 'kumquat');
    });

    it('prefers config YAML to config.', function() {
      fakebackend.deploy(
          'cs:wordpress',
          callback,
          {config: {funny: 'business'}, configYAML: 'funny: girl'});
      assert.deepEqual(result.service.get('config'), {funny: 'girl'});
    });

    it('rejects a non-string configYAML', function() {
      fakebackend.deploy('cs:wordpress', callback, {configYAML: {}});
      assert.equal(
          result.error, 'Developer error: configYAML is not a string.');
    });

    it('accepts a YAML config string.', function() {
      fakebackend.deploy(
          'cs:wordpress',
          callback,
          {configYAML:
                Y.io('assets/mysql-config.yaml', {sync: true}).responseText});
      assert.isObject(result.service.get('config'));
      assert.equal(result.service.get('config')['tuning-level'], 'super bad');
    });

    it('rejects unparseable YAML config string.', function() {
      fakebackend.deploy(
          'cs:wordpress',
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-10', callback);
      service = fakebackend.db.services.getById('wordpress');
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    it('sets a charm.', function() {
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-6', false,
          callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-6');
    });

    it('fails when the service does not exist', function() {
      fakebackend.setCharm('nope', 'nuh-uh', false, callback);
      assert.equal(result.error, 'Service "nope" not found.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-10');
    });

    it('fails if a service is in error without force.', function() {
      fakebackend.db.units.each(function(unit) {
        unit.agent_state = 'error';
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-6', false,
          callback);
      assert.equal(result.error, 'Cannot set charm on a service with units ' +
          'in error without the force flag.');
      assert.equal(service.get('charm'), 'cs:precise/wordpress-10');
    });

    it('succeeds if a service is in error with force.', function() {
      fakebackend.db.units.each(function(unit) {
        unit.agent_state = 'error';
      });
      fakebackend.setCharm('wordpress', 'cs:precise/mediawiki-6', true,
          callback);
      assert.isUndefined(result.error);
      assert.equal(service.get('charm'), 'cs:precise/mediawiki-6');
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-10', callback);
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
      result = undefined;
      callback = function(response) { result = response; };
      fakebackend.deploy('cs:precise/wordpress-10', callback);
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createRelation(charms, relation, mock, done, callback) {
      fakebackend.deploy(charms[0], function() {
        fakebackend.deploy(charms[1], function() {
          var result = fakebackend.addRelation.apply(fakebackend, relation);
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, 'relation-0');
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          callback(result, done);
        });
      });
    }

    describe('FakeBackend.exportEnvironment', function(done) {

      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.exportEnvironment();
        assert.equal(result.error, 'Please log in.');
      });

      it('successfully exports env data', function(done) {
        createRelation(
            ['cs:wordpress', 'cs:mysql'],
            ['wordpress:db', 'mysql:db'],
            { type: 'mysql', scope: 'global',
              endpoints:
                  [['wordpress', {name: 'db'}], ['mysql', {name: 'db'}]]},
            done,
            function(result, done) {
              var data = fakebackend.exportEnvironment().result;
              assert.equal(data.meta.exportFormat, 1.0);
              assert.equal(data.services[0].name, 'wordpress');
              assert.equal(data.relations[0].display_name, 'db');
              done();
            });
      });
    });

    describe('FakeBackend.importEnvironment', function(done) {
      it('rejects unauthenticated calls', function(done) {
        fakebackend.logout();
        var result = fakebackend.importEnvironment('', function(result) {
          assert.equal(result.error, 'Please log in.');
          done();
        });
      });

      it('successfully imports v0 data', function(done) {
        var fixture = utils.loadFixture('data/sample-improv.json', false);
        fakebackend.importEnvironment(fixture, function(result) {
          assert.isTrue(result.result);
          assert.isNotNull(fakebackend.db.services.getById('wordpress'));

          // Verify that the charms have been loaded.
          assert.isNotNull(fakebackend.db.charms.getById(
              'cs:precise/wordpress-10'));
          done();
        });
      });

      it('successfully imports v1 data', function(done) {
        var fixture = utils.loadFixture('data/sample-fakebackend.json', false);
        fakebackend.importEnvironment(fixture, function(result) {
          assert.isTrue(result.result);
          assert.isNotNull(fakebackend.db.services.getById('wordpress'));
          done();
        });
      });
    });


    describe('FakeBackend.resolved', function(done) {

      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Please log in.');
      });

      it('reports invalid untis', function() {
        var result = fakebackend.resolved('wordpress/0');
        assert.equal(result.error, 'Unit "wordpress/0" does not exist.');
      });

      it('reports invalid relations', function(done) {
        fakebackend.deploy('cs:wordpress', function() {
          var result = fakebackend.resolved('wordpress/0', 'db');
          assert.equal(result.error, 'Relation db not found for wordpress/0');
          done();
        });
      });
    });

    describe('FakeBackend.getCharm', function() {

      before(function() {
        // A global variable required for testing.
        window.flags = {};
      });

      after(function() {
        delete window.flags;
      });

      it('rejects unauthenticated calls', function(done) {
        fakebackend.logout();
        fakebackend.getCharm('cs:wordpress', ERROR('Please log in.', done));
      });

      it('disallows malformed charm names', function(done) {
        fakebackend.getCharm('^invalid', ERROR('Invalid charm id.', done));
      });

      it('successfully returns valid charms', function(done) {
        fakebackend.getCharm('cs:wordpress', function(data) {
          assert.equal(data.result.name, 'wordpress');
          done();
        });
      });

      it('loads subordinate charms properly', function(done) {
        fakebackend.getCharm('cs:puppet', function(data) {
          assert.equal(data.result.name, 'puppet');
          assert.isTrue(data.result.is_subordinate);
          done();
        });
      });
    });

    describe('FakeBackend.getService', function() {
      it('rejects unauthenticated calls', function() {
        fakebackend.logout();
        var result = fakebackend.getService('cs:wordpress');
        assert.equal(result.error, 'Please log in.');
      });

      it('returns an error for a missing service', function() {
        var result = fakebackend.getService('^invalid');
        assert.equal(result.error, 'Invalid service id.');
      });

      it('successfully returns a valid service', function(done) {
        fakebackend.deploy('cs:wordpress', function() {
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
        fakebackend.deploy('cs:wordpress', function() {
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
        fakebackend.deploy('cs:wordpress', function() {
          fakebackend.setConstraints('wordpress', {'cpu': '4'});
          var service = fakebackend.getService('wordpress').result;
          var constraints = service.constraints;
          assert.equal(constraints.cpu, '4');
          assert.equal(constraints.mem, undefined);
          done();
        });
      });

      it('successfully returns a valid constraints as array', function(done) {
        fakebackend.deploy('cs:wordpress', function() {
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
        assert.equal('Invalid service id.', result.error);
      });

      it('successfully destroys a valid service', function(done) {
        fakebackend.deploy('cs:wordpress', function(data) {
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          // Ensure the service can no longer be retrieved.
          result = fakebackend.getService('wordpress');
          assert.equal(result.error, 'Invalid service id.');
          done();
        });
      });

      it('removes relations when destroying a service', function(done) {
        // Add a couple of services and hook up relations.
        fakebackend.deploy('cs:wordpress', function(data) {
          fakebackend.deploy('cs:mysql', function() {
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
            assert.equal(result.error, 'Invalid service id.');
            // But the other one exists and has no relations.
            mysql = fakebackend.getService('mysql').result;
            assert.lengthOf(mysql.rels, 0);
            done();
          });
        });
      });

      it('removes units when destroying a service', function(done) {
        fakebackend.deploy('cs:wordpress', function(data) {
          var service = fakebackend.db.services.getById('wordpress');
          var units = fakebackend.db.units.get_units_for_service(service);
          assert.lengthOf(units, 1);
          var result = fakebackend.destroyService('wordpress');
          assert.equal(result.result, 'wordpress');
          assert.isUndefined(result.error);
          units = fakebackend.db.units.get_units_for_service(service);
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
        fakebackend.deploy('cs:wordpress', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.deepEqual(service.annotations, {});
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.deepEqual(anno, {});
          done();
        });
      });

      it('must update annotations to a service', function(done) {
        fakebackend.deploy('cs:wordpress', function() {
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
        fakebackend.deploy('cs:wordpress', function() {
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
        fakebackend.deploy('cs:wordpress', function() {
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
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
      fakebackend.deploy('cs:wordpress', callback);
      assert.isUndefined(deployResult.error);
      assert.equal(
          fakebackend.addUnit('wordpress', 'goyesca').error,
          'Invalid number of units.');
      assert.equal(
          fakebackend.addUnit('wordpress', 0).error,
          'Invalid number of units.');
      assert.equal(
          fakebackend.addUnit('wordpress', -1).error,
          'Invalid number of units.');
    });

    it('returns an error if the service does not exist.', function() {
      assert.equal(
          fakebackend.addUnit('foo').error,
          'Service "foo" does not exist.');
    });

    it('defaults to adding just one unit', function() {
      fakebackend.deploy('cs:wordpress', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          fakebackend.db.units.get_units_for_service(deployResult.service), 1);
      var result = fakebackend.addUnit('wordpress');
      assert.lengthOf(result.units, 1);
      assert.lengthOf(
          fakebackend.db.units.get_units_for_service(deployResult.service), 2);
      // Units are simple objects, not models.
      assert.equal(result.units[0].id, 'wordpress/1');
      assert.equal(result.units[0].agent_state, 'started');
      assert.deepEqual(
          result.units[0], fakebackend.db.units.getById('wordpress/1'));
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

    it('adds multiple units', function() {
      fakebackend.deploy('cs:wordpress', callback);
      assert.isUndefined(deployResult.error);
      assert.lengthOf(
          fakebackend.db.units.get_units_for_service(deployResult.service), 1);
      var result = fakebackend.addUnit('wordpress', 5);
      assert.lengthOf(result.units, 5);
      assert.lengthOf(
          fakebackend.db.units.get_units_for_service(deployResult.service), 6);
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
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
        fakebackend.deploy('cs:wordpress', callback);
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
        fakebackend.deploy('cs:wordpress', callback);
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
        fakebackend.deploy('cs:wordpress', callback, {unitCount: 5});
        assert.isUndefined(deployResult.error);
        var changes = fakebackend.nextChanges();
        assert.lengthOf(Y.Object.keys(changes.services), 1);
        assert.lengthOf(Y.Object.keys(changes.units), 5);
        assert.lengthOf(Y.Object.keys(changes.machines), 5);
        assert.lengthOf(Y.Object.keys(changes.relations), 0);
      });

      it('reports no changes when no changes have occurred.',
          function() {
            fakebackend.deploy('cs:wordpress', callback);
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
        fakebackend.deploy('cs:wordpress', function() {
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

    function createRelation(charms, relation, mock, done) {
      fakebackend.deploy(charms[0], function() {
        fakebackend.deploy(charms[1], function() {
          var result = fakebackend.addRelation.apply(fakebackend, relation);
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, 'relation-0');
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
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
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:haproxy', function() {
          var result = fakebackend.addRelation(
              'wordpress:cache', 'haproxy:munin');
          assert.equal(result.error, 'Specified relation is unavailable.');
          done();
        });
      });
    });

    it('can create a relation with a double explicit interface',
        function(done) {
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
      fakebackend = utils.makeFakeBackendWithCharmStore();
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
