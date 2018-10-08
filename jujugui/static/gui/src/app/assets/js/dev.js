'use strict';

window.juju_config = require('./config');
window.YUI = require('../../../../build/app/assets/javascripts/yui/yui/yui').YUI;

// Now that all of the above JS is loaded we can define the real start
// function which will be picked up by the setTimeout, and the app will
// start.
window.startTheApp = function() {
  YUI().use([], function(Y) {
    window.yui = Y;
    const JujuGUI = require('../../init');
    window.yui.use([
        'juju-charm-models',
        'juju-bundle-models',
        'juju-controller-api',
        'juju-env-base',
        'juju-env-api',
        'juju-models',
        'base',
        'model'
    ], function () {
      window.JujuGUI = new JujuGUI(juju_config);
    });

    const stopHandler = () => {
      document.removeEventListener('login', stopHandler);
      messageRotator.stop();
    };
    document.addEventListener('login', stopHandler);
  });
};
