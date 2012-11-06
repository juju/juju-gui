// http://stackoverflow.com/questions/5348685/node-js-require-inheritance
YUI = require('yui').YUI;

var fs = require('fs'), syspath = require('path'), compressor = require('node-minify'), modules = {}, paths = [];

// Reading the 'requires' attribute of all our custom js files
(function() {
  // reading all JS files under './app'
  readdir('./app');
  console.log('FILES loaded');

  var originalAdd = YUI.add;
  // This is a trick to get the 'requires' value from the module definition
  YUI.add = function(name, fn, version, details) {
    modules[name] = [];
    if (details && details.requires) {
      loop(details.requires, function(value) {
        modules[name].push(value);
      });
    }
  };

  loop(paths, function(value) {
    try {
      // It triggers the custom 'add' method above
      require(value);
    } catch (e) {
      // If it fails it means the path points to a third-part js lib (d3
      // for example), so we dont need to worry about it.
    }
  });
  YUI.add = originalAdd;

  function readdir(path) {
    var file, dirs = [], fileName, files = fs.readdirSync(path);

    loop(files, function(value) {
      fileName = path + '/' + value;
      file = fs.statSync(fileName);

      if (file.isFile()) {
        if (syspath.extname(fileName).toLowerCase() === '.js') {
          if('./app/modules-debug.js' === fileName) {
            console.log('SKIPPING FILE -> ' + fileName);
          } else {
            paths.push(fileName);
          }
        }
      } else if (file.isDirectory()) {
        console.log('DIRECTORY -> ' + fileName);
        if ('./app/assets' === fileName) {
          console.log('SKIPPING DIRECTORY -> ' + fileName);
        } else {
          dirs.push(fileName);
        }
      }
    });

    loop(dirs, function(directory) {
      readdir(directory);
    });
  }
})();

// Getting all the YUI dependencies that we need
var reqs = (function() {
  var yuiRequirements = [], requires = null;
  for ( var key in modules) {
    if (!modules.hasOwnProperty(key)) {
      continue;
    }
    requires = modules[key];
    loop(requires, function(value) {
      if (!modules[value]) {
        // This is not one of our modules but a yui one.
        if (yuiRequirements.indexOf(value) < 0) {
          // avoid duplicates
          yuiRequirements.push(value);
        }
      }
    });
  }
  console.log('REQS loaded');
  return yuiRequirements;
})();

// Using the example http://yuilibrary.com/yui/docs/yui/loader-resolve.html
(function() {
  var Y, loader, out, str = [];
  Y = YUI();
  loader = new Y.Loader({
    base: syspath.join(__dirname, './node_modules/yui/'),
    ignoreRegistered: true,
    require: reqs
  });
  out = loader.resolve(true);
  out.js.forEach(function(file) {
    console.log('file -> ' + file);
    str.push(fs.readFileSync(file, 'utf8'));
  });
  fs.writeFileSync('./app/all-yui.js', str.join('\n'), 'utf8');
  minify('./app/all-yui.js');
})();

// Creating the combined file for all the third part js code
(function() {

  var strDirectory = './app/assets/javascripts/', str = [];
  str.push(fs.readFileSync(strDirectory + 'd3.v2.min.js', 'utf8'));
  str.push(fs.readFileSync(strDirectory + 'reconnecting-websocket.js', 'utf8'));
  str.push(fs.readFileSync(strDirectory + 'svg-layouts.js', 'utf8'));
  fs.writeFileSync('./app/all-third.js', str.join('\n'), 'utf8');
  minify('./app/all-third.js');
})();

//Creating the combined file for the modules-debug.js and config.js files
(function() {

  var str = [];
  str.push(fs.readFileSync('./app/modules-debug.js', 'utf8'));
  str.push(fs.readFileSync('./app/config.js', 'utf8'));
  fs.writeFileSync('./app/all-app-debug.js', str.join('\n'), 'utf8');
})();

// Creating the combined file for all our files
(function() {
  var str = [];
  loop(paths, function(file) {
    console.log('file -> ' + file);
    str.push(fs.readFileSync(file, 'utf8'));
  });
  fs.writeFileSync('./app/all-app.js', str.join('\n'), 'utf8');
  minify('./app/all-app.js');
})();

function minify(file) {
  new compressor.minify({
    type: 'uglifyjs',
    fileIn: file,
    fileOut: file,
    callback: function(err) {
      if(err) {
        console.log(err);
      }
    }
  });
}

function loop(arr, callback) {
  if (!arr) {
    return;
  }
  for ( var i = 0; i < arr.length; i++) {
    callback(arr[i]);
  }
}
