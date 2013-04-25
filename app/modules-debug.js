// This file is used for development only. In order to use it you should call
// one of the "make debug" and "make devel" commands.
//
// If you add a new module here that is in the assets/javascripts path, there's
// a good chance that you will need to add the file in bin/merge-files in order
// for the fully compressed version (used by our release and "make prod," among
// others) to work.
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
    'event_tracker': {
      modules: {
        'event-tracker': {
          fullpath: '/juju-ui/assets/javascripts/event-tracker.js'
        }
      }
    },
    prettify: {
      modules: {
        'prettify': {
          fullpath: '/juju-ui/assets/javascripts/prettify.js'
        }
      }
    },
    jsyaml: {
      modules: {
        'js-yaml': {
          fullpath: '/juju-ui/assets/javascripts/js-yaml.min.js'
        }
      }
    },
    juju: {
      modules: {
        // Primitives

        'notifier': {
          fullpath: '/juju-ui/widgets/notifier.js'
        },

        'browser-charm-token': {
          fullpath: '/juju-ui/widgets/charm-token.js'
        },

        'browser-charm-container': {
          fullpath: '/juju-ui/widgets/charm-container.js'
        },

        'browser-overlay-indicator': {
          fullpath: '/juju-ui/widgets/overlay-indicator.js'
        },

        'browser-search-widget': {
          fullpath: '/juju-ui/widgets/charm-search.js'
        },

        'browser-tabview': {
          fullpath: '/juju-ui/widgets/browser-tabview.js'
        },

        'reconnecting-websocket': {
          fullpath: '/juju-ui/assets/javascripts/reconnecting-websocket.js'
        },

        'ns-routing-app-extension': {
          fullpath: '/juju-ui/assets/javascripts/ns-routing-app-extension.js'
        },

        'app-subapp-extension': {
          fullpath: '/juju-ui/assets/javascripts/app-subapp-extension.js'
        },

        'sub-app': {
          fullpath: '/juju-ui/assets/javascripts/sub-app.js'
        },

        // Views
        'juju-landscape': {
          fullpath: '/juju-ui/views/landscape.js'
        },

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

        'juju-topology-landscape': {
          fullpath: '/juju-ui/views/topology/landscape.js'
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
            'juju-view-charm-collection',
            'juju-landscape'
          ]
        },

        // Models
        'juju-endpoints': {
          fullpath: '/juju-ui/models/endpoints.js'
        },

        'juju-charm-models': {
          fullpath: '/juju-ui/models/charm.js'
        },

        'juju-delta-handlers': {
          fullpath: '/juju-ui/models/handlers.js'
        },


        'juju-models': {
          fullpath: '/juju-ui/models/models.js'
        },

        // Connectivity
        'juju-env': {
          fullpath: '/juju-ui/store/env/env.js'
        },

        'juju-env-base': {
          fullpath: '/juju-ui/store/env/base.js'
        },

        'juju-env-go': {
          fullpath: '/juju-ui/store/env/go.js'
        },

        'juju-env-python': {
          fullpath: '/juju-ui/store/env/python.js'
        },

        'juju-env-fakebackend': {
          fullpath: '/juju-ui/store/env/fakebackend.js'
        },

        'juju-env-sandbox': {
          fullpath: '/juju-ui/store/env/sandbox.js'
        },

        'juju-notification-controller': {
          fullpath: '/juju-ui/store/notifications.js'
        },

        'juju-endpoints-controller': {
          fullpath: '/juju-ui/store/endpoints.js'
        },

        'juju-charm-store': {
          fullpath: '/juju-ui/store/charm.js'
        },

        'juju-controllers': {
          use: [
            'juju-env',
            'juju-env-base',
            'juju-env-go',
            'juju-env-python',
            'juju-charm-store',
            'juju-notification-controller']
        },

        // App
        'juju-gui': {
          fullpath: '/juju-ui/app.js'
        },

        // Sub Apps

        // Browser
        'subapp-browser': {
          fullpath: '/juju-ui/subapps/browser/browser.js',
          requires: ['subapp-browser-fullscreen', 'subapp-browser-charmview']
        },

        // Browser Views
        'subapp-browser-charmview': {
          fullpath: '/juju-ui/subapps/browser/views/charm.js'
        },

        'subapp-browser-mainview': {
          fullpath: '/juju-ui/subapps/browser/views/view.js'
        },

        'subapp-browser-minimized': {
          fullpath: '/juju-ui/subapps/browser/views/minimized.js'
        },

        'subapp-browser-fullscreen': {
          fullpath: '/juju-ui/subapps/browser/views/fullscreen.js'
        },

        'subapp-browser-searchview': {
          fullpath: '/juju-ui/subapps/browser/views/search.js'
        },

        'subapp-browser-sidebar': {
          fullpath: '/juju-ui/subapps/browser/views/sidebar.js',
          requires: [
            'subapp-browser-editorial',
            'subapp-browser-mainview',
            'subapp-browser-charmview'
          ]
        },

        'subapp-browser-editorial': {
          fullpath: '/juju-ui/subapps/browser/views/editorial.js'
        },

        //Browser Models
        'juju-browser-models': {
          fullpath: '/juju-ui/models/browser.js'
        }
      }
    }
  }
};
