'use strict';

(function() {

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
        constraints: undefined,
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
      assert.equal(result.units[0].id, 'wordpress/2');
      assert.equal(result.units[0].agent_state, 'started');
      assert.deepEqual(
          result.units[0], fakebackend.db.units.getById('wordpress/2'));
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
      assert.equal(result.machines[0].instance_state, 'running');
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
      assert.equal(result.units[0].id, 'wordpress/2');
      assert.equal(result.units[1].id, 'wordpress/3');
      assert.equal(result.units[2].id, 'wordpress/4');
      assert.equal(result.units[3].id, 'wordpress/5');
      assert.equal(result.units[4].id, 'wordpress/6');
      assert.lengthOf(result.machines, 5);
    });

  });

  describe('FakeBackend.nextChanges', function() {
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
          changes.units['wordpress/2'], [result.units[0], true]);
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
          changes.units['wordpress/1'], [deployResult.units[0], true]);
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

    it('reports no changes when no changes have occurred since the last call.',
        function() {
          fakebackend.deploy('cs:wordpress', callback);
          assert.isUndefined(deployResult.error);
          assert.isObject(fakebackend.nextChanges());
          assert.isNull(fakebackend.nextChanges());
        }
    );

  });
})();
