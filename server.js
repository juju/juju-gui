#!/usr/bin/node

'use strict';

// Serving of assets should be done relative to the project root.
// chdir into __dirname (of this module) so paths always work.
process.chdir(__dirname);

var server = require('./lib/server.js'),
    config = require('./config').config.server;

var port = config.port || process.env.PORT || 8888;

server.server.listen(port, function() {
  console.log('Server listening on ' + port);
});
