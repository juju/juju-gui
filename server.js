#!/usr/bin/node

var connect = require("connect"),
    express = require("express"),
    server = express.createServer(),
    pubDir = __dirname + "/app";

server.configure(function () {
    server.use(express.logger("dev"));
    server.use(express.static(pubDir));
});


// Handles requests to the root path ("/") my simply sending the "shell" page
// which creates the `Y.App` instance.
server.get('*', function (req, res) {
    res.sendfile('app/index.html');
});


var port = process.env.PORT || 8888;
server.listen(port, function () {
    console.log('Server listening on ' + port);
});
