'use strict';

const through = require('through2');

module.exports = file => {
  if (!file.endsWith('.scss')) {
    return through();
  }
  return through((buffer, encoding, next) => {
    next();
  });
};
