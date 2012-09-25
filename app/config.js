var setConsoleDisabled = (function() {
  'use strict';

  var consoleMock = {};
  var originalConsole = window.console;

  var noOp = function() {
    // no-op
  };
  for (var key in originalConsole) {
    if (typeof originalConsole[key] === 'function') {
      consoleMock[key] = noOp;
    }
  }

  // We start the application with a fake console
  window.console = consoleMock;

  return function(disabled) {
    if (disabled) {
      window.console = consoleMock;
    } else {
      window.console = originalConsole;
    }
  };
})();

var juju_config = {
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  charm_store_url: 'http://jujucharms.com/',
  socket_url: 'ws://localhost:8081/ws'
};
