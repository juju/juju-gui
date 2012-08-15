var path = require("path"),
    fs = require("fs"),
    config = require("../app/modules.js").GlobalConfig;


// Fake DOM/Document setup
var jsdom = require('jsdom');

//Turn off all the things we don't want.
jsdom.defaultDocumentFeatures = {
    //Don't bring in outside resources
    FetchExternalResources   : false,
    //Don't process them
    ProcessExternalResources : false,
    //Don't expose Mutation events (for performance)
    MutationEvents           : false,
    //Do not use their implementation of QSA
    QuerySelector            : false
};
    
var dom = jsdom.defaultLevel;
//Hack in focus and blur methods so they don't fail when a YUI widget calls them
dom.Element.prototype.blur = function() {};
dom.Element.prototype.focus = function() {};


//Create the document and window
var index_html = fs.readFileSync(path.resolve("app", "index.html"), "utf-8");
document = jsdom.jsdom(index_html);
window = document.createWindow();
navigator = window.navigator;
CSSStyleDeclaration = window.CSSStyleDeclaration;
location = {};
               
require("sizzle");
Sizzle = window.Sizzle;
process.env.TZ = "America/Los_Angeles";
// Bind the jsdom objects to the YUI instance
config.win = window;
config.doc = document;

config.combine = false;
config.debug = true;
config.filter = "debug";
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
