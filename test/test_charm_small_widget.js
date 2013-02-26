'use strict';

describe('notifier widget', function() {
  var Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['notifier', 'node-event-simulate'], function(Y) {
          CharmSmall = Y.namespace('juju.widgets').CharmSmall;
          done();
    });
  });

  it('should exist', function() {
    assert.notNull(CharmSmall);
  });
};
