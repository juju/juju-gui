// This file is used for development only. In order to use it you should call
// the "make debug" command. This command passes the "debug" argument to the
// "lib/server.js". The sole use of this file is to define the "aliases" ("use"
// property) and the "fullpath" of the file that implement a given module. The
// "requires" property should not be used here.
var GlobalConfig = {
  filter: 'debug',
  // Set "true" for verbose logging of YUI
  debug: false,

  // Use Rollups
  combine: false,

  groups: {
    d3: {
      modules: {
        'd3': {
          'fullpath': '/juju-ui/assets/javascripts/d3.v2.min.js'
        },
        'd3-components': {
          fullpath: '/juju-ui/assets/javascripts/d3-components.js'
        }
      }
    },
    juju: {
      modules: {
        // Primitives

        'notifier': {
          fullpath: '/juju-ui/widgets/notifier.js'
        },

        'svg-layouts': {
          fullpath: '/juju-ui/assets/javascripts/svg-layouts.js'
        },

        'reconnecting-websocket': {
          fullpath: '/juju-ui/assets/javascripts/reconnecting-websocket.js'
        },

        // Views
        'juju-view-utils': {
          fullpath: '/juju-ui/views/utils.js'
        },

        'juju-charm-panel': {
          fullpath: '/juju-ui/views/charm-panel.js'
        },

        'juju-notifications': {
          fullpath: '/juju-ui/views/notifications.js'
        },

        'juju-view-environment': {
          fullpath: '/juju-ui/views/environment.js'
        },

        'juju-view-service': {
          fullpath: '/juju-ui/views/service.js'
        },

        'juju-view-unit': {
          fullpath: '/juju-ui/views/unit.js'
        },

        'juju-view-charm-collection': {
          fullpath: '/juju-ui/views/charm.js'
        },

        'juju-view-charm': {
          fullpath: '/juju-ui/views/charm.js'
        },

        'juju-templates': {
          fullpath: '/juju-ui/templates.js'
        },

        'juju-views': {
          use: [
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-view-utils',
            'juju-view-environment',
            'juju-view-service',
            'juju-view-unit',
            'juju-view-charm',
            'juju-view-charm-collection'
          ]
        },

        // Models
        'juju-endpoints': {
          fullpath: '/juju-ui/models/endpoints.js'
        },

        'juju-charm-models': {
          fullpath: '/juju-ui/models/charm.js'
        },

        'juju-models': {
          fullpath: '/juju-ui/models/models.js'
        },

        // Connectivity
        'juju-env': {
          fullpath: '/juju-ui/store/env.js'
        },

        'juju-notification-controller': {
          fullpath: '/juju-ui/store/notifications.js'
        },

        'juju-charm-store': {
          fullpath: '/juju-ui/store/charm.js'
        },

        'juju-controllers': {
          use: ['juju-env', 'juju-charm-store',
            'juju-notification-controller']
        },

        // App
        'juju-gui': {
          fullpath: '/juju-ui/app.js'
        }
      }
    }
  }
};
