'use strict';

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    YUI = require('yui').YUI,
    view = require('./view.js'),
    less = require('less'),
    config = require('../config.js').config,
    cache = {};

var Y = YUI({useSync: true}).use(['handlebars', 'oop']);

function getRaw() {
  if (cache.raw) {
    return Y.merge(cache.raw);
  }
  if (cache.partials) {
    return Y.merge(cache.partials);
  }

  var raw = {},
      partials = {},
      templatesDir = config.server.template_dir,
      files = fs.existsSync(templatesDir) &&
      fs.readdirSync(templatesDir, 'utf8'),
      ext;

  if (files && files.length) {
    files.forEach(function(file) {
      ext = path.extname(file);
      if (file.slice(0, 1) === '.' ||
          (ext !== '.handlebars' &&
          ext !== '.partial')) {
        return; }

      var name = file.replace(ext, ''),
          template = fs.readFileSync(path.join(templatesDir, file),
          'utf8');
      if (ext === '.handlebars') {
        raw[name] = template;
      } else if (ext === '.partial') {
        partials[name] = template;
      }
    });
  }

  cache.raw = Y.merge(raw);
  cache.partials = Y.merge(partials);
  return {raw: raw, partials: partials};
}
exports.getRaw = getRaw;

function getPrecompiled() {
  if (cache.precompiled) {
    return Y.merge(cache.precompiled);
  }

  var precompiled = {templates: {},
        partials: {}},
      raw = getRaw();

  Y.Object.each(raw.raw, function(template, name) {
    try {
      precompiled.templates[name] = Y.Handlebars.precompile(template);
    } catch (x) {
      console.error('Error compiling template:', name, x.message);
    }

  });

  Y.Object.each(raw.partials, function(template, name) {
    try {
      precompiled.partials[name] = Y.Handlebars.precompile(template);
    } catch (x) {
      console.error('Error compiling partial:', name, x.message);
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
  Y.Object.each(precompiled.templates, function(template, name) {
    templates.push({
      name: name,
      template: template
    });
  });

  Y.Object.each(precompiled.partials, function(template, name) {
    partials.push({
      name: name,
      template: template
    });
  });

  return {
    templates: templates,
    partials: partials
  };
}

function renderTemplate(view_name, data, output_filename) {
  view.handlebars(__dirname + '/views/' + view_name + '.handlebars',
      data,
      function(err, str) {
        if (err) {
          console.log('Error rendering:', view_name, err);
          return;
        }

        if (output_filename) {
          fs.writeFileSync(output_filename, str);
        }
      });
}


/**
 * Determines whether a file is a valid file for processing.  This should
 * ignore all editor-created files in order to assist debugging.  Included
 * are files created by vim and emacs; feel free to add to this list.
 *
 * @param {string} filename The filename to check.
 */
function ifValidFile(fullpath, cb) {
  exec('bzr file-id ' + fullpath + ' > /dev/null 2>&1', 
      function(error, stdout, stderr) {
        if (error === null) {
          cb();
        }
      }
  );
  /*if (filename.charAt(0) === '.' ||
      filename.charAt(0) === '#' ||
      filename.charAt(filename.length - 1) === '~' ||
      filename === '4913') {
    return false;
  }
  return true;*/
}

var templateSpecs = {
  templates: {
    output: __dirname + '/../build/juju-ui/templates.js',
    callback: function(strategy, name) {
      cache = {};
      getPrecompiled();
      renderTemplate(name, prepareTemplate(), strategy.output);
    }
  },

  manifest: {
    output: __dirname + '/../manifest.json',
    callback: function(strategy, name) {
      renderTemplate(name, config, strategy.output);
    }
  },

  stylesheet: {
    output: __dirname + '/../build/juju-ui/assets/stylesheets/juju-gui.css',
    callback: function(strategy, name) {
      var parser = new less.Parser({
        paths: [config.server.view_dir],
        filename: 'stylesheet.less'
      }),
          css_data = fs.readFileSync(
          path.join(config.server.view_dir, 'stylesheet.less'), 'utf8');
      parser.parse(css_data, function(e, tree) {
        if (e) {
          console.log('LESS Generation Error', e);
          return;
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
    ifValidFile(path.join(config.server.view_dir, filename), function() {
      var strategy = templateSpecs.templates;
      strategy.callback(strategy, 'templates');
      if (cb) {cb();}
    });
  });
}
exports.watchTemplates = watchTemplates;

// When server views change regen
function watchViews(cb) {
  fs.watch(config.server.view_dir, function(event, filename) {
    //on dir change regen the cache
    ifValidFile(path.join(config.server.view_dir, filename), function() {
      var ext = path.extname(filename),
              basename = path.basename(filename, ext),
              strategy = templateSpecs[basename];
      if (strategy) {
        strategy.callback(strategy, basename);
        if (cb) {cb();}
      } else {
        console.error('Unhandled template/extension/strategy:', filename);
      }
    });
  });
}
exports.watchViews = watchViews;

function renderTemplates() {
  Y.Object.each(templateSpecs, function(spec, name) {
    console.info('Rendering', name);
    spec.callback(spec, name);

  });
}
exports.renderTemplates = renderTemplates;
