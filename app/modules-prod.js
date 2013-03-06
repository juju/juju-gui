var GlobalConfig = {
  debug: false,
  // YUI will not download the modules. They are supposed to be already loaded.
  ignoreRegistered: true,
  base: '/juju-ui/assets/',

  // Please use this object only for defining new aliases.
  // You can add the fullpath to the libraries in "modules-debug.js".
  groups: {
    juju: {
      modules: {
        'juju-views': {
          use: [
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-topology',
            'juju-view-utils',
            'juju-view-environment',
            'juju-view-login',
            'juju-view-service',
            'juju-view-unit',
            'juju-view-charm',
            'juju-view-charm-collection'
          ]
        },

        // 'juju-controllers' is just an alias for the modules defined by
        // 'use'. If we use "requires: ['juju-controllers']" that means
        // requiring all the modules below.
        'juju-controllers': {
          use: [
            'juju-env',
            'juju-env-base',
            'juju-env-go',
            'juju-env-python',
            'juju-charm-store',
            'juju-notification-controller'
          ]
        },

        'juju-gui': {
          fullpath: '/juju-ui/assets/app.js'
        },

        // Sub Apps
        'subapp-browser': {
          fullpath: '/juju-ui/subapps/browser/browser.js',
          requires: ['subapp-browser-fullscreen']
        },

        'subapp-browser-fullscreen': {
          fullpath: '/juju-ui/subapps/browser/views/fullscreen.js'
        },

        //Browser Models
        'juju-browser-models': {
          fullpath: '/juju-ui/models/browser.js'
        },


      }
    }
  }
};
