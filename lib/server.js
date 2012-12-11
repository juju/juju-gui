'use strict';

var express = require('express'),
    server = express(),
    fs = require('fs'),
    path = require('path'),
    config = require('../config').config.server,
    public_dir = config.public_dir,
    Templates = require('./templates.js'),
    view = require('./view.js');

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

server.get('/juju-ui/assets/:file', function(req, res) {
  var fileName = req.params.file;
  if ('all-yui.js' === fileName) {
    res.sendfile('app/assets/javascripts/yui/yui/yui-debug.js');
  } else if ('app.js' === fileName) {
    res.sendfile('app/app.js');
  } else if ('modules.js' === fileName) {
    res.sendfile('app/modules-debug.js');
  } else if ('config.js' === fileName) {
    res.sendfile('app/config.js');
  } else {
    res.sendfile('build/juju-ui/assets/' + fileName);
  }
});

server.get('/juju-ui/:file', function(req, res) {
  var fileName = req.params.file;
  res.sendfile('build/juju-ui/' + fileName);
});

server.get('/juju-ui/assets/combined-css/:file', function(req, res) {
  res.sendfile('build/juju-ui/assets/combined-css/' + req.params.file);
});

server.get('/favicon.ico', function(req, res) {
  res.sendfile('app/favicon.ico');
});

server.get('*', function(req, res) {
  res.sendfile('app/index.html');
});

exports.server = server;
