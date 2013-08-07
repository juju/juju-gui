/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    YUI = require('yui').YUI,
    view = require('./view.js'),
    less = require('less'),
    // sass = require('node-sass'),
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
      templateDirs = config.server.template_dirs,
      files = {},
      ext;

  Y.Array.each(templateDirs, function(dir) {
    files[dir] = (fs.existsSync(dir) && fs.readdirSync(dir, 'utf8'));
  });

  if (files) {
    Y.Object.keys(files).forEach(function(dir) {
      files[dir].forEach(function(file) {
        ext = path.extname(file);
        if (file.slice(0, 1) === '.' || (
            ext !== '.handlebars' && ext !== '.partial')) {
          return;
        }

        var name = file.replace(ext, ''),
            template = fs.readFileSync(path.join(dir, file), 'utf8');
        if (ext === '.handlebars') {
          raw[name] = template;
        } else if (ext === '.partial') {
          partials[name] = template;
        }
      });
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

  less: {
    output: __dirname + '/../build-shared/juju-ui/assets/juju-gui.css',
    callback: function(strategy, name) {
      var parser = new less.Parser({
                     paths: config.server.view_dirs,
                     filename: 'stylesheet.less'
                   }),
          css_data = fs.readFileSync(path.join(
                          config.server.view_dirs[0],
                          'stylesheet.less'),
                       'utf8');

      parser.parse(css_data, function(e, tree) {
        if (e) {
          console.log('LESS Generation Error', e);
          return;
        }
        // With scss enabled this should be appendFileSync
        fs.writeFileSync(strategy.output,
            tree.toCSS({compress: true}));
      });

    }
  }/*,

  scss: {
    output: __dirname + '/../build-shared/juju-ui/assets/juju-gui.css',
    callback: function(strategy, name) {
      sass.render({
        file: 'base.scss',
        includePaths: config.server.scss_dirs,
        success: function(css) {
          fs.writeFileSync(strategy.output, css);
        },
        error: function(error) {
          console.log('SCSS compilation error: ' + error);
        },
        outputStyle: 'compressed'
      });
    }
  }*/
};

// When application specific templates change regen
function watchTemplates(cb) {
  Y.Array.each(config.server.template_dirs, function(dir) {
    fs.watch(dir, function(event, filename) {
      //on dir change regen the cache
      ifValidFile(path.join(dir, filename), function() {
        var strategy = templateSpecs.templates;
        strategy.callback(strategy, 'templates');
        if (cb) {cb();}
      });
    });
  });
}
exports.watchTemplates = watchTemplates;

// When server views change regen
function watchViews(cb) {
  Y.Array.each(config.server.view_dirs, function(dir) {
    fs.watch(dir, function(event, filename) {
      //on dir change regen the cache
      ifValidFile(path.join(dir, filename), function() {
        var ext = path.extname(filename),
            basename = path.basename(filename, ext),
            strategy = templateSpecs[basename];

        // Hack to check if the file is a .less file and if so invoke the
        // stylesheet.less strategy.
        if (ext === '.less') {
          strategy = templateSpecs.less;
        }
        else if (ext === '.scss') {
          strategy = templateSpecs.scss;
        }

        if (strategy) {
          strategy.callback(strategy, basename);
          if (cb) {cb();}
        } else {
          console.error('Unhandled template/extension/strategy:', filename);
        }
      });
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
