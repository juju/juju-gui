"use strict";

var fs   = require('fs'),
    path = require('path'),
    YUI = require("yui").YUI,
    view = require("./view.js"),
    less = require("less"),
    config = require("../config.js").config,
    cache        = {};

var Y = YUI({useSync: true}).use(["handlebars", "oop"]);

function getRaw() {
    if (cache.raw) {
        return Y.merge(cache.raw);
    }
    if (cache.partials) {
        return Y.merge(cache.partials);
    }

    var raw          = {},
        partials     = {},
        templatesDir = config.server.template_dir,
        files        = fs.existsSync(templatesDir) &&
                       fs.readdirSync(templatesDir, 'utf8'),
        ext;

    if (files && files.length) {
        files.forEach(function (file) {
            ext = path.extname(file);
            if (file.slice(0, 1) == "." ||
                (ext !== '.handlebars' &&
                ext !== '.partial')) {
                return; }

            var name     = file.replace(ext, ''),
                template = fs.readFileSync(path.join(templatesDir, file),
                               'utf8');
            if (ext == ".handlebars") {
                raw[name] = template;
            } else if (ext == ".partial"){
                partials[name] = template;
            }
        });
    }

    cache.raw = Y.merge(raw);
    cache.partials = Y.merge(partials);
    return {raw:raw, partials: partials};
}
exports.getRaw = getRaw;

function getPrecompiled() {
    if (cache.precompiled) {
        return Y.merge(cache.precompiled);
    }

    var precompiled = {templates: {},
                       partials: {}},
        raw = getRaw();

    Y.Object.each(raw.raw, function (template, name) {
        try {
            precompiled.templates[name] = Y.Handlebars.precompile(template);
        } catch (x) {
            console.error("Error compiling template:", name, x.message);
        }

    });

    Y.Object.each(raw.partials, function (template, name) {
        try {
            precompiled.partials[name] = Y.Handlebars.precompile(template);
        } catch (x) {
            console.error("Error compiling partial:", name, x.message);
        }
    });

    cache.precompiled = Y.merge(precompiled);
    return precompiled;
}
exports.getPrecompiled = getPrecompiled;

function prepareTemplate() {
    var precompiled = getPrecompiled(),
        templates = [],
        partials = [];
        Y.Object.each(precompiled.templates, function (template, name) {
            templates.push({
                    name    : name,
                    template: template
            });
        });

        Y.Object.each(precompiled.partials, function (template, name) {
            partials.push({
                    name    : name,
                    template: template
            });
        });

    return {
        templates: templates,
        partials: partials
    };
}


var templateSpecs = {
    index: {
        output: __dirname + "/../app/index.html",
        callback: function(strategy, name) {
            renderTemplate(name, config.application, strategy.output);
        }
    },

    templates: {
        output: __dirname + "/../app/templates.js",
        callback: function(strategy, name) {
            cache = {};
            getPrecompiled();
            renderTemplate(name, prepareTemplate(), strategy.output);
        }
    },

    manifest: {
         output: __dirname + "/../manifest.json",
         callback: function(strategy, name) {
             renderTemplate(name, config, strategy.output);
         }
    },

    stylesheet: {
        output: __dirname + "/../app/assets/stylesheets/juju-gui.css",
        callback: function(strategy, name) {
            var parser = new less.Parser({
                    paths:[config.server.view_dir],
                    filename: 'stylesheet.less'
            }),
            css_data = fs.readFileSync(
                path.join(config.server.view_dir, "stylesheet.less"), "utf8");
            parser.parse(css_data, function(e, tree) {
                if (e) {
                    console.log("LESS Generation Error", e);
                }
                fs.writeFileSync(strategy.output,
                   tree.toCSS({compress: true}));
            });

        }
    }
};

// When application specific templates change regen
function watchTemplates(cb) {
    fs.watch(config.server.template_dir, function(event, filename) {
        //on dir change regen the cache
        if (filename.slice(0, 1) === ".") {return;}
        var strategy = templateSpecs.templates;
        strategy.callback(strategy, "templates");
        if (cb) {cb();}
    });
}
exports.watchTemplates = watchTemplates;

// WHen server views change regen
function watchViews(cb) {
    fs.watch(config.server.view_dir, function(event, filename) {
        //on dir change regen the cache
        if (filename.slice(0, 1) === ".") {return;}
        var basename = filename.replace(".handlebars", ''),
            strategy = templateSpecs[basename];

        strategy.callback(strategy, basename);
        if (cb) {cb();}
    });
}
exports.watchViews = watchViews;

function renderTemplate(view_name, data, output_filename) {
     view.handlebars(__dirname + "/views/" + view_name + ".handlebars",
         data,
        function(err, str) {
        if (err) {
            console.log("Error rendering:", view_name, err);
            return;
        }

        if (output_filename) {
            fs.writeFileSync(output_filename, str);
        }
    });
}

function renderTemplates() {
    Y.Object.each(templateSpecs, function(spec, name) {
        console.info("Rendering", name);
        spec.callback(spec, name);

    });
}
exports.renderTemplates = renderTemplates;
