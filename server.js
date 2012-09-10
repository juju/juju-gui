#!/usr/bin/node

"use strict";

var server = require("./lib/server.js"),
    config = require("./config").config.server;

var port = config.port || process.env.PORT || 8888;

server.server.listen(port, function () {
    console.log('Server listening on ' + port);
});
