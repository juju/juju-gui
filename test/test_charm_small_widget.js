'use strict';

describe('charm small widget', function() {
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['charm-small', 'node-event-simulate'], function(Y) {
      done();
    });
  });

  it('should initialize', function() {
    var charm = new Y.juju.widgets.CharmSmall();
    assert.isObject(charm);
    assert.equal(charm.get('charm_name'), '');
    assert.equal(charm.get('description'), '');
    assert.equal(charm.get('rating'), 0);
    assert.equal(charm.get('icon'), '');
  });
});
