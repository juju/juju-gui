// This file is used for development only. In order to use it you should call
// the "make debug" command. This command passes the "debug" argument to the
// "lib/server.js".
//
// This file declares which files implement modules, using the
// "fullpath" property; and declares the membership of rollup modules, using
// the "use" property to specify what the module name aliases.
//
// The "requires" property should not be used here because the javascript
// minimizer will not parse it.
var GlobalConfig = {
  filter: 'debug',
  // Set "true" for verbose logging of YUI
  debug: false,

  base: '/juju-ui/assets/javascripts/yui/',
  // Use Rollups
  combine: false,

  groups: {
    gallery: {
      modules: {
        'gallery-ellipsis': {
          fullpath: '/juju-ui/assets/javascripts/gallery-ellipsis-debug.js'
        },
        'gallery-markdown': {
          fullpath: '/juju-ui/assets/javascripts/gallery-markdown-debug.js'
        },
        'gallery-timer': {
          fullpath: '/juju-ui/assets/javascripts/gallery-timer-debug.js'
        }
      }
    },
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
        'juju-topology-relation': {
          fullpath: '/juju-ui/views/topology/relation.js'
        },

        'juju-topology-panzoom': {
          fullpath: '/juju-ui/views/topology/panzoom.js'
        },

        'juju-topology-viewport': {
          fullpath: '/juju-ui/views/topology/viewport.js'
        },

        'juju-topology-service': {
          fullpath: '/juju-ui/views/topology/service.js'
        },

        'juju-topology-mega': {
          fullpath: '/juju-ui/views/topology/mega.js'
        },

        'juju-topology': {
          fullpath: '/juju-ui/views/topology/topology.js'
        },

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

        'juju-view-login': {
          fullpath: '/juju-ui/views/login.js'
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
            'handlebars',
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-view-utils',
            'juju-topology',
            'juju-view-environment',
            'juju-view-login',
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
          use: [
            'juju-env',
            'juju-charm-store',
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
