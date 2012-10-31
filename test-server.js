'use strict';

var express = require('express'),
    server = express(),
    fs = require('fs'),
    path = require('path');


server.configure(function() {
  server.use(express.logger('dev'));
  // 'static' is a reserved word so dot notation is not used to
  // avoid annoying the linter.
  server.use(express['static'](__dirname));
  // fallback to looking in assets
  server.use('/juju-ui', express['static'](__dirname + '/app/'));
  server.use(express.bodyParser());
  server.use(express.methodOverride());
});



var port = 8084;

server.listen(port, function() {
  console.log('Server listening on ' + port);
});

