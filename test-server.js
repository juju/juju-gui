/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012  Canonical Ltd.
Copyright (C) 2013  Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

// process.argv[2] will be 'debug' or 'prod'

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
  server.use('/juju-ui', express['static'](
      __dirname + '/build-' + process.argv[2] + '/juju-ui'));
  server.use(express.bodyParser());
  server.use(express.methodOverride());
});

server.get('/juju-ui/:file', function(req, res) {
  var fileName = req.params.file;
  res.sendfile('build-' + process.argv[2] + '/juju-ui/' + fileName);
});

var port = 8084;

server.listen(port, function() {
  console.log(process.argv[2] + ' server listening on ' + port);
});
