'use strict';

(function() {
  var Y;

  describe('application console', function() {
    before(function() {
      Y = YUI(GlobalConfig).use([
        'juju-models',
        'juju-views',
        'juju-gui',
        'juju-env',
        'node-event-simulate',
        'juju-tests-utils'],
      function(Y) {
      });
    });

    afterEach(function() {
      consoleManager.enable();
    });

    it('should disable the console', function() {
      var consoleEmpty = consoleManager.getConsoleEmpty(),
          logCalled = false,
          message = null;

      consoleEmpty.log = function() {
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
    });

    it('should verify if the console object has only the methods defined by' +
        ' the consoleEmpty object', function() {
         var empty = consoleManager.getConsoleEmpty(),
         emptyKeys = [];

         function assertFunction(value) {
           if (typeof value !== 'function') {
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

         Y.each(emptyKeys, function(value) {
           try {
             console[value]('test');
           } catch (e) {
             assert.fail('The console should have ' + value);
           }
         });

         try {
           // Chrome-like browsers have this method, but it is not defined by
           // the emptyConsole object.
           console.count('test');
           assert.fail('The console should not have the count function.');
         } catch (e) {
           // expected
         }
       });
  });

})();
