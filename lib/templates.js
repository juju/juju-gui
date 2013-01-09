'use strict';

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    YUI = require('yui').YUI,
    view = require('./view.js'),
    recess = require('recess'),
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
 * ignore all files not under version control.
 *
 * @param {string} fullpath The filename to check.
 * @param {function} cb Callback to call if the file is valid.
 */
function ifValidFile(fullpath, cb) {
  exec('bzr file-id ' + fullpath,
      function(error, stdout, stderr) {
        if (error === null) {
          cb();
        }
      }
  );
}

var templateSpecs = {
  templates: {
    output: __dirname + '/../build-shared/juju-ui/templates.js',
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
    output: __dirname + '/../build-shared/juju-ui/assets/juju-gui.css',
    callback: function(strategy, name) {
      // Lint the file without compiling using our config first.
      var recessConfig = JSON.parse(
          fs.readFileSync(__dirname + '/../recess.json'));
      recess(
          path.join(config.server.view_dir, 'stylesheet.less'),
          recessConfig,
          function(err, obj) {
            if (err) {
              console.log('LESS Generation Error', err);
              return;
            }
            // Warn of lint errors.
            console.log(obj.errors);
          });

      // Compile the less to the output file without worrying about our config.
      // This is due to a memory-leak in recess when multiple options are
      // specified with compile=true.  
      // See: https://github.com/twitter/recess/issues/22
      recess(
          path.join(config.server.view_dir, 'stylesheet.less'),
          { compile: true },
          function(err, obj) {
            if (err) {
              console.log('LESS Generation Error', err);
              return;
            }
            // Write to output.
            fs.writeFileSync(strategy.output, obj.output);
          });
    }
  }
};

// When application specific templates change regen
function watchTemplates(cb) {
  fs.watch(config.server.template_dir, function(event, filename) {
    //on dir change regen the cache
    ifValidFile(path.join(config.server.template_dir, filename), function() {
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
