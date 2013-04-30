'use strict';

describe.only('Model Controller Promises', function() {
  var modelController, yui, env, db, conn, environment, load;

  before(function(done) {
    YUI(GlobalConfig).use(
      'juju-models', 'model-controller', 'juju-charm-models',
      'juju-view-environment', 'juju-tests-utils', function(Y) {
      yui = Y;
      load = Y.juju.models.Charm.prototype.load;
      done();
    });
  });

  beforeEach(function() {
    yui.juju.models.Charm.prototype.load = function(env, callback) {
      assert.deepEqual(env, environment);
      callback();
    };
    conn = new yui['juju-tests'].utils.SocketStub();
    environment = env = yui.juju.newEnvironment(
          {conn: conn});
    db = new yui.juju.models.Database();
    env.connect();
    modelController = new yui.juju.ModelController({
      db: db,
      env: env
    });
  });

  afterEach(function() {
    env.destroy();
    db.destroy();
    // conn has no destroy method
    modelController.destroy();
  });

  after(function() {
    yui.juju.models.Charm.prototype.load = load;
  });

  it('will return a promise with a populated charm', function(done) {
    var charmId = 'cs:precise/wordpress-7',
        promise = modelController.getCharm(charmId);
    assert(yui.Promise.isPromise(promise), true);
    assert(db.charms.getById(charmId), null);
    promise.then(
      function(charm) {
        assert(charm.get('package_name'), 'wordpress');
        done();
      });
  });
});
