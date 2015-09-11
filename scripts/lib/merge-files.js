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

// We need the yui name to be available in all modules (as a global variable).
// This only happens if we remove the 'var' keyword or add it to the "global"
// variable.
global.YUI = require('yui').YUI;
var path = require('path');
var child_process = require('child_process');
var UglifyJS = require('uglify-js');

YUI().use(['yui'], function(Y) {
  var fs = require('fs'),
      syspath = require('path'),
      compressor = require('node-minify');

  function throw_error(err) {
    if (err) {
      throw err;
    }
  }

  // Combine one or more CSS files.
  function combineCSS(files, outputFile) {
    /* jshint -W031 */
    new compressor.minify({
      type: 'sqwish',
      fileIn: files,
      fileOut: outputFile,
      callback: throw_error
    });
  }
  exports.combineCSS = combineCSS;

  // Combine one or more JavaScript files.
  function combineJs(files, outputFile) {
    var sourceMapName = syspath.basename(outputFile) + '.map';
    // We feed the minifier relative path names so the source map will map to
    // relative URLs that can be easily served.
    var relative_files = [];
    Y.Array.each(files, function(inputFile) {
      relative_files.push(syspath.relative(process.cwd(), inputFile));
    });
    var result = UglifyJS.minify(relative_files, {
      compress: false,
      mangle: false,
      outSourceMap: sourceMapName,
      sourceRoot: 'source'
    });
    // The uglifyjs script does this instead of the library, so we have to do
    // it ourselves since we are using uglify as a library and not a script.
    result.code += '\n//# sourceMappingURL=' + sourceMapName;
    fs.writeFileSync(outputFile, result.code, 'utf8', throw_error);
    fs.writeFileSync(sourceMapName, result.map, 'utf8', throw_error);
  }
  exports.combineJs = combineJs;

  // It gets the name of all the files under 'path', recursively. It ignores
  // files and directories included in the "ignore" array. These will
  // typically be set to ignore our assets and our module file.
  function readdir(path, ignore) {
    var result = []; // These are the filenames we will return.
    var dirs = []; // These are the directories into which we will recurse.
    var files = fs.readdirSync(path);
    ignore = ignore || [];

    function shouldNotIgnore(fileName) {
      return ignore.indexOf(fileName) === -1;
    }

    function isJavascriptFile(fileName) {
      return syspath.extname(fileName).toLowerCase() === '.js';
    }

    Y.Array.each(files, function(value) {
      var fileName, file;
      fileName = path + '/' + value;
      file = fs.statSync(fileName);
      if (shouldNotIgnore(fileName)) {
        if (file.isFile() && isJavascriptFile(fileName)) {
          result.push(fileName);
        }
        else if (file.isDirectory()) {
          dirs.push(fileName);
        }
      }
    });
    // We have read all the filenames and all the directory names. Now
    // it is time to recurse into the directories that we have collected.
    Y.Array.each(dirs, function(directory) {
      result.push.apply(result, readdir(directory, ignore));
    });
    return result;
  }
  exports.readdir = readdir;

  // It reads the YUI 'requires' attribute of all our custom js files
  // (as assembled by readdir) and returns the YUI modules on which we
  // directly depend.
  function loadRequires(paths) {
    var originalAdd, modules, yuiReqs;
    modules = {};

    originalAdd = YUI.add;
    // This is a trick to get the 'requires' value from the module
    // definition.
    YUI.add = function(name, fn, version, details) {
      if (details && details.requires) {
        modules[name] = details.requires;
      }
    };

    Y.Array.each(paths, function(path) {
      // It triggers the custom 'add' method above
      require(path);
    });
    YUI.add = originalAdd;

    // Getting all the YUI dependencies that we need
    yuiReqs = [];
    Y.Object.each(modules, function(requires) {
      Y.Array.each(requires, function(value) {
        if (!modules[value]) {
          // This is not one of our modules but a yui one.
          if (yuiReqs.indexOf(value) < 0) {
            // avoid duplicates
            yuiReqs.push(value);
          }
        }
      });
    });
    return yuiReqs;
  }
  exports.loadRequires = loadRequires;

  // Using the example http://yuilibrary.com/yui/docs/yui/loader-resolve.html
  // Given a list of direct YUI requirements, return the filenames of these
  // modules and their dependencies (indirect and direct).
  function getYUIFiles(reqs) {
    var loader, out;
    // The loader automatically handles following our dependencies.
    loader = new Y.Loader({
      // The base tells the loader where to look for the YUI files. We
      // look directly in the npm YUI package, but we could just as well look
      // in the symbolic link app/assets/javascripts/yui.
      base: './node_modules/yui/',
      ignoreRegistered: true,
      filter: 'RAW', // We do not want minified source because we minify it in
      // uglify, when we also produce the source maps.
      require: reqs});
    out = loader.resolve(true);
    return out;
  }
  exports.getYUIFiles = getYUIFiles;
});
