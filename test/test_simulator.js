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
  var SAMPLE_AGENT = {
    select: {
      list: 'services',
      random: 1.0, // Trigger the random path, but 100% of the time.
      filter: function(context) {
        var selection = context.selection.filter(
            {asList: true},
            function(service) {
              // Filter down to a list of one for testing.
              return service.get('id') === 'wordpress';
            });
        return selection;
      }},
    run: function(context) {
      context.selection.each(function(service) {
        // Add 10 units
        context.state.addUnit(service.get('id'), 10);
      });
    }
  };

  describe('FakeBackend.simulator', function() {
    var requires = ['node',
      'juju-tests-factory', 'juju-models',
      'juju-charm-models', 'juju-fakebackend-simulator'
    ];
    var Agent, DEFAULT_AGENTS, factory, simulator, Simulator, state, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        var ns = Y.namespace('juju.environments');
        Simulator = ns.Simulator;
        Agent = ns.Agent;
        DEFAULT_AGENTS = ns.DEFAULT_AGENTS;
        utils = window.jujuTestUtils.utils;
        factory = Y.namespace('juju-tests.factory');
        done();
      });
    });

    beforeEach(function(done) {
      utils.promiseImport(
          'data/wp-deployer.yaml',
          'wordpress-prod',
          factory.makeFakeBackend()
      ).then(function(resolve) {
        state = resolve.backend;
        done();
      });
    });

    afterEach(function() {
      if (simulator) {
        simulator.destroy();
      }
      state.destroy();
    });

    /**
     * `it` wrapper/generator that lets us write tests
     * that run after a single agent run cycle.
     *
     * @method agentShould
     * @param {String} spec passed to `it`.
     * @param {Function} callback called after a single tick.
     * @param {Object} test_agent (optional) override SAMPLE_AGENT
     *                 with your own agent for testing.
     * @return {Function} `it` Mocha test function.
     */
    function agentShould(spec, callback, test_agent) {
      return it(spec, function(done) {
        simulator = new Simulator({
          state: state,
          useDefaultAgents: false,
          agents: {test: test_agent || SAMPLE_AGENT}});
        var agent = simulator._agents.test;

        simulator.on('tick', function() {
          callback.call(agent);
          done();
        });
        simulator.start();
      });
    }

    agentShould('should be able to spawn a simulation engine', function() {
      // and the default simulator should tick when running.
      // the state was properly assigned.
      assert.equal(this.get('state'), state);
    });

    agentShould('should be able to run declared agents', function() {
      // Verify that our sample agent
      // added units.
      var db = state.db,
          service = db.services.getById('wordpress'),
          units = service.get('units');
      assert.equal(units.size(), 12);
    });

    agentShould('honor threshold 0.0', function() {
      assert.isUndefined(this.get('hasRun'));
    }, {
      threshold: 0.0,
      run: function(context) {
        this.set('hasRun', true);
      }});

    agentShould('honor threshold 1.0', function() {
      assert.isTrue(this.get('hasRun'));
    }, {
      threshold: 1.0,
      run: function(context) {
        this.set('hasRun', true);
      }
    });

    agentShould('be able to use a list for selection', function() {
      assert.equal(this.get('selection').size(),
                   state.db.services.size());
    }, {
      select: {list: 'services'}
    });

    agentShould('be able to use random (0) for list for selection', function() {
      // A random selection of 0% results in no items.
      assert.equal(this.get('selection').size(), 0);
    }, {
      select: {list: 'services', random: 0.0}
    });

    agentShould('be able to use random (1) for list for selection', function() {
      // A random selection of 0% results in no items.
      assert.equal(this.get('selection').size(), 2);
    }, {
      select: {list: 'services', random: 1.0}
    });

    it('should not start or run callbacks when not logged in', function(done) {
      simulator = new Simulator({
        state: state,
        useDefaultAgents: false,
        agents: {
          test: {
            run: function() { this.set('running', true);}
          }
        }
      });
      var agent = simulator._agents.test;

      simulator.on('tick', function() {
        assert.isFalse(agent.get('started'));
        assert.isUndefined(agent.get('running'));
        done();
      });

      state.logout();
      simulator.start();
    });

    describe('Landscape simulator', function() {
      var agent;
      beforeEach(function() {
        var config = Y.merge(DEFAULT_AGENTS.landscape);
        config.state = state;
        agent = new Agent(config);
      });

      afterEach(function() {
        agent.destroy();
      });

      it('should start by annotating environment and services', function() {
        agent.start();
        var anno = state.db.environment.get('annotations');
        var expected_environment_annotations = {
          'landscape-url': 'http://landscape.example.com',
          'landscape-computers': '/computers/criteria/environment:test',
          'landscape-reboot-alert-url': '+alert:computer-reboot/info#power',
          'landscape-security-alert-url':
              '+alert:security-upgrades/packages/list?filter=security'};
        assert.deepEqual(anno, expected_environment_annotations);
        var wordpress = state.db.services.getById('wordpress');
        anno = wordpress.get('annotations');
        assert.equal(
            anno['landscape-computers'],
            '+service:wordpress');
        // They were recorded as changed.
        anno = state.nextAnnotations();
        assert.strictEqual(anno.annotations.env, state.db.environment);
        assert.strictEqual(anno.services.wordpress, wordpress);
      });

      it('should annotate units when running', function() {
        agent.set('reboot_chance_per_unit', 0);
        agent.set('upgrade_chance_per_unit', 0);
        agent.start();
        state.nextAnnotations();
        agent.run();
        var unit = state.db.services.getById('wordpress').get('units').item(0);
        assert.deepEqual(
            unit.annotations,
            {'landscape-computer': '+unit:wordpress-0'});
        var anno = state.nextAnnotations();
        assert.equal(Object.keys(anno.units).length, 3); // All units changed.
      });

      it('should not annotate reboot or upgrade if no chance', function() {
        agent.set('reboot_chance_per_unit', 0);
        agent.set('upgrade_chance_per_unit', 0);
        agent.start();
        agent.run();
        state.nextAnnotations();
        agent.run();
        assert.isNull(state.nextAnnotations()); // Nothing changed.
        var unit = state.db.services.getById('wordpress').get('units').item(0);
        assert.isUndefined(unit.annotations['landscape-needs-reboot']);
        assert.isUndefined(unit.annotations['landscape-security-upgrades']);
      });

      it('should annotate reboot if chance succeeds', function() {
        agent.set('reboot_chance_per_unit', 0);
        agent.set('upgrade_chance_per_unit', 0);
        agent.start();
        agent.run();
        state.nextAnnotations();
        agent.set('reboot_chance_per_unit', 1);
        agent.run();
        var anno = state.nextAnnotations();
        assert.equal(Object.keys(anno.units).length, 3); // All units changed.
        var unit = state.db.services.getById('wordpress').get('units').item(0);
        assert.isTrue(unit.annotations['landscape-needs-reboot']);
        assert.isUndefined(unit.annotations['landscape-security-upgrades']);
      });

      it('should annotate upgrade if chance succeeds', function() {
        agent.set('reboot_chance_per_unit', 0);
        agent.set('upgrade_chance_per_unit', 0);
        agent.start();
        agent.run();
        state.nextAnnotations();
        agent.set('upgrade_chance_per_unit', 1);
        agent.run();
        var anno = state.nextAnnotations();
        assert.equal(Object.keys(anno.units).length, 3); // All units changed.
        var unit = state.db.services.getById('wordpress').get('units').item(0);
        assert.isUndefined(unit.annotations['landscape-needs-reboot']);
        assert.isTrue(unit.annotations['landscape-security-upgrades']);
      });
    });

  });

  describe('createContainer', function() {
    var requirements = [
      'juju-fakebackend-simulator', 'juju-tests-factory'];
    var createContainer, fakeBackend, testFactory, testUtils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        createContainer = Y.namespace('juju.environments').createContainer;
        testFactory = Y.namespace('juju-tests.factory');
        testUtils = window.jujuTestUtils.utils;
        done();
      });
    });

    beforeEach(function() {
      // Create a fake backend with some machines in it.
      fakeBackend = testFactory.makeFakeBackend();
      fakeBackend.db.machines.add([
        {id: '0'},
        {id: '1'},
        {id: '2'},
        {id: '2/lxc/0'}
      ]);
    });

    afterEach(function() {
      fakeBackend.destroy();
    });

    // Mock the Math.random function.
    var mockRandom = function(context, value) {
      var mockMathRandom = testUtils.makeStubMethod(Math, 'random', value);
      context._cleanups.push(mockMathRandom.reset);
    };

    it('creates a new container and returns its name', function() {
      mockRandom(this, 0.1);
      var name = createContainer(fakeBackend);
      assert.deepEqual(name, '0/lxc/0');
    });

    it('creates a new container in a random top level machine', function() {
      mockRandom(this, 0.6);
      var name = createContainer(fakeBackend);
      assert.deepEqual(name, '1/lxc/0');
    });

    it('retrieves the name of the next container', function() {
      mockRandom(this, 0.9);
      var name = createContainer(fakeBackend);
      assert.deepEqual(name, '2/lxc/1');
    });

    it('returns null if no machines are present in the db', function() {
      fakeBackend.db.reset();
      var name = createContainer(fakeBackend);
      assert.isNull(name);
    });

  });

})();
