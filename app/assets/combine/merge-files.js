'use strict';

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

// Reading the 'requires' attribute of all our custom js files
(function() {
  function readdir(path) {
    var file, dirs = [], fileName, files = fs.readdirSync(path);

    Y.Array.each(files, function(value) {
      fileName = path + '/' + value;
      file = fs.statSync(fileName);

      if (file.isFile()) {
        if (syspath.extname(fileName).toLowerCase() === '.js') {
          if (syspath.join(process.cwd(), './app/modules-debug.js') ===
              fileName) {
            console.log('SKIPPING FILE -> ' + fileName);
          } else {
            paths.push(fileName);
          }
        }
      } else if (file.isDirectory()) {
        console.log('DIRECTORY -> ' + fileName);
        if (syspath.join(process.cwd(), './app/assets') === fileName) {
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
(function() {
  var loader, out,
      str = [],
      outputFile = syspath.join(process.cwd(),
          './app/assets/javascripts/generated/all-yui.js');
  loader = new Y.Loader({
    base: syspath.join(process.cwd(), './node_modules/yui/'),
    ignoreRegistered: true,
    require: reqs
  });
  out = loader.resolve(true);
  out.js.forEach(function(file) {
    console.log('file -> ' + file);
    str.push(fs.readFileSync(file, 'utf8'));
  });
  fs.writeFileSync(outputFile, str.join('\n'), 'utf8');
  minify(outputFile);
})();

// Creating the combined file for all the third part js code
(function() {
  var str = [],
      strDirectory = syspath.join(process.cwd(), './app/assets/javascripts/'),
      outputFile = syspath.join(process.cwd(),
          './app/assets/javascripts/generated/all-third.js');
  str.push(fs.readFileSync(strDirectory + 'd3.v2.min.js', 'utf8'));
  str.push(fs.readFileSync(strDirectory + 'reconnecting-websocket.js',
      'utf8'));
  str.push(fs.readFileSync(strDirectory + 'svg-layouts.js', 'utf8'));
  fs.writeFileSync(outputFile, str.join('\n'), 'utf8');
  minify(outputFile);
})();

//Creating the combined file for the modules-debug.js and config.js files
(function() {
  var str = [],
      outputFile = syspath.join(process.cwd(),
          './app/assets/javascripts/generated/all-app-debug.js');
  str.push(fs.readFileSync(syspath.join(process.cwd(),
      './app/modules-debug.js'), 'utf8'));
  str.push(fs.readFileSync(syspath.join(process.cwd(), './app/config.js'),
      'utf8'));
  fs.writeFileSync(outputFile, str.join('\n'), 'utf8');
})();

// Creating the combined file for all our files
(function() {
  var str = [],
      outputFile = syspath.join(process.cwd(),
          './app/assets/javascripts/generated/all-app.js');
  Y.Array.each(paths, function(file) {
    console.log('file -> ' + file);
    str.push(fs.readFileSync(file, 'utf8'));
  });
  fs.writeFileSync(outputFile, str.join('\n'), 'utf8');
  minify(outputFile);
})();

