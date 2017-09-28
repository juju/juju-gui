/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const zip = require('../assets/javascripts/zip');

/**
 Helper functions for working on zip files.
*/

let zipUtils = {};

// Configure the zip.js library. The workerScriptsPath must point to the
// location of inflate.zip and deflate.zip.
if (window.juju_config && window.juju_config.staticURL) {
  zip.workerScriptsPath = window.juju_config.staticURL +
      '/combo?app/assets/javascripts/';
} else {
  zip.workerScriptsPath = 'static/gui/build/app/assets/javascripts/';
}

/**
  Get the list of entries included in the given zip file object.
  Call the given callback passing an array of entry objects
  (see http://gildas-lormeau.github.io/zip.js/core-api.html#zip-entry).
  If an error occurs, call the given errback function passing the error.

  @method getEntries
  @param {Object} file The zip file object to be opened and red.
  @param {Function} callback A function called with the array of zip entries.
  @param {Function} errback A function called if any errors occur.
*/
var getEntries = function(file, callback, errback) {
  zip.createReader(
    new zip.BlobReader(file),
    function(reader) {
      reader.getEntries(function(entries) {
        callback(entries);
        reader.close();
      });
    },
    errback
  );
};
zipUtils.getEntries = getEntries;

/**
  Split the given path extracting the directory and base names.

  @method splitPath
  @param {String} path The file path.
  @return {Object} A map containing the "basename" and "dirname" keys.
*/
var splitPath = function(path) {
  var parts = path.split('/');
  var basename = parts.pop();
  return {basename: basename, dirname: parts.join('/')};
};
zipUtils.splitPath = splitPath;

/**
  Filter the entries and return an object including only the entries that
  are useful for charm introspection.

  This function reflects the parsing logic implemented in juju-core:
  see juju-core/state/apiserver/charms.go:findArchiveRootDir.

  @method findCharmEntries
  @param {Array} allEntries The list of all the zip entries
    (see http://gildas-lormeau.github.io/zip.js/core-api.html#zip-entry).
  @return {Object} An object mapping entry names to entry objects.
    The resulting map can include the following attributes:
      - metadata: the metadata.yaml entry, containing charm's meta info;
      - config: the config.yaml entry, containing charm options definition;
      - revision: the revision entry, likely including the revision number;
      - readme: the readme[.*] entry, containing the charm's documentation.
    If any entries are missing, the resulting attributes will be undefined.
*/
var findCharmEntries = function(allEntries) {
  var root = null;
  var entries = Object.create(null);
  // The nameAttrMap object maps file names to attributes in entries.
  var nameAttrMap = {
    'config.yaml': 'config',
    'metadata.yaml': 'metadata',
    'revision': 'revision'
  };
  allEntries.forEach(function(entry) {
    if (entry.directory) {
      // We are not interested in directories.
      return;
    }
    var pathInfo = splitPath(entry.filename);
    if (root !== null && root !== pathInfo.dirname) {
      // If we already know the charm root directory and this entry is not
      // in the root, then we can proceed without any further processing.
      return;
    }
    var attr = nameAttrMap[pathInfo.basename];
    if (attr) {
      // An interesting file has been found. This must be the charm's root
      // directory. Include the entry in the entries object.
      root = pathInfo.dirname;
      entries[attr] = entry;
      return;
    }
    // Check if this looks like a readme file. If so, include it in the
    // entries object.
    if (pathInfo.basename.toLowerCase().slice(0, 6) === 'readme') {
      entries.readme = entry;
    }
  });
  return entries;
};
zipUtils.findCharmEntries = findCharmEntries;

/**
  Read the contents of each entry in entries. When done, call the given
  callback passing an object mapping file names to file contents.

  @method readCharmEntries
  @param {Object} entries An object mapping file names to zip entries
    (see http://gildas-lormeau.github.io/zip.js/core-api.html#zip-entry).
  @param {Function} callback A function to be called when the contents are
    ready.
*/
var readCharmEntries = function(entries, callback) {
  var contents = Object.create(null);
  var entriesNum = Object.keys(entries).length;
  Object.keys(entries).forEach(name => {
    const entry = entries[name];
    // Read the entry's contents.
    // The zip.TextWriter handler fails silently in Firefox if the text
    // encoding argument is not explicitly passed.
    // See https://github.com/gildas-lormeau/zip.js/issues/58.
    try {
      entry.getData(new zip.TextWriter('utf-8'), function(text) {
        contents[name] = text;
        // If all the files have been processed, call the callback passing the
        // aggregated results.
        if (Object.keys(contents).length === entriesNum) {
          callback(contents);
        }
      });
    } catch (err) {
      console.error(
        'zip.TextWriter error reading ' + entry.filename + ': ' + err);
    }
  });
};
zipUtils.readCharmEntries = readCharmEntries;

module.exports = zipUtils;
