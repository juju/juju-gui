GlobalConfig = {
    filter: 'info',
    debug: false,
    combine: false,
    groups: {
        d3: {
//            base: "http://d3js.org/",
            modules: {
               "d3": {
                   "fullpath": "/assets/javascripts/d3.v2.min.js"
               }
          }
        },
        juju: {
            modules: {
                "svg-layouts" : {
                    fullpath: "/assets/javascripts/svg-layouts.js"
                },
                "reconnecting-websocket": {
                    fullpath: "/assets/javascripts/reconnecting-websocket.js"
                },
                "juju-overview": {
                    fullpath: "/views/overview.js"
                },
                "juju-service": {
                    fullpath: "/views/service.js"
                },
                "juju-view-charmsearch": {
                    fullpath: "/views/search.js"
                },
                "juju-views":  {
                    use: ["juju-overview", "juju-service", "juju-view-charmsearch"]
                },
                "juju-models": {
                    requires: ["model", "model-list"],
                    fullpath: "/models/models.js"
                },
                "juju-env": {
                    requires: ["reconnecting-websocket"],
                    fullpath: "/store/env.js"
                },
		
                "juju-gui": {
                    fullpath: "/app.js",
                    requires: [
			"juju-env",
                        "juju-views",
                        "juju-models",
                        "svg-layouts",
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
