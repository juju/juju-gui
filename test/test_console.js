'use strict';

describe('application console', function() {
  var Y, consoleManager;
  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views',
                               'juju-view-utils',
                               'juju-tests-utils'],
      function(Y) {
        consoleManager = Y.namespace('juju.views.utils')
                          .consoleManager();
        done();
      });
  });

  afterEach(function() {
    consoleManager.native();
  });

  it('should disable/restore the console', function() {
    var logCalled = false,
        message = null;

       
    consoleManager.console({
            log: function() {
                logCalled = true;
                message = arguments[0];
            }});

    consoleManager.native();
    console.log('TEST');
    assert.isFalse(logCalled);

    consoleManager.null();
    console.log('TEST');
    assert.isTrue(logCalled);
    assert.equal('TEST', message);
  });



});

