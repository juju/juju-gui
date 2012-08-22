#!/usr/bin/node

var server = require("./lib/server.js");

server.server.listen(port, function () {
    console.log('Server listening on ' + port);
});
