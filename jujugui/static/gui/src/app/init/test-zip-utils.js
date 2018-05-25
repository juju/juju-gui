/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const zipUtils = require('./zip-utils');

describe('Zip utils', function() {
  let entries;

  beforeEach(function() {
    entries = ['readme', 'version'];
    const ReaderStub = sinon.stub().returns({
      toObject: sinon.stub().returns(entries)
    });
    zipUtils.__Rewire__('zip', {
      Reader: ReaderStub,
      createReader: null
    });
  });

  afterEach(function() {
    zipUtils.__ResetDependency__('zip');
  });

  describe('getEntries', function() {
    let addEventListenerMock, callback, errback, _FileReader;
    const file = 'a file object';

    beforeEach(function() {
      _FileReader = window.FileReader;
      addEventListenerMock = sinon.stub();
      const fileReader = function() {};
      fileReader.prototype.addEventListener = addEventListenerMock;
      fileReader.prototype.readAsArrayBuffer = sinon.stub();
      window.FileReader = fileReader;
      // Set up the callback and errback mocks.
      callback = sinon.stub();
      errback = sinon.stub();
    });

    afterEach(function() {
      window.FileReader = _FileReader;
    });

    it('can get entries from a zip file', function() {
      addEventListenerMock.withArgs('loadend').callsArgWith(1, {
        target: {
          result: 'file'
        }
      });
      zipUtils.getEntries(file, callback, errback);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0][0], entries);
    });

    it('can handle errors when getting entries', function() {
      addEventListenerMock.withArgs('onerror').callsArg(1);
      zipUtils.getEntries(file, callback, errback);
      assert.equal(errback.callCount, 1);
    });
  });

  describe('splitPath', function() {
    it('correctly splits a full path', function() {
      const pathInfo = zipUtils.splitPath('/my/path/filename.ext');
      assert.strictEqual(pathInfo.dirname, '/my/path');
      assert.strictEqual(pathInfo.basename, 'filename.ext');
    });

    it('correctly splits a relative path', function() {
      const pathInfo = zipUtils.splitPath('relative/filename.ext');
      assert.strictEqual(pathInfo.dirname, 'relative');
      assert.strictEqual(pathInfo.basename, 'filename.ext');
    });

    it('correctly splits a directory path', function() {
      const pathInfo = zipUtils.splitPath('/my/path/');
      assert.strictEqual(pathInfo.dirname, '/my/path');
      assert.strictEqual(pathInfo.basename, '');
    });

    it('correctly splits a file path', function() {
      const pathInfo = zipUtils.splitPath('filename.ext');
      assert.strictEqual(pathInfo.dirname, '');
      assert.strictEqual(pathInfo.basename, 'filename.ext');
    });
  });

  describe('findCharmEntries', function() {
    it('finds all the charm interesting files', function() {
      const configEntry = '/foo/config.yaml contents';
      const metadataEntry = '/foo/metadata.yaml contents';
      const readmeEntry = '/foo/README.rst contents';
      const revisionEntry = '/foo/revision contents';
      const allEntries = {
        'file1.py': 'file1.py contents',
        'foo': 'foo contents',
        '/foo/config.yaml': configEntry,
        '/foo/file2.yaml': '/foo/file2.yaml contents',
        '/foo/metadata.yaml': metadataEntry,
        '/foo/revision': revisionEntry,
        '/foo/file2.yaml': '/foo/file2.yaml contents',
        '/foo/README.rst': readmeEntry
      };
      const expectedEntries = {
        config: configEntry,
        metadata: metadataEntry,
        readme: readmeEntry,
        revision: revisionEntry
      };
      const entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

    it('returns the entries found, even if some are missing', function() {
      const metadataEntry = 'metadata.yaml contents';
      const revisionEntry = 'revision contents';
      const allEntries = {
        'metadata.yaml': metadataEntry,
        'HACKING.rst': 'HACKING.rst contents',
        'revision': revisionEntry,
        'tests/setup.py': 'tests/setup.py contents'
      };
      const expectedEntries = {
        metadata: metadataEntry,
        revision: revisionEntry
      };
      const entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

    it('returns an empty object if no entries are found', function() {
      const allEntries = {
        'mycharm': 'mycharm contents',
        'mycharm/hooks': 'mycharm/hooks contents',
        'mycharm/hooks/start': 'mycharm/hooks/start contents'
      };
      const entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, {});
    });

    it('ignores pseudo entries in non-charm-root directories', function() {
      const metadataEntry = '/mycharm/metadata.yaml contents';
      const readmeEntry = '/mycharm/README contents';
      const allEntries = {
        'mycharm': 'mycharm contents',
        '/mycharm/metadata.yaml': metadataEntry,
        'mycharm/hooks': 'mycharm/hooks contents',
        // Since we already know the charm root is "mycharm/", the config
        // found in the "mycharm/hooks/"" directory is ignored.
        'mycharm/hooks/config.yaml': 'mycharm/hooks/config.yaml contents',
        '/mycharm/README': readmeEntry,
        // Since we already know the charm root is "mycharm/", the revision
        // found in the zip root directory is ignored.
        'revision': 'revision contents'
      };
      const expectedEntries = {
        metadata: metadataEntry,
        readme: readmeEntry
      };
      const entries = zipUtils.findCharmEntries(allEntries);
      assert.deepEqual(entries, expectedEntries);
    });

    it('finds exotic documentation files', function() {
      let entries, readmeEntry;
      const readmeNames = ['README.txt', 'ReadMeCarefully.md', 'readme'];
      readmeNames.forEach(function(name) {
        let allEntries = {};
        readmeEntry = `${name} contents`;
        allEntries[name] = readmeEntry;
        entries = zipUtils.findCharmEntries(allEntries);
        assert.deepEqual(entries, {readme: readmeEntry}, name);
      });
    });
  });

  describe('readCharmEntries', function() {
    let callback, entries;

    beforeEach(function() {
      callback = sinon.stub();
      const encoder = new TextEncoder();
      entries = {
        file1: encoder.encode('file1 contents'),
        file2: encoder.encode('file2 contents')
      };
    });

    it('reads data from each entry', function() {
      zipUtils.readCharmEntries(entries, callback);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0][0], {
        file1: 'file1 contents',
        file2: 'file2 contents'
      });
    });
  });
});
