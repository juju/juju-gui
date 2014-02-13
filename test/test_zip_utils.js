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

(function() {

  describe('Zip utils', function() {
    var testUtils, Y, ziputils;
    var requirements = ['juju-tests-utils', 'zip-utils'];

    before(function(done) {
      // Set up the YUI instance, the test utils and the zip namespace.
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        testUtils = Y.namespace('juju-tests.utils');
        ziputils = Y.namespace('juju.ziputils');
        done();
      });
    });

    describe('getEntries', function() {
      var callback, errback;
      var createReaderMock;
      var file = 'a file object';

      beforeEach(function() {
        // Patch the zip library.
        createReaderMock = testUtils.makeStubMethod(zip, 'createReader');
        // Set up the callback and errback mocks.
        callback = testUtils.makeStubFunction();
        errback = testUtils.makeStubFunction();
      });

      afterEach(function() {
        createReaderMock.reset();
      });

      // Return an object including the arguments passed when calling the
      // createReaderMock.
      var getCreateReaderArgs = function() {
        // Ensure createReaderMock has been called one time,
        // with three arguments.
        assert.strictEqual(createReaderMock.callCount(), 1);
        var args = createReaderMock.lastArguments();
        assert.strictEqual(args.length, 3);
        return {reader: args[0], callback: args[1], errback: args[2]};
      };

      it('creates a zip reader as a blob', function() {
        ziputils.getEntries(file, callback, errback);
        // The zip reader factory has been properly called, passing a blob
        // reader for the given file, and two function callbacks.
        var args = getCreateReaderArgs();
        assert.strictEqual(args.reader.constructor, zip.BlobReader);
        assert.strictEqual(typeof args.callback, 'function');
        assert.strictEqual(typeof args.errback, 'function');
      });

      it('creates a zip reader passing a well formed callback', function() {
        ziputils.getEntries(file, callback, errback);
        var args = getCreateReaderArgs();
        // Set up a reader mock.
        var reader = {
          getEntries: testUtils.makeStubFunction(),
          close: testUtils.makeStubFunction()
        };
        // Call the callback used to build the zip reader.
        args.callback(reader);
        // Ensure our reader.getEntries mock has been called, and retrieve
        // its single argument, which should be a function.
        assert.strictEqual(reader.getEntries.callCount(), 1);
        var getEntriesArgs = reader.getEntries.lastArguments();
        assert.strictEqual(getEntriesArgs.length, 1);
        // Call the reader.getEntries callback.
        var entries = ['first-entry', 'second-entry'];
        var getEntriesCallback = getEntriesArgs[0];
        getEntriesCallback(entries);
        // At this point the original callback passed to getEntries has been
        // called, and the reader itself closed.
        assert.strictEqual(callback.callCount(), 1);
        assert.strictEqual(callback.lastArguments()[0], entries);
        assert.strictEqual(reader.close.callCount(), 1);
      });

      it('creates a zip reader passing a well formed errback', function() {
        ziputils.getEntries(file, callback, errback);
        var args = getCreateReaderArgs();
        // Call the errback passed zip.createReader.
        args.errback('bad wolf');
        // Ensure our original errback has been called.
        assert.strictEqual(errback.callCount(), 1);
        assert.strictEqual(errback.lastArguments()[0], 'bad wolf');
      });

    });

    describe('lowerBasename', function() {

      it('returns the lower-cased base name of the given path', function() {
        var name = ziputils.lowerBasename('/my/path/to/File.EXT');
        assert.strictEqual(name, 'file.ext');
      });

      it('works when a base name is given instead of a full path', function() {
        var name = ziputils.lowerBasename('file.tar.gz');
        assert.strictEqual(name, 'file.tar.gz');
      });

      it('returns an empty string when a directory is passed', function() {
        var name = ziputils.lowerBasename('/my/path/');
        assert.strictEqual(name, '');
      });

      it('returns an empty string when an empty string is passed', function() {
        var name = ziputils.lowerBasename('');
        assert.strictEqual(name, '');
      });

    });

    describe('entryNameIn', function() {
      var names = ['these', 'are', 'the', 'voyages'];
      var func;

      beforeEach(function() {
        // Retrieve the resulting function.
        func = ziputils.entryNameIn(names);
      });

      it('returns a function', function() {
        assert.strictEqual(typeof func, 'function');
      });

      it('handles entries contained in the given choices', function() {
        var entry = {directory: false, filename: 'voyages'};
        assert.strictEqual(func(entry), true);
      });

      it('checks entries by their lower cased base name', function() {
        var entry = {directory: false, filename: '/path/to/Voyages'};
        assert.strictEqual(func(entry), true);
      });

      it('handles entries excluded from the given choices', function() {
        var entry = {directory: false, filename: 'bad-choice'};
        assert.strictEqual(func(entry), false);
      });

      it('does not include directory entries', function() {
        var entry = {directory: true, filename: 'voyages'};
        assert.strictEqual(func(entry), false);
      });

    });

    describe('addByName', function() {
      var current;

      beforeEach(function() {
        // Set up the current object.
        current = Object.create(null);
      });

      it('correctly adds the entry to the current object', function() {
        var entry = {filename: 'myfile.zip'};
        var newCurrent = ziputils.addByName(current, entry);
        assert.deepEqual(newCurrent, {'myfile.zip': entry});
      });

      it('adds the entry storing its lower cased base name', function() {
        var entry = {filename: '/path/to/MyFile.ZIP'};
        var newCurrent = ziputils.addByName(current, entry);
        assert.deepEqual(newCurrent, {'myfile.zip': entry});
      });

      it('does not modify the current object in place', function() {
        var entry = {filename: 'myfile.zip'};
        ziputils.addByName(current, entry);
        assert.deepEqual(current, {});
      });

    });

    describe('getEntriesByNames', function() {
      var names = ['file1.txt', 'file2.yaml'];
      var allEntries = [
        {directory: false, filename: 'bad-file1'},
        {directory: true, filename: 'file1.txt'},  // This is a dir.
        // The last two entries should be included in the returned object.
        {directory: false, filename: '/path/to/File1.TXT'},
        {directory: false, filename: 'file2.yaml'}
      ];

      it('filters and returns the requested entries', function() {
        var entries = ziputils.getEntriesByNames(allEntries, names);
        var expectedEntries = {
          'file1.txt': allEntries[2],
          'file2.yaml': allEntries[3]
        };
        assert.deepEqual(entries, expectedEntries);
      });

    });

    describe('readCharmEntries', function() {
      var callback, entries, textWriterMock;

      // Create and return a mock entry object.
      var makeEntry = function() {
        return {getData: testUtils.makeStubFunction()};
      };

      // Retrieve the callback passed to the getData method of the given mock
      // entry object. Then call the callback with the given text.
      var callGetDataCallback = function(entry, text) {
        var callback = entry.getData.lastArguments()[1];
        callback(text);
      };

      beforeEach(function() {
        // Set up the callback and entries mocks.
        callback = testUtils.makeStubFunction();
        entries = {file1: makeEntry(), file2: makeEntry()};
      });

      it('reads data from each entry', function() {
        ziputils.readCharmEntries(entries, callback);
        Y.Object.each(entries, function(entry, name) {
          // The getData has been called on the entry.
          assert.strictEqual(entry.getData.callCount(), 1);
          // The TextWriter and a callback function has been passed to getData.
          var getDataArgs = entry.getData.lastArguments();
          assert.strictEqual(getDataArgs.length, 2, name);
          assert.strictEqual(getDataArgs[0].constructor, zip.TextWriter, name);
          assert.strictEqual(typeof getDataArgs[1], 'function', name);
        });
      });

      it('waits for all the contents to be ready', function() {
        ziputils.readCharmEntries(entries, callback);
        // Call the getData callback passing the text contents.
        callGetDataCallback(entries.file1, 'space, the final frontier');
        // Ensure the global callback has not been called.
        assert.strictEqual(callback.callCount(), 0);
      });

      it('calls the given callback when the contents are ready', function() {
        ziputils.readCharmEntries(entries, callback);
        // Call all the getData callbacks passing the text contents.
        callGetDataCallback(entries.file1, 'space, the final frontier');
        callGetDataCallback(entries.file2, 'these are the voyages');
        // Ensure the global callback has been called with the correct data.
        assert.strictEqual(callback.callCount(), 1);
        var callbackArgs = callback.lastArguments();
        assert.strictEqual(callbackArgs.length, 1);
        var contents = callbackArgs[0];
        var expectedContents = {
          file1: 'space, the final frontier',
          file2: 'these are the voyages'
        };
        assert.deepEqual(contents, expectedContents);
      });

    });

  });

})();
