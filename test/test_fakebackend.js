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
    var Y, fakebackend, utils, setCharm, result, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      var setupData = utils.makeFakeBackendWithCharmStore();
      fakebackend = setupData.fakebackend;
      setCharm = setupData.setCharm;
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
        aggregated_status: undefined,
        charm: 'cs:precise/wordpress-10',
        config: undefined,
        constraints: {},
        destroyed: false,
        displayName: 'wordpress',
        exposed: false,
        id: 'wordpress',
        initialized: true,
        name: 'wordpress',
        pending: false,
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
      assert.equal(result.error, 'Could not contact charm store.');
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

  describe('FakeBackend.uniformOperations', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, setCharm;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      var setupData = utils.makeFakeBackendWithCharmStore();
      fakebackend = setupData.fakebackend;
      setCharm = setupData.setCharm;
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

    describe('FakeBackend.Annotations', function() {
      it('must require authentication', function() {
        fakebackend.logout();
        var reply = fakebackend.getAnnotations('env');
        assert.equal(reply.error, 'Please log in.');
      });

      it('must get annotations from a service', function(done) {
        fakebackend.deploy('cs:wordpress', function() {
          var service = fakebackend.getService('wordpress').result;
          assert.equal(service.annotations, undefined);
          var anno = fakebackend.getAnnotations('wordpress').result;
          assert.equal(anno, undefined);
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

        // Verify changes name it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         [fakebackend.db.environment, true]);
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
    var Y, fakebackend, utils, setCharm, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      var setupData = utils.makeFakeBackendWithCharmStore();
      fakebackend = setupData.fakebackend;
      setCharm = setupData.setCharm;
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
    var Y, fakebackend, utils, setCharm, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      var setupData = utils.makeFakeBackendWithCharmStore();
      fakebackend = setupData.fakebackend;
      setCharm = setupData.setCharm;
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
                           [fakebackend.db.services.getById('wordpress'),
                true]);
          done();
        });
      });

      it('reports env changes correctly', function() {
        fakebackend.updateAnnotations('env',
                                      {'foo': 'bar', 'gone': 'away'});

        // Verify changes name it into nextAnnotations
        var changes = fakebackend.nextAnnotations();
        assert.deepEqual(changes.annotations.env,
                         [fakebackend.db.environment, true]);
      });
    });
  });

  describe.only('FakeBackend.addRelation', function() {
    var requires = [
      'node', 'juju-tests-utils', 'juju-models', 'juju-charm-models'];
    var Y, fakebackend, utils, setCharm, deployResult, callback;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      var setupData = utils.makeFakeBackendWithCharmStore();
      fakebackend = setupData.fakebackend;
      setCharm = setupData.setCharm;
      deployResult = undefined;
      callback = function(response) { deployResult = response; };
    });

    afterEach(function() {
      fakebackend.destroy();
    });

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

    it('can create a relation with a double explicit interface', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('wordpress:db', 'mysql:db'),
              mock = {
                relationId: 'relation-0',
                type: 'mysql',
                endpoints: ['wordpress:db', 'mysql:db'],
                scope: 'global'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with double explicit interface (reverse)', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('mysql:db', 'wordpress:db'),
              mock = {
                relationId: 'relation-0',
                type: 'mysql',
                endpoints: ['mysql:db', 'wordpress:db'],
                scope: 'global'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a single explicit interface', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('wordpress:db', 'mysql'),
              mock = {
                relationId: 'relation-0',
                type: 'mysql',
                endpoints: ['wordpress:db', 'mysql'],
                scope: 'global'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a single explicit interface (reverse)', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('wordpress', 'mysql:db'),
              mock = {
                relationId: 'relation-0',
                type: 'mysql',
                endpoints: ['wordpress', 'mysql:db'],
                scope: 'global'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a double explicit interface and a subordinate charm', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:puppet', function() {
          var result = fakebackend.addRelation(
              'wordpress:juju-info', 'puppet:juju-info'),
              mock = {
                relationId: 'relation-0',
                type: 'juju-info',
                endpoints: ['wordpress:juju-info', 'puppet:juju-info'],
                scope: 'container'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a double explicit interface and a subordinate charm (reverse)', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:puppet', function() {
          var result = fakebackend.addRelation(
              'puppet:juju-info', 'wordpress:juju-info'),
              mock = {
                relationId: 'relation-0',
                type: 'juju-info',
                endpoints: ['puppet:juju-info', 'wordpress:juju-info'],
                scope: 'container'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a single explicit interface and a subordinate charm (reverse)', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:puppet', function() {
          var result = fakebackend.addRelation(
              'puppet:juju-info', 'wordpress'),
              mock = {
                relationId: 'relation-0',
                type: 'juju-info',
                endpoints: ['puppet:juju-info', 'wordpress'],
                scope: 'container'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with a single explicit interface and a subordinate charm (reverse)', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:puppet', function() {
          var result = fakebackend.addRelation(
              'puppet', 'wordpress:juju-info'),
              mock = {
                relationId: 'relation-0',
                type: 'juju-info',
                endpoints: ['puppet', 'wordpress:juju-info'],
                scope: 'container'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with an inferred interface', function(done) {
      fakebackend.deploy('cs:wordpress', function() {
        fakebackend.deploy('cs:mysql', function() {
          var result = fakebackend.addRelation('wordpress', 'mysql'),
              mock = {
                relationId: 'relation-0',
                type: 'mysql',
                endpoints: ['wordpress', 'mysql'],
                scope: 'global'
              };
          assert.equal(result.error, undefined);
          assert.equal(result.relationId, mock.relationId);
          assert.equal(typeof result.relation, 'object');
          assert.deepEqual(result.endpoints, mock.endpoints);
          assert.equal(result.scope, mock.scope);
          assert.equal(result.type, mock.type);
          done();
        });
      });
    });

    it('can create a relation with an inferred interface (reverse)');
    it('can create a relation with an inferred subordinate charm');
    it('can create a relation with an inferred subordinate charm (reverse)');



  });

})();
