GlobalConfig = {
// Uncomment for debug versions of YUI.
//    filter: 'debug',

// Uncomment for verbose logging of YUI
    debug: false,

// Use Rollups
    combine: true,

    groups: {
        d3: {
            modules: {
               "d3": {
                   "fullpath": "/assets/javascripts/d3.v2.min.js"
               }
          }
        },
        juju: {
            modules: {
                // Primitives

                "svg-layouts" : {
                    fullpath: "/assets/javascripts/svg-layouts.js"
                },

                "reconnecting-websocket": {
                    fullpath: "/assets/javascripts/reconnecting-websocket.js"
                },

                // Views
                "juju-view-utils": {
                    fullpath: "/views/utils.js"
                },

                "juju-view-environment": {
                    fullpath: "/views/environment.js"
                },

                "juju-view-service": {
                    fullpath: "/views/service.js"
                },

                "juju-view-unit": {
                    fullpath: "/views/unit.js"
                },

                "juju-view-charmsearch": {
                    fullpath: "/views/search.js"
                },

                "juju-view-charm-collection": {
                    fullpath: "/views/charm.js"
                },

                "juju-view-charm": {
                    fullpath: "/views/charm.js"
                },

                "juju-templates": {
                  fullpath: "/templates.js"
                },

                "juju-views":  {
                    use: [
                          "juju-templates",
                          "juju-view-utils",
                          "juju-view-environment",
                          "juju-view-service",
                          "juju-view-unit",
                          "juju-view-charmsearch",
                          "juju-view-charm",
                          "juju-view-charm-collection"]
                },

                // Models

                "juju-models": {
                    requires: ["model", "model-list"],
                    fullpath: "/models/models.js"
                },

                // Connectivity
                "juju-env": {
                    requires: ["reconnecting-websocket"],
                    fullpath: "/store/env.js"
                },

                "juju-charm-store": {
                    fullpath: "/store/charm.js"
                },


                "juju-controllers": {
                    use: ["juju-env", "juju-charm-store"]
                },

                // App
                "juju-gui": {
                    fullpath: "/app.js",
                    requires: [
                        "juju-controllers",
                        "juju-views",
                        "juju-models"
                    ]
                },

                // Configuration
                "juju-config": {
                    fullpath: "/config.js",
                    requires: [
                        "datasource-io"
                    ]
                }
            }
        }
    }
};

// Node compat for testing
if (typeof(exports) !== "undefined") {
    exports.GlobalConfig = GlobalConfig;
}
