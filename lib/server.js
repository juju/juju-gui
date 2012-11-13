'use strict';

var express = require('express'),
    server = express(),
    fs = require('fs'),
    path = require('path'),
    config = require('../config').config.server,
    debugMode = (String(process.argv[2]).toLowerCase() === 'debug'),
    public_dir = config.public_dir,
    Templates = require('./templates.js'),
    view = require('./view.js');

/**
 * It finds a file under the given path. The first match wins.
 * @param path starting point
 * @param fileName name of the file to be found
 * @returns the file path
 */
function findFile(path, fileName) {
  var file, files = fs.readdirSync(path);
  for(var i = 0; i < files.length; i = i + 1) {
    if(files[i] === fileName) {
      return path + '/' + files[i];
    }
    file = fs.statSync(path + '/' + files[i]);
    if (file.isDirectory()) {
      file = findFile(path + '/' + files[i], fileName);
      if(file) {
        return file;
      }
    }
  }
  return null;
}

server.configure(function() {
  server.set('views', __dirname + './lib/views/');
  server.set('view engine', 'handlebars');
  server.set('view options', {layout: false});
  server.engine('handlebars', view.handlebars);

  server.use(express.logger('dev'));
  // 'static' is a reserved word so dot notation is not used to
  // avoid annoying the linter.
  server.use('/juju-ui', express['static'](public_dir));
});


// Run template generation on startup
Templates.renderTemplates();

// run the watch on the template dir
// with callback to regen static version
Templates.watchTemplates(function() {
  console.log('Regenerated Templates');
});

Templates.watchViews(function() {
  console.log('Regenerating Views');
});

// Handles requests to the root path ('/') my simply sending the 'shell' page
// which creates the `Y.App` instance.

server.get('/stats/', function(req, res) {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

server.get('/assets/all-third.js', function(req, res) {
  res.sendfile('app/assets/javascripts/generated/all-third.js');
});

server.get('/assets/stylesheets/:file', function(req, res) {
  var file, fileName = req.params.file;
  if(path.extname(fileName).toLowerCase() === '.css') {
    res.sendfile('app/assets/stylesheets/' + fileName);
  } else {
    // We've merged all the yui and third party files into a single css file.
    // YUI expects to load its images from the same path as its css files, so
    // we need to mock this position. When the system tries to load a resource
    // from "app/assets/stylesheets/", it tries to find this resource under the 
    // "./app/assets" directory. The first match wins. Another solution would
    // be to manually copy all the images we need to the 
    // "./app/assets/stylesheets" directory.
    // This is an example of image...
    // ./yui/datatable-sort/assets/skins/sam/sort-arrow-sprite-ie.png
    file = findFile('./app/assets', fileName);
    res.sendfile(file);
  }
});

server.get('/assets/modules.js', function(req, res) {
  if (debugMode) {
    res.sendfile('app/assets/javascripts/generated/all-app-debug.js');
  } else {
    res.sendfile('app/assets/javascripts/generated/all-app.js');
  }
});

server.get('/assets/yui.js', function(req, res) {
  if (debugMode) {
    res.sendfile('app/assets/javascripts/yui/yui/yui-debug.js');
  } else {
    res.sendfile('app/assets/javascripts/generated/all-yui.js');
  }
});

server.get('*', function(req, res) {
  res.sendfile('app/index.html');
});

exports.server = server;
