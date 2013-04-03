'use strict';

(function() {

  describe('Juju delta handlers', function() {
    var db, models, handlers, Y;
    var requirements = ['juju-models', 'juju-delta-handlers'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        handlers = models.handlers;
        done();
      });
    });

    beforeEach(function() {
      db = new models.Database();
    });


    describe('pyDelta handler', function() {
      var pyDelta;

      before(function() {
        pyDelta = handlers.pyDelta;
      });

      it('replaces the attribute names when required', function() {
        var change = {
          id: 'django/1',
          private_address: '10.0.0.1',
          'public-address': 'example.com',
          'is-subordinate': true
        };
        pyDelta(db, 'add', change, 'unit');
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/1');
        assert.strictEqual('10.0.0.1', unit.private_address);
        assert.strictEqual('example.com', unit.public_address);
        assert.isTrue(unit.is_subordinate);
      });

      it('automatically handles changes to different model lists', function() {
        pyDelta(db, 'add', {id: 'django'}, 'service');
        pyDelta(db, 'add', {id: 'django/1'}, 'unit');
        pyDelta(db, 'add', {id: '1'}, 'machine');
        assert.strictEqual(1, db.services.size());
        assert.strictEqual(1, db.units.size());
        assert.strictEqual(1, db.machines.size());
        assert.isNotNull(db.services.getById('django'));
        assert.isNotNull(db.units.getById('django/1'));
        assert.isNotNull(db.machines.getById('1'));
      });

    });


    describe('unitInfo handler', function() {
      var unitInfo;

      before(function() {
        unitInfo = handlers.unitInfo;
      });

      it('creates a unit in the database', function() {
        var change = {
          Name: 'django/1',
          Service: 'django',
          MachineId: '1',
          Status: 'pending',
          PublicAddress: 'example.com',
          PrivateAddress: '10.0.0.1'
          // XXX 2013-04-03 frankban: include change.Ports.
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(1, db.units.size());
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/1');
        assert.strictEqual('django', unit.service);
        assert.strictEqual('1', unit.machine);
        assert.strictEqual('pending', unit.agent_state);
        assert.strictEqual('example.com', unit.public_address);
        assert.strictEqual('10.0.0.1', unit.private_address);
      });

      it('updates a unit in the database', function() {
        db.units.add({
          id: 'django/2',
          agent_state: 'pending',
          public_address: 'example.com',
          private_address: '10.0.0.1'
        });
        var change = {
          Name: 'django/2',
          Status: 'started',
          PublicAddress: 'example.com',
          PrivateAddress: '192.168.0.1'
        };
        unitInfo(db, 'change', change);
        assert.strictEqual(1, db.units.size());
        // Retrieve the unit from the database.
        var unit = db.units.getById('django/2');
        assert.strictEqual('started', unit.agent_state);
        assert.strictEqual('example.com', unit.public_address);
        assert.strictEqual('192.168.0.1', unit.private_address);
      });

      it('creates or updates the corresponding machine', function() {
        var machine;
        var change = {
          Name: 'django/2',
          MachineId: '1',
          Status: 'pending',
          PublicAddress: 'example.com'
        };
        unitInfo(db, 'add', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database.
        machine = db.machines.getById(1);
        assert.strictEqual('pending', machine.agent_state);
        assert.strictEqual('pending', machine.instance_state);
        assert.strictEqual('example.com', machine.public_address);
        // Update the machine.
        change.Status = 'started';
        unitInfo(db, 'change', change);
        assert.strictEqual(1, db.machines.size());
        // Retrieve the machine from the database (again).
        machine = db.machines.getById('1');
        assert.strictEqual('started', machine.agent_state);
        assert.strictEqual('started', machine.instance_state);
      });

    });

  });


  describe('Juju delta handlers utilities', function() {
    var utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-delta-handlers'], function(Y) {
        utils = Y.namespace('juju.models').utils;
        done();
      });
    });


    describe('Go Juju Entity Tag cleaner', function() {
      var cleanUpEntityTags;

      before(function() {
        cleanUpEntityTags = utils.cleanUpEntityTags;
      });

      it('cleans up tags from Go juju', function() {
        assert.equal('mysql', cleanUpEntityTags('service-mysql'));
        assert.equal('mysql-0', cleanUpEntityTags('unit-mysql-0'));
        assert.equal('0', cleanUpEntityTags('machine-0'));
        assert.equal('aws', cleanUpEntityTags('environment-aws'));
      });

      it('ignores bad values', function() {
        var data = ['foo', 'bar-baz', '123'];
        Y.each(data, function(item) {
          assert.equal(item, cleanUpEntityTags(item));
        });
      });

    });

  });

})();
