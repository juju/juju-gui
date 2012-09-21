'use strict';
// Test utils.

YUI(GlobalConfig).add('juju-tests-utils', function(Y) {
  var jujuTests = Y.namespace('juju-tests');

  jujuTests.utils = {

    SocketStub: function() {
      this.messages = [];

      this.close = function() {
        //console.log('close stub');
        this.messages = [];
      };

      this.transient_close = function() {
        this.onclose();
      };

      this.open = function() {
        this.onopen();
        return this;
      };

      this.msg = function(m) {
        console.log('serializing env msg', m);
        this.onmessage({'data': Y.JSON.stringify(m)});
      };

      this.last_message = function(m) {
        return this.messages[this.messages.length - 1];
      };

      this.send = function(m) {
        console.log('socket send', m);
        this.messages.push(Y.JSON.parse(m));
      };

      this.onclose = function() {};
      this.onmessage = function() {};
      this.onopen = function() {};

    }

  };

});
