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
      'juju-tests-utils', 'juju-models', 'juju-charm-models',
      'juju-fakebackend-simulator'];
    var Y, state, Simulator, simulator, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use(requires, function(Y) {
        Simulator = Y.namespace('juju.environments').Simulator;
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function(done) {
      utils.promiseImport('data/wp-deployer.yaml', 'wordpress-prod')
      .then(function(resolve) {
            state = resolve.backend;
            done();
          });
    });

    afterEach(function() {
      simulator.destroy();
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
          units = db.units.get_units_for_service(service);
      units = state.db.units.get_units_for_service(service);
      assert.equal(units.length, 12);
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

  });

})();
