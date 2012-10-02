'use strict';

(function() {

  describe('application console', function() {

    it('should disable the console', function() {
      var mock = consoleManager.getConsoleMock(),
          logCalled = false,
          message = null;

      mock.log = function() {
        logCalled = true;
        message = arguments[0];
      };

      consoleManager.enable();
      console.log('TEST');
      assert.isFalse(logCalled);

      consoleManager.disable();
      console.log('TEST');
      assert.isTrue(logCalled);
      assert.equal('TEST', message);

      consoleManager.enable();
    });

  });

})();
