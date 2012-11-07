'use strict';

// It is used by "require(value);" (line ~82) . When nodejs executes
// "require(value);", it loads one of our js files. These js files call
// "YUI.add(..." and YUI is defined by "global.YUI".
// http://stackoverflow.com/questions/5348685/node-js-require-inheritance
global.YUI = require('yui').YUI;

var Y = YUI(),
    fs = require('fs'),
    syspath = require('path'),
    compressor = require('node-minify'),
    modules = {},
    paths = [];

function minify(file) {
  var execution = new compressor.minify({
    type: 'uglifyjs',
    fileIn: file,
    fileOut: file,
    callback: function(err) {
      if (err) {
        console.log(err);
      }
    }
  });
}

// It combines the files defined by "files" into a single (compressed or not)
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

// Reading the 'requires' attribute of all our custom js files
(function() {
  function readdir(path) {
    var file,
        dirs = [],
        fileName,
        files = fs.readdirSync(path),
        // I need to use "syspath.join(process.cwd()" otherwise I have...
        // "ReferenceError: CSSStyleDeclaration is not defined" from d3
        assetsFolder = syspath.join(process.cwd(), './app/assets');

    Y.Array.each(files, function(value) {
      fileName = path + '/' + value;
      file = fs.statSync(fileName);

      if (file.isFile()) {
        if (syspath.extname(fileName).toLowerCase() === '.js') {
          // This file is not a yui module
          if ('./app/modules-debug.js' === fileName) {
            console.log('SKIPPING FILE -> ' + fileName);
          } else {
            paths.push(fileName);
          }
        }
      } else if (file.isDirectory()) {
        console.log('DIRECTORY -> ' + fileName);
        // The files under the assets folder are not combined
        if (assetsFolder === fileName) {
          console.log('SKIPPING DIRECTORY -> ' + fileName);
        } else {
          dirs.push(fileName);
        }
      }
    });

    // We wrote all the files. Now it is time to read and write the files
    // inside the children directories.
    Y.Array.each(dirs, function(directory) {
      readdir(directory);
    });
  }

  // reading all JS files under './app'
  // I need to use "syspath.join(process.cwd()" otherwise I have...
  // "Error: Cannot find module './app/config.js'" from node's internal
  // module.js file.
  readdir(syspath.join(process.cwd(), './app'));
  console.log('FILES loaded');

  var originalAdd = YUI.add;
  // This is a trick to get the 'requires' value from the module definition
  YUI.add = function(name, fn, version, details) {
    modules[name] = [];
    if (details && details.requires) {
      Y.Array.each(details.requires, function(value) {
        modules[name].push(value);
      });
    }
  };

  Y.Array.each(paths, function(value) {
    // It triggers the custom 'add' method above
    require(value);
  });
  YUI.add = originalAdd;
})();

// Getting all the YUI dependencies that we need
var reqs = (function() {
  var yuiRequirements = [];
  Y.Object.each(modules, function(requires) {
    Y.Array.each(requires, function(value) {
      if (!modules[value]) {
        // This is not one of our modules but a yui one.
        if (yuiRequirements.indexOf(value) < 0) {
          // avoid duplicates
          yuiRequirements.push(value);
        }
      }
    });
  });
  console.log('REQS loaded');
  return yuiRequirements;
})();

// Using the example http://yuilibrary.com/yui/docs/yui/loader-resolve.html
// It uses the reqs object that we created in the previous block and figures
// out the js files that contain it, so we can mount our combines js file
// for all the yui requirements.
(function() {
  var loader, out;
  loader = new Y.Loader({
    base: './node_modules/yui/',
    ignoreRegistered: true,
    require: reqs
  });
  out = loader.resolve(true);
  combine(out.js, './app/assets/javascripts/generated/all-yui.js', true);
})();

// Creating the combined file for all the third part js code
combine(['./app/assets/javascripts/d3.v2.min.js',
         './app/assets/javascripts/reconnecting-websocket.js',
         './app/assets/javascripts/svg-layouts.js'],
'./app/assets/javascripts/generated/all-third.js', true);

// Creating the combined file for the modules-debug.js and config.js files
combine(['./app/modules-debug.js', './app/config.js'],
    './app/assets/javascripts/generated/all-app-debug.js', false);

// Creating the combined file for all our files
combine(paths, './app/assets/javascripts/generated/all-app.js', true);
