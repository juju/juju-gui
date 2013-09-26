/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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
    http = require('http'),
    fs = require('fs'),
    path = require('path');

var app = express();
app.configure(function() {

  app.use(express.logger('dev'));
  // 'static' is a reserved word so dot notation is not used to
  // avoid annoying the linter.
  app.use(express['static'](__dirname));
  // fallback to looking in assets
  app.use('/juju-ui', express['static'](
      __dirname + '/build-' + process.argv[2] + '/juju-ui'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

app.get('/juju-ui/:file', function(req, res) {
  var fileName = req.params.file;
  res.sendfile('build-' + process.argv[2] + '/juju-ui/' + fileName);
});

var server = http.createServer(app);
server.listen(0);
console.log('http://0.0.0.0:' + server.address().port + '/test/index.html');
