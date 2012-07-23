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
                "juju-views":  {
                    use: ["juju-overview"]
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
        