'use strict';

var Handlebars = require('yui/handlebars').Handlebars,
    fs = require('fs'),
    cache = {};


function read(path, options, fn) {
  var str = cache[path];

  // cached (only if cached is a string and not a compiled template function)
  if (str && typeof str === 'string') return fn(null, str);

  // read
  fs.readFile(path, 'utf8', function(err, str) {
    if (err) return fn(err);
    if (options.cache) cache[path] = str;
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
