'use strict';

const zip = require('zip');

/**
 Helper functions for working on zip files.
*/

let zipUtils = {};

/**
  Get the list of entries included in the given zip file object.
  Call the given callback passing object of entries.
  If an error occurs, call the given errback function passing the error.

  @method getEntries
  @param {Object} file The zip file object to be opened and red.
  @param {Function} callback A function called with the array of zip entries.
  @param {Function} errback A function called if any errors occur.
*/
var getEntries = function(file, callback, errback) {
  const loader = new FileReader();
  loader.addEventListener('onerror', errback);
  loader.addEventListener('loadend', function(evt) {
    const data = new Buffer(evt.target.result);
    const reader = zip.Reader(data);
    const entries = reader.toObject();
    callback(entries);
  });
  loader.readAsArrayBuffer(file);
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
  @param {Array} allEntries The object of all the zip entries.
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
  Object.keys(allEntries).forEach(function(entry) {
    var pathInfo = splitPath(entry);
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
      entries[attr] = allEntries[entry];
      return;
    }
    // Check if this looks like a readme file. If so, include it in the
    // entries object.
    if (pathInfo.basename.toLowerCase().slice(0, 6) === 'readme') {
      entries.readme = allEntries[entry];
    }
  });
  return entries;
};
zipUtils.findCharmEntries = findCharmEntries;

/**
  Read the contents of each entry in entries. When done, call the given
  callback passing an object mapping file names to file contents.

  @method readCharmEntries
  @param {Object} entries An object mapping file names to zip entries.
  @param {Function} callback A function to be called when the contents are
    ready.
*/
var readCharmEntries = function(entries, callback) {
  var contents = Object.create(null);
  Object.keys(entries).forEach(name => {
    const entry = entries[name];
    const decoder = new TextDecoder();
    contents[name] = decoder.decode(entry);
  });
  callback(contents);
};
zipUtils.readCharmEntries = readCharmEntries;

module.exports = zipUtils;
