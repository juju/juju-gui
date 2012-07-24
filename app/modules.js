YUI.GlobalConfig = {
    debug: true,
    combine: true,
    groups: {
        juju: {
            modules: {
                "reconnecting-websocket": {
                    fullpath: "/assets/javascripts/reconnecting-websocket.js"
                },
                "juju-overview": {
                    fullpath: "/views/overview.js"
                },
                "juju-status": {
                    fullpath: "/views/status.js"
                },
                "juju-views":  {
                    use: ["juju-overview", "juju-status"]
                },
                "juju-models": {
                    fullpath: "/models/models.js"
                },
                "juju-gui": { 
                    fullpath: "/app.js",
                    requires: [
                        "juju-views", 
                        "juju-models", 
                        "reconnecting-websocket"]
                }
            }
        }
    }
};
        