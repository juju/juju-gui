var express = require("express"),
    server = express(),
    fs = require("fs"),
    path = require("path"),
    YUI = require("yui").YUI,
    pubDir = __dirname + "/../app",
    handlebars  = require("yui/handlebars").Handlebars,
    Templates = require("./templates.js"),
    view = require("./view.js");

port = process.env.PORT || 8888;
templateDir = __dirname + "/../app/templates";

server.configure(function () {
    server.set("views", __dirname + "/../views/");
    server.set("view engine", "handlebars");
    server.set("view options", {layout: false});
    server.engine("handlebars", view.handlebars);

    server.use(express.logger("dev"));
    server.use(express.static(pubDir));
});

// Handles requests to the root path ("/") my simply sending the "shell" page
// which creates the `Y.App` instance.

server.get('/stats/', function(req, res) {
    res.json({
	uptime: process.uptime(),
	memory: process.memoryUsage()
    });
});

server.get('/templates.js', function(req, res) {
    var precompiled = Templates.getPrecompiled(),
        templates = [];

    Y = YUI();
    Y.Object.each(precompiled, function (template, name) {
        templates.push({
            name    : name,
            template: template
        });
    });
    res.render('templates', {templates: templates});
});

            
server.get('*', function (req, res) {
    res.sendfile('app/index.html');
});

// server.get('*', function (req, res) {
//         res.redirect('/#' + req.url);
// });



exports.server = server;