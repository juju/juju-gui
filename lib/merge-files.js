'use strict';

// We need the yui name to be available in all modules (as a global variable).
// This only happens if we remove the 'var' keyword or add it to the "global"
// variable.
global.YUI = require('yui').YUI;

YUI().use(['yui'], function(Y) {
  var fs = require('fs'),
      syspath = require('path'),
      compressor = require('node-minify');

  // We define all of our functions initially, and then do the export at the
  // end.

  function minify(file) {
    var execution = new compressor.minify(
        { type: 'uglifyjs',
          fileIn: file,
          fileOut: file,
          callback: function(err) {
            if (err) {
              console.log(err);
            }
          }});
  }

  // It combines the files defined by "files" into a single (compressed
  // or not)
  // js file.
  function combine(files, outputFile, shouldMinify) {
    var str = [];
    Y.Array.each(files, function(file) {
      console.log('file -> ' + file);
      str.push(fs.readFileSync(file, 'utf8'));
    });
    fs.writeFileSync(outputFile, str.join('\n'), 'utf8');
    if (shouldMinify) {
      minify(outputFile);
    }
  }

  // It gets the name of all the files under 'path', recursively. It
  // ignores
  // files and directories included in the "ignore" array. These will
  // typically
  // be set to ignore our assets and our module file.
  function readdir(path, ignore) {
    var result = [], // These are the filenames we will return.
        dirs = [], // These are the directories into which we will recurse.
        files = fs.readdirSync(path);

    Y.Array.each(files, function(value) {
      var fileName, file;
      fileName = path + '/' + value;
      file = fs.statSync(fileName);
      if (file.isFile()) {
        if (syspath.extname(fileName).toLowerCase() === '.js') {
          if (ignore && ignore.indexOf(fileName) >= 0) {
            console.log('SKIPPING FILE -> ' + fileName);
          } else {
            result.push(fileName);
          }
        }
      } else if (file.isDirectory()) {
        console.log('DIRECTORY -> ' + fileName);
        if (ignore && ignore.indexOf(fileName) >= 0) {
          console.log('SKIPPING DIRECTORY -> ' + fileName);
        } else {
          dirs.push(fileName);
        }
      }
    });
    // We have read all the filenames and all the directory names. Now
    // it is
    // time to recurse into the directories that we have collected.
    Y.Array.each(dirs, function(directory) {
      // This is the best Javascript offers for appending one array to
      // another.
      result.push.apply(result, readdir(directory));
    });
    return result;
  }

  // It reads the YUI 'requires' attribute of all our custom js files
  // (as
  // assembled by readdir) and returns the YUI modules on which we
  // directly
  // depend.
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

  // Using the example
  // http://yuilibrary.com/yui/docs/yui/loader-resolve.html
  // Given a list of direct YUI requirements, return the filenames of
  // these
  // modules and their dependencies (indirect and direct).
  function getYUIFiles(reqs) {
    var loader, out;
    // The loader automatically handles following our dependencies.
    loader = new Y.Loader({
      // The base tells the loader where to look for the YUI files. We
      // look
      // directly in the npm YUI package, but we could just as well look
      // in the
      // symbolic link app/assets/javascripts/yui.
      base: './node_modules/yui/',
      ignoreRegistered: true,
      require: reqs});
    out = loader.resolve(true);
    return out.js;
  }

  // Exports
  exports.minify = minify;
  exports.combine = combine;
  exports.readdir = readdir;
  exports.loadRequires = loadRequires;
  exports.getYUIFiles = getYUIFiles;
});
