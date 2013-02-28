'use strict';

describe('charm small widget', function() {
  var charm_container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['charm-small', 'node-event-simulate'], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    charm_container = Y.Node.create('<div id="charm-container"></div>');
    Y.one(document.body).prepend(charm_container);
  });

  afterEach(function() {
    Y.one("#charm-container").remove(true);
  });

  it('should initialize', function() {
    var cfg = {container: charm_container};
    var charm = new Y.juju.widgets.CharmSmall(cfg);
    assert.isObject(charm);
    assert.equal(charm.get('charm_name'), '');
    assert.equal(charm.get('description'), '');
    assert.equal(charm.get('rating'), 0);
    assert.equal(charm.get('icon'), '');
    assert.equal(charm.get('container'), charm_container);
  });

  it('should show an add button on hover', function() {
    var charm = new Y.juju.widgets.CharmSmall();
  });
});
