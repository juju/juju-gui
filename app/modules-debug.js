/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
/* jshint -W079 */
// Tell jshint to ignore the global redefinition
var GlobalConfig = {
  filter: 'debug',
  // Set "true" for verbose logging of YUI.
  debug: false,

  base: '/juju-ui/assets/javascripts/yui/',
  // Use Rollups
  combine: false,

  // Don't load YUI CSS from YUI servers.
  fetchCSS: false,

  // Do not attempt to dispatch a new route when an anchor tag appears in the
  // url. This is intended to keep charm details from reloading on tab
  // selection in the browser.
  navigateOnHash: false,

  groups: {
    gallery: {
      modules: {
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
          'fullpath': '/juju-ui/assets/javascripts/d3.min.js'
        },
        'd3-components': {
          fullpath: '/juju-ui/assets/javascripts/d3-components.js'
        },
        'd3-statusbar': {
          fullpath: '/juju-ui/assets/javascripts/d3.status.js'
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
    'resizing_textarea': {
      modules: {
        'resizing-textarea': {
          fullpath: '/juju-ui/assets/javascripts/resizing_textarea.js'
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
    spinner: {
      modules: {
        'spinner': {
          fullpath: '/juju-ui/assets/javascripts/spinner.js'
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
    filesaver: {
      modules: {
        'FileSaver': {
          fullpath: '/juju-ui/assets/javascripts/FileSaver.js'
        }
      }
    },
    observe: {
      modules: {
        'observe': {
          fullpath: '/juju-ui/assets/javascripts/Object.observe.poly.js'
        }
      }
    },

    juju: {
      modules: {
        // Primitives

        'notifier': {
          fullpath: '/juju-ui/widgets/notifier.js'
        },

        'browser-token': {
          fullpath: '/juju-ui/widgets/token.js'
        },

        'browser-token-container': {
          fullpath: '/juju-ui/widgets/token-container.js'
        },

        'browser-filter-widget': {
          fullpath: '/juju-ui/widgets/filter.js'
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

        'juju-inspector-widget': {
          fullpath: '/juju-ui/widgets/inspector-widget.js'
        },
        'juju-databinding': {
          fullpath: '/juju-ui/views/databinding.js'
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

        'app-cookies-extension': {
          fullpath: '/juju-ui/assets/javascripts/app-cookies-extension.js'
        },

        'bundle-import-helpers': {
          fullpath: '/juju-ui/assets/javascripts/bundle-import-helpers.js'
        },

        'view-dropdown-extension': {
          fullpath: '/juju-ui/assets/javascripts/view-dropdown-extension.js'
        },

        'sub-app': {
          fullpath: '/juju-ui/assets/javascripts/sub-app.js'
        },

        'unscaled-pack-layout': {
          fullpath: '/juju-ui/assets/javascripts/unscaled-pack-layout.js'
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

        'juju-topology-utils': {
          fullpath: '/juju-ui/views/topology/utils.js'
        },

        'juju-topology': {
          fullpath: '/juju-ui/views/topology/topology.js'
        },

        'juju-view-bundle': {
          fullpath: '/juju-ui/views/topology/bundle.js'
        },
        'juju-view-utils': {
          fullpath: '/juju-ui/views/utils.js'
        },

        'juju-notifications': {
          fullpath: '/juju-ui/views/notifications.js'
        },

        'juju-help-dropdown': {
          fullpath: '/juju-ui/views/help-dropdown.js'
        },

        'juju-view-environment': {
          fullpath: '/juju-ui/views/environment.js'
        },

        'juju-view-inspector': {
          fullpath: '/juju-ui/views/inspector.js'
        },

        'juju-view-login': {
          fullpath: '/juju-ui/views/login.js'
        },

        'juju-view-onboarding': {
          fullpath: '/juju-ui/views/onboarding.js'
        },

        'juju-view-networklist': {
          fullpath: '/juju-ui/views/network-list-view.js'
        },

        'juju-templates': {
          fullpath: '/juju-ui/templates.js'
        },

        'juju-viewlet-manager': {
          fullpath: '/juju-ui/views/viewlet-manager.js'
        },

        'juju-ghost-inspector': {
          fullpath: '/juju-ui/views/ghost-inspector.js'
        },

        'juju-views': {
          use: [
            'handlebars',
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-help-dropdown',
            'juju-view-utils',
            'juju-topology',
            'juju-view-environment',
            'juju-view-login',
            'juju-landscape',
            'juju-view-networklist'
          ]
        },

        // Viewlets
        'viewlet-charm-details': {
          fullpath: '/juju-ui/views/viewlets/charm-details.js'
        },

        'viewlet-unit-details': {
          fullpath: '/juju-ui/views/viewlets/unit-details.js'
        },

        'viewlet-inspector-header': {
          fullpath: '/juju-ui/views/viewlets/inspector-header.js'
        },

        'viewlet-inspector-overview': {
          fullpath: '/juju-ui/views/viewlets/service-overview.js'
        },

        'viewlet-service-config': {
          fullpath: '/juju-ui/views/viewlets/service-config.js'
        },

        'viewlet-service-ghost': {
          fullpath: '/juju-ui/views/viewlets/service-ghost.js'
        },

        'viewlet-service-constraints': {
          fullpath: '/juju-ui/views/viewlets/service-constraints.js'
        },

        'viewlet-service-relations': {
          fullpath: '/juju-ui/views/viewlets/service-relations.js'
        },

        // Models
        'juju-endpoints': {
          fullpath: '/juju-ui/models/endpoints.js'
        },

        'juju-bundle-models': {
          fullpath: '/juju-ui/models/bundle.js'
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

        'model-controller': {
          fullpath: '/juju-ui/models/model-controller.js'
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

        'juju-fakebackend-simulator': {
          fullpath: '/juju-ui/store/env/simulator.js'
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
          fullpath: '/juju-ui/store/charmworld.js'
        },

        'juju-websocket-logging': {
          fullpath: '/juju-ui/websocket-logging.js'
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
          requires: ['subapp-browser-charmview']
        },

        // Browser Views
        'subapp-browser-entitybaseview': {
          fullpath: '/juju-ui/subapps/browser/views/entity-base.js'
        },

        'subapp-browser-charmview': {
          fullpath: '/juju-ui/subapps/browser/views/charm.js'
        },

        'subapp-browser-bundleview': {
          fullpath: '/juju-ui/subapps/browser/views/bundle.js'
        },

        'subapp-browser-charmresults': {
          fullpath: '/juju-ui/subapps/browser/views/charmresults.js'
        },

        'subapp-browser-jujucharms': {
          fullpath: '/juju-ui/subapps/browser/views/jujucharms.js'
        },

        'subapp-browser-mainview': {
          fullpath: '/juju-ui/subapps/browser/views/view.js'
        },

        'subapp-browser-minimized': {
          fullpath: '/juju-ui/subapps/browser/views/minimized.js'
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
