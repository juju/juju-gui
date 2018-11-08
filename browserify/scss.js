'use strict';

const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const through = require('through2');

module.exports = (browserify, options) => {
  const prod = options.prod === 'true';
  let files = {};
  browserify.transform(file => {
    if (!file.endsWith('.scss')) {
      return through();
    }
    return through((buffer, encoding, next) => {
      const compiled = sass.renderSync({
        data: buffer.toString('utf8'),
        includePaths: [
          './node_modules',
          // Include the file's path so that relative css @imports work.
          path.dirname(file)
        ],
        outputStyle: prod ? 'compressed' : 'nested'
      });
      files[file] = compiled.css;
      next();
    });
  });
  browserify.on('bundle', bundle => {
    if (prod && !options.file) {
      browserify.emit('error', 'You must provide an output --file path.');
    } else if (!prod && !options['build-dir']) {
      browserify.emit('error', 'You must provide a --build-dir path.');
    }
    bundle.on('end', () => {
      let output = '';
      Object.keys(files).forEach(filename => {
        if (prod) {
          output += files[filename];
        } else {
          // Create a file name from the whole filename path in case there are
          // multiple css files with the same name.
          const filepath = path.join(options['build-dir'], filename.replace(/\//g, '-'));
          // Write the individual files as browserifyinc only gets the changed files. We
          // concat all the files together in the Makefile.
          fs.writeFile(filepath, files[filename], error => {
            if (error) {
              browserify.emit('error', error);
            }
          });
        }
      });
      if (prod) {
        // If this is for prod then we can build all the CSS to one file.
        fs.writeFile(options.file, output, error => {
          if (error) {
            browserify.emit('error', error);
          }
        });
      }
    });
  });
};
