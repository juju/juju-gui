/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const zip = require('../assets/javascripts/zip');
const zipUtils = require('./zip-utils');

// XXX: disabled until we figure out how to mock required modules.
xdescribe('Zip utils', function() {
  describe('getEntries', function() {
    var callback, errback;
    var createReaderMock;
    var file = 'a file object';

    beforeEach(function() {
      // Patch the zip library.
      createReaderMock = sinon.stub(zip, 'createReader');
      // Set up the callback and errback mocks.
      callback = sinon.stub();
      errback = sinon.stub();
    });

    afterEach(function() {
      createReaderMock.restore();
    });

    // Return an object including the arguments passed when calling the
    // createReaderMock.
    var getCreateReaderArgs = function() {
      // Ensure createReaderMock has been called one time,
      // with three arguments.
      assert.strictEqual(createReaderMock.callCount, 1);
      var args = createReaderMock.lastCall.args;
      assert.strictEqual(args.length, 3);
      return {reader: args[0], callback: args[1], errback: args[2]};
    };

    it('creates a zip reader as a blob', function() {
      zipUtils.getEntries(file, callback, errback);
      // The zip reader factory has been properly called, passing a blob
      // reader for the given file, and two function callbacks.
      var args = getCreateReaderArgs();
      assert.strictEqual(args.reader.constructor, zip.BlobReader);
      assert.strictEqual(typeof args.callback, 'function');
      assert.strictEqual(typeof args.errback, 'function');
    });

    it('creates a zip reader passing a well formed callback', function() {
      zipUtils.getEntries(file, callback, errback);
      var args = getCreateReaderArgs();
      // Set up a reader mock.
      var reader = {
        getEntries: sinon.stub(),
        close: sinon.stub()
      };
      // Call the callback used to build the zip reader.
      args.callback(reader);
      // Ensure our reader.getEntries mock has been called, and retrieve
      // its single argument, which should be a function.
      assert.strictEqual(reader.getEntries.callCount, 1);
      var getEntriesArgs = reader.getEntries.lastCall.args;
      assert.strictEqual(getEntriesArgs.length, 1);
      // Call the reader.getEntries callback.
      var entries = ['first-entry', 'second-entry'];
      var getEntriesCallback = getEntriesArgs[0];
      getEntriesCallback(entries);
      // At this point the original callback passed to getEntries has been
      // called, and the reader itself closed.
      assert.strictEqual(callback.callCount, 1);
      assert.strictEqual(callback.lastCall.args[0], entries);
      assert.strictEqual(reader.close.callCount, 1);
    });

    it('creates a zip reader passing a well formed errback', function() {
      zipUtils.getEntries(file, callback, errback);
      var args = getCreateReaderArgs();
      // Call the errback passed zip.createReader.
      args.errback('bad wolf');
      // Ensure our original errback has been called.
      assert.strictEqual(errback.callCount, 1);
      assert.strictEqual(errback.lastCall.args[0], 'bad wolf');
    });

  });

  describe('splitPath', function() {

    it('correctly splits a full path', function() {
      var pathInfo = zipUtils.splitPath('/my/path/filename.ext');
      assert.strictEqual(pathInfo.dirname, '/my/path');
      assert.strictEqual(pathInfo.basename, 'filename.ext');
    });

    it('correctly splits a relative path', function() {
      var pathInfo = zipUtils.splitPath('relative/filename.ext');
      assert.strictEqual(pathInfo.dirname, 'relative');
      assert.strictEqual(pathInfo.basename, 'filename.ext');
    });

    it('correctly splits a directory path', function() {
      var pathInfo = zipUtils.splitPath('/my/path/');
      assert.strictEqual(pathInfo.dirname, '/my/path');
      assert.strictEqual(pathInfo.basename, '');
    });

    it('correctly splits a file path', function() {
      var pathInfo = zipUtils.splitPath('filename.ext');
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
      var entries = zipUtils.findCharmEntries(allEntries);
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
      var entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

    it('returns an empty object if no entries are found', function() {
      var allEntries = [
        {directory: true, filename: 'mycharm'},
        {directory: true, filename: 'mycharm/hooks'},
        {directory: false, filename: 'mycharm/hooks/start'}
      ];
      var entries = zipUtils.findCharmEntries(allEntries);
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
      var entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

    it('finds exotic documentation files', function() {
      var entries, readmeEntry;
      var readmeNames = ['README.txt', 'ReadMeCarefully.md', 'readme'];
      readmeNames.forEach(function(name) {
        readmeEntry = {directory: false, filename: name};
        entries = zipUtils.findCharmEntries([readmeEntry]);
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
      var entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

  });

  describe('readCharmEntries', function() {
    var callback, entries;

    // Create and return a mock entry object.
    var makeEntry = function() {
      return {getData: sinon.stub()};
    };

    // Retrieve the callback passed to the getData method of the given mock
    // entry object. Then call the callback with the given text.
    var callGetDataCallback = function(entry, text) {
      var callback = entry.getData.lastCall.args[1];
      callback(text);
    };

    beforeEach(function() {
      // Set up the callback and entries mocks.
      callback = sinon.stub();
      entries = {file1: makeEntry(), file2: makeEntry()};
    });

    it('reads data from each entry', function() {
      zipUtils.readCharmEntries(entries, callback);
      Object.keys(entries).forEach(name => {
        const entry = entries[name];
        // The getData has been called on the entry.
        assert.strictEqual(entry.getData.callCount, 1);
        // The TextWriter and a callback function has been passed to getData.
        var getDataArgs = entry.getData.lastCall.args;
        assert.strictEqual(getDataArgs.length, 2, name);
        assert.strictEqual(getDataArgs[0].constructor, zip.TextWriter, name);
        assert.strictEqual(typeof getDataArgs[1], 'function', name);
      });
    });

    it('waits for all the contents to be ready', function() {
      zipUtils.readCharmEntries(entries, callback);
      // Call the getData callback passing the text contents.
      callGetDataCallback(entries.file1, 'space, the final frontier');
      // Ensure the global callback has not been called.
      assert.strictEqual(callback.callCount, 0);
    });

    it('calls the given callback when the contents are ready', function() {
      zipUtils.readCharmEntries(entries, callback);
      // Call all the getData callbacks passing the text contents.
      callGetDataCallback(entries.file1, 'space, the final frontier');
      callGetDataCallback(entries.file2, 'these are the voyages');
      // Ensure the global callback has been called with the correct data.
      assert.strictEqual(callback.callCount, 1);
      var callbackArgs = callback.lastCall.args;
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
