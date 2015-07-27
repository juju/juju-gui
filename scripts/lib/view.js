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

var Handlebars = require('yui/handlebars').Handlebars,
    fs = require('fs'),
    cache = {};


function read(path, options, fn) {
  var str = cache[path];

  // cached (only if cached is a string and not a compiled template function)
  if (str && typeof str === 'string') {
    return fn(null, str);
  }

  // read
  fs.readFile(path, 'utf8', function(err, str) {
    if (err) {
      return fn(err);
    }
    if (options.cache) {
      cache[path] = str;
    }
    fn(null, str);
  });
}


exports.handlebars = function(path, options, fn) {
  var tmpl;
  read(path, options, function(err, str) {
    if (err) {
      console.log('error: ', err);
      return fn(err);
    }
    options.filename = path;
    tmpl = Handlebars.compile(str, options);
    fn(null, tmpl(options));
  });
};
