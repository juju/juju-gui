var path = require("path"),
    config = require("../app/modules.js").GlobalConfig;

config.groups.juju.async = false;
config.combine = false;
config.debug = true;
//config.filter = "debug";

for (var name in config.groups.juju.modules) {
    var el = config.groups.juju.modules[name],
        fp = el.fullpath;

    if (fp) {
        if (fp.indexOf("/") === 0) {
            fp = el.fullpath.slice(1);
        }
        el.fullpath = path.resolve("app", fp);
    }
}

exports.TestConfig = config;

exports.AppConfig = {
    serverRouting: false,
    html5: true,
    viewContainer: "#main"
};
