/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2014 Canonical Ltd.

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

/**
 * Helper functions for working on zip files.
 *
 * @module zip-utils
 */

YUI.add('zip-utils', function(Y) {

  // Configure the zip.js library. The workerScriptsPath must point to the
  // location of inflate.zip and deflate.zip.
  zip.workerScriptsPath = '/juju-ui/assets/javascripts/';

  var module = Y.namespace('juju.ziputils');

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
  module.getEntries = getEntries;

  /**
    Return the lower-cased base name corresponding to the given path.

    @method lowerBasename
    @param {String} path A file path.
    @return {String} The resulting base name, lower-cased.
  */
  var lowerBasename = function(path) {
    return path.split('/').pop().toLowerCase();
  };
  module.lowerBasename = lowerBasename;

  /**
    Return a function accepting a zip entry and returning true if the entry
    lower-cased base name is in the given names, false otherwise.

    @method entryNameIn
    @param {Array} names The name choices as an array of strings.
    @return {Function} The resulting validation function.
  */
  var entryNameIn = function(names) {
    return function(entry) {
      var name = lowerBasename(entry.filename);
      // We are not interested in directories, we are only looking for files.
      return !entry.directory && names.indexOf(name) !== -1;
    };
  };
  module.entryNameIn = entryNameIn;

  /**
    Add to the given current object a key/value pair where:
      - key is the lower-cased base name of the given entry;
      - value is the entry object itself.
    This is useful when reducing entries (see getEntriesByNames below).

    @method addByName
    @param {Object} current The object to populate with key/value pairs.
    @param {Object} entry A zip entry object.
    @return {Object} The modified current object.
  */
  var addByName = function(current, entry) {
    var newCurrent = Y.merge(current);
    newCurrent[lowerBasename(entry.filename)] = entry;
    return newCurrent;
  };
  module.addByName = addByName;

  /**
    Given a list of zip entries and a list of base names, filter the entries
    and return an object mapping base names to entries.

    @method getEntriesByNames
    @param {Array} entries The list of all the zip entries.
    @param {Array} names The name choices as an array of strings.
    @return {Object} The resulting key/value pairs.
  */
  var getEntriesByNames = function(entries, names) {
    var filteredEntries = entries.filter(entryNameIn(names));
    return filteredEntries.reduce(addByName, Object.create(null));
  };
  module.getEntriesByNames = getEntriesByNames;

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
    var entriesNum = Y.Object.size(entries);
    Y.Object.each(entries, function(entry, name) {
      // Read the entry's contents.
      entry.getData(new zip.TextWriter(), function(text) {
        contents[name] = text;
        // If all the files have been processed, call the callback passing the
        // aggregated results.
        if (Y.Object.size(contents) === entriesNum) {
          callback(contents);
        }
      });
    });
  };
  module.readCharmEntries = readCharmEntries;

}, '0.1.0', {
  requires: [
    'base',
    'zip'
  ]
});
