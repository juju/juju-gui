#!/usr/bin/node

var express = require("express"),
    server = express.createServer(
        express.logger(),
        express.bodyParser()
);

server.configure(function () {
    server.use(express.static(__dirname + '/app/'));

});
// Handles requests to the root path ("/") my simply sending the "shell" page
// which creates the `Y.App` instance.
server.get('/', function (req, res) {
    res.sendfile('app/index.html');
});


server.listen(process.env.PORT || 8888);
