var Browser = require("zombie"),
    path = require("path"),
    fs = require("fs"),
    config = require("../app/modules.js").GlobalConfig;

browser = new Browser();
window = browser.window;
location = browser.location;
document = browser.document;
navigator = window.navigator;
CSSStyleDeclaration = window.CSSStyleDeclaration;
require("sizzle");
Sizzle = window.Sizzle;
process.env.TZ = "America/Los_Angeles";

// Bind browser elements to config for YUI to work
config.win = window;
config.doc = document;


config.combine = false;
config.debug = false;
config.filter = "info";
config.useSync = false;

function fixPath(obj, name) {
    var el = obj[name],
        fp = el.fullpath;
    if (fp) {
        if (fp.indexOf("/") === 0) {
            fp = el.fullpath.slice(1);
        }
        el.fullpath = path.resolve('app', fp);
    }
}

for (var name in config.groups.juju.modules) {
    fixPath(config.groups.juju.modules, name);
}

for (var name in config.groups.d3.modules) {
    fixPath(config.groups.d3.modules, name);
}

exports.TestConfig = config;

exports.AppConfig = {
    serverRouting: false,
    html5: false,
    container: "#main",
    viewContainer: "#main"
};
