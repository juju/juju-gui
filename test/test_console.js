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
    
    it('should verify if the console object has only the methods defined by' + 
        ' the consoleEmpty object', function() {

      var empty = consoleManager.getConsoleEmpty(),
          emptyKeys = [],
          logCalled = false,
          message = null;
      
      function assertFunction(value) {
        if(typeof value !== 'function') {
          assert.fail('The console should define functions only.');
        }
      }
      
      Y.each(empty, function(value, key) {
        assertFunction(value);
        emptyKeys.push(key);
      }); 

      consoleManager.enable();
      Y.each(console, function(value, key) {
        assertFunction(value);
      });      
      
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
