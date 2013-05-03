
'use strict';

(function() {

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
      state = utils.makeFakeBackendWithCharmStore();
      var fixture = utils.loadFixture('data/sample-improv.json', false);
      state.importEnvironment(fixture, function(result) {
        done();
      });
    });

    afterEach(function() {
      simulator.destroy();
      state.destroy();
    });

    it('should be able to spawn a simulation engine', function(done) {
      simulator = new Simulator({
        state: state,
        useDefaultAgents: false
      });
      simulator.on('tick', function() {
        // and the default simulator should tick when running.
        // the state was properly assigned.
        assert.equal(this.get('state'), state);
        done();
      });
      simulator.start();
    });

    it('should be able to run decalred agents', function(done) {
      var db = state.db;
      var service = db.services.getById('wordpress');
      var units = db.units.get_units_for_service(service);
      simulator = new Simulator({
        state: state,
        useDefaultAgents: false,
        agents: {
          test: {
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
          }}});

      simulator.on('tick', function() {
        // Verify that our sample agent
        // added units.
        units = db.units.get_units_for_service(service);
        assert.equal(units.length, 11);
        done();
      });

      assert.equal(units.length, 1);
      simulator.start();
    });

  });

})();
