YUI.GlobalConfig = {
    debug: true,
    combine: true,
    groups: {
        juju: {
            base: "/assets/javascripts/",
            modules: {
                "juju-overview": {
                    fullpath: "/assets/javascripts/views/overview.js"
                },
                "juju-status": {
                    fullpath: "/assets/javascripts/views/status.js"
                },
                "juju-views":  {
                    use: ["juju-overview", "juju-status"]
                },
                "juju-models": {
                    fullpath: "/assets/javascripts/models/models.js"
                },
                "juju-gui": { 
                    fullpath: "/assets/javascripts/app.js",
                    requires: ["juju-views", "juju-models"]
                }
            }
        }
    }
};
        