var fs   = require('fs'),
    path = require('path'),
    Y    = require('yui/handlebars'),
    cache        = {};


function getRaw() {
    if (cache.raw) {
        return Y.merge(cache.raw);
    }
    if (cache.partials) {
        return Y.merge(cache.partials);
    }

    var raw          = {},
        partials     = {},
        templatesDir = templateDir,
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
            console.log("Error compiling template:", name, x.message);
        }

    });

    Y.Object.each(raw.partials, function (template, name) {
        try {
            precompiled.partials[name] = Y.Handlebars.precompile(template);
        } catch (x) {
            console.log("Error compiling partial:", name, x.message);
        }
    });

    cache.precompiled = Y.merge(precompiled);
    return precompiled;
};
exports.getPrecompiled = getPrecompiled;


function watchTemplates() {
    fs.watch(templateDir, function(event, filename) {
        //on dir change regen the cache
        if (filename.slice(0, 1) === ".") {return;}
        cache = {};
        getPrecompiled();
    });
};
exports.watchTemplates = watchTemplates;
