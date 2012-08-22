var fs   = require('fs'),
    path = require('path'),
    Y    = require('yui/handlebars'),

    cache        = {};


function getRaw() {
    if (cache.raw) {
        return Y.merge(cache.raw);
    }

    var raw          = {},
        templatesDir = templateDir,
        files        = fs.existsSync(templatesDir) &&
                       fs.readdirSync(templatesDir, 'utf8');

    if (files && files.length) {
        files.forEach(function (file) {
            if (path.extname(file) !== '.handlebars') { return; }

            var name     = file.replace('.handlebars', ''),
                template = fs.readFileSync(path.join(templatesDir, file), 'utf8');

            raw[name] = template;
        });
    }

    cache.raw = Y.merge(raw);
    return raw;
}
exports.getRaw = getRaw;

function getPrecompiled() {
    if (cache.precompiled) {
        return Y.merge(cache.precompiled);
    }

    var precompiled = {};

    Y.Object.each(getRaw(), function (template, name) {
        precompiled[name] = Y.Handlebars.precompile(template);
    });

    cache.precompiled = Y.merge(precompiled);
    return precompiled;
}
exports.getPrecompiled = getPrecompiled;
