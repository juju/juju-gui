var path = require("path"),
    config = require("../app/modules.js").GlobalConfig;

config.groups.juju.async = false;
config.combine = false;
config.debug = true;
//config.filter = "debug";

for (var name in config.groups.juju.modules) {
    var el = config.groups.juju.modules[name];
    el.fullpath = path.resolve("app", el.fullpath);
}

exports.TestConfig = config;

exports.AppConfig = {
    serverRouting: false,
    html5: true,
    viewContainer: "#main"
};
