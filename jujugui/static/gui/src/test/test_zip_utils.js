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

    describe('splitPath', function() {

      it('correctly splits a full path', function() {
        var pathInfo = ziputils.splitPath('/my/path/filename.ext');
        assert.strictEqual(pathInfo.dirname, '/my/path');
        assert.strictEqual(pathInfo.basename, 'filename.ext');
      });

      it('correctly splits a relative path', function() {
        var pathInfo = ziputils.splitPath('relative/filename.ext');
        assert.strictEqual(pathInfo.dirname, 'relative');
        assert.strictEqual(pathInfo.basename, 'filename.ext');
      });

      it('correctly splits a directory path', function() {
        var pathInfo = ziputils.splitPath('/my/path/');
        assert.strictEqual(pathInfo.dirname, '/my/path');
        assert.strictEqual(pathInfo.basename, '');
      });

      it('correctly splits a file path', function() {
        var pathInfo = ziputils.splitPath('filename.ext');
        assert.strictEqual(pathInfo.dirname, '');
        assert.strictEqual(pathInfo.basename, 'filename.ext');
      });

    });

    describe('findCharmEntries', function() {

      it('finds all the charm interesting files', function() {
        var configEntry = {directory: false, filename: '/foo/config.yaml'};
        var metadataEntry = {directory: false, filename: '/foo/metadata.yaml'};
        var readmeEntry = {directory: false, filename: '/foo/README.rst'};
        var revisionEntry = {directory: false, filename: '/foo/revision'};
        var allEntries = [
          {directory: false, filename: 'file1.py'},
          {directory: true, filename: 'foo'},
          configEntry,
          {directory: false, filename: '/foo/file2.yaml'},
          metadataEntry,
          revisionEntry,
          {directory: false, filename: '/foo/file2.yaml'},
          readmeEntry
        ];
        var expectedEntries = {
          config: configEntry,
          metadata: metadataEntry,
          readme: readmeEntry,
          revision: revisionEntry
        };
        var entries = ziputils.findCharmEntries(allEntries);
        assert.deepEqual(entries, expectedEntries);
      });

      it('returns the entries found, even if some are missing', function() {
        var metadataEntry = {directory: false, filename: 'metadata.yaml'};
        var revisionEntry = {directory: false, filename: 'revision'};
        var allEntries = [
          metadataEntry,
          {directory: false, filename: 'HACKING.rst'},
          revisionEntry,
          {directory: false, filename: 'tests/setup.py'}
        ];
        var expectedEntries = {
          metadata: metadataEntry,
          revision: revisionEntry
        };
        var entries = ziputils.findCharmEntries(allEntries);
        assert.deepEqual(entries, expectedEntries);
      });

      it('returns an empty object if no entries are found', function() {
        var allEntries = [
          {directory: true, filename: 'mycharm'},
          {directory: true, filename: 'mycharm/hooks'},
          {directory: false, filename: 'mycharm/hooks/start'}
        ];
        var entries = ziputils.findCharmEntries(allEntries);
        assert.deepEqual(entries, {});
      });

      it('ignores pseudo entries in non-charm-root directories', function() {
        var metadataEntry = {
          directory: false,
          filename: '/mycharm/metadata.yaml'
        };
        var readmeEntry = {directory: false, filename: '/mycharm/README'};
        var allEntries = [
          {directory: true, filename: 'mycharm'},
          metadataEntry,
          {directory: true, filename: 'mycharm/hooks'},
          // Since we already know the charm root is "mycharm/", the config
          // found in the "mycharm/hooks/"" directory is ignored.
          {directory: false, filename: 'mycharm/hooks/config.yaml'},
          readmeEntry,
          // Since we already know the charm root is "mycharm/", the revision
          // found in the zip root directory is ignored.
          {directory: false, filename: 'revision'}
        ];
        var expectedEntries = {
          metadata: metadataEntry,
          readme: readmeEntry
        };
        var entries = ziputils.findCharmEntries(allEntries);
        assert.deepEqual(entries, expectedEntries);
      });

      it('finds exotic documentation files', function() {
        var entries, readmeEntry;
        var readmeNames = ['README.txt', 'ReadMeCarefully.md', 'readme'];
        readmeNames.forEach(function(name) {
          readmeEntry = {directory: false, filename: name};
          entries = ziputils.findCharmEntries([readmeEntry]);
          assert.deepEqual(entries, {readme: readmeEntry}, name);
        });
      });

      it('excludes directories', function() {
        var configEntry = {directory: false, filename: '/mycharm/config.yaml'};
        var allEntries = [
          configEntry,
          // The following directories are excluded even if their names match.
          {directory: true, filename: '/mycharm/metadata.yaml'},
          {directory: true, filename: '/mycharm/revision'}
        ];
        var expectedEntries = {config: configEntry};
        var entries = ziputils.findCharmEntries(allEntries);
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
