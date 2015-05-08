/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2015 Canonical Ltd.

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

describe('Bundle Importer', function() {
  var addCharms, bundleImporter, BundleImporter, getById, getChangeSet,
      loadCharm, notifications, utils;

  before(function(done) {
    YUI().use('bundle-importer', function(Y) {
      BundleImporter = Y.juju.BundleImporter;
      utils = window.jujuTestUtils.utils;
      done();
    });
  });

  beforeEach(function() {
    notifications = {
      add: utils.makeStubFunction()
    };
    loadCharm = utils.makeStubFunction();
    addCharms = utils.makeStubFunction();
    getById = utils.makeStubFunction();
    getChangeSet = utils.makeStubFunction();
    bundleImporter = new BundleImporter({
      env: {
        getChangeSet: getChangeSet
      },
      db: {
        notifications: notifications,
        charms: {
          add: addCharms,
          getById: getById
        }
      },
      fakebackend: {
        _loadCharm: loadCharm
      }
    });
  });

  afterEach(function() {

  });

  it('can be instantiated', function() {
    assert.equal(bundleImporter instanceof BundleImporter, true);
    assert.equal(typeof bundleImporter.env === 'object', true);
    assert.equal(typeof bundleImporter.db === 'object', true);
    assert.equal(typeof bundleImporter.fakebackend === 'object', true);
  });

  describe('Public methods', function() {
    describe('importBundleFile', function() {
      it('sets up and loads the FileReader', function() {
        var asText = utils.makeStubFunction();
        var generate = utils.makeStubMethod(
            bundleImporter, '_generateFileReader', {
              onload: '',
              readAsText: asText
            });
        var onload = utils.makeStubMethod(bundleImporter, '_fileReaderOnload');
        this._cleanups.concat([generate.reset, onload.reset]);
        var reader = bundleImporter.importBundleFile('path/to/file');
        assert.equal(generate.callCount(), 1);
        assert.equal(asText.callCount(), 1);
        reader.onload();
        assert.equal(onload.callCount(), 1);
      });

      describe('FileReader onload callback', function() {
        var file = { name: 'path/to/file.json' };
        it('shows notification if file contains invalid json', function() {
          bundleImporter._fileReaderOnload(file, {
            target: { result: '[invalid json]' }
          });
          assert.equal(notifications.add.callCount(), 1);
          assert.equal(notifications.add.lastArguments()[0].level, 'error');
        });

        it('shows notification before kicking off import', function() {
          var importStub = utils.makeStubMethod(
              bundleImporter, 'importBundleDryRun');
          this._cleanups.push(importStub.reset);
          bundleImporter._fileReaderOnload(file, {
            target: { result: '["valid", "json"]' }
          });
          assert.equal(notifications.add.callCount(), 1);
          assert.equal(notifications.add.lastArguments()[0].level, 'important');
          assert.equal(importStub.callCount(), 1);
        });

        it('calls fetchDryRun if yaml file', function() {
          var fetch = utils.makeStubMethod(bundleImporter, 'fetchDryRun');
          var yamlFile = { name: 'path/to/file.yaml' };
          bundleImporter._fileReaderOnload(yamlFile, {target: {result: 'foo'}});
          assert.equal(fetch.callCount(), 1);
          assert.equal(fetch.lastArguments()[0], 'foo');
        });
      });
    });
    describe('importBundleDryRun', function() {
      var unsortedRecords = [
        { id: '2', requires: []},
        { id: '5', requires: ['3']},
        { id: '4', requires: ['2']},
        { id: '3', requires: []}
      ];

      var sortedRecords = [
        { id: '2', requires: []},
        { id: '4', requires: ['2']},
        { id: '3', requires: []},
        { id: '5', requires: ['3']}
      ];

      it('sorts the records then calls to execute', function() {
        var execute = utils.makeStubMethod(bundleImporter, '_executeDryRun');
        this._cleanups.push(execute.reset);
        bundleImporter.importBundleDryRun(unsortedRecords);
        assert.deepEqual(bundleImporter.recordSet, sortedRecords);
        assert.equal(execute.callCount(), 1);
        assert.deepEqual(execute.lastArguments()[0], sortedRecords);
      });
    });
    describe('fetchDryRun', function() {
      it('calls to the env to get a changeset', function() {
        var yaml = 'foo';
        bundleImporter.fetchDryRun(yaml);
        assert.equal(getChangeSet.callCount(), 1);
        assert.equal(getChangeSet.lastArguments()[0], yaml);
      });

      it('has a callback which calls to import the dryrun', function() {
        var yaml = 'foo';
        var dryRun = utils.makeStubMethod(bundleImporter, 'importBundleDryRun');
        var changeSet = { foo: 'bar' };
        bundleImporter.fetchDryRun(yaml);
        getChangeSet.lastArguments()[1]({changeSet: changeSet});
        assert.equal(dryRun.callCount(), 1);
        assert.deepEqual(dryRun.lastArguments()[0], changeSet);
      });
    });
  });

  describe('Changeset generation methods', function() {
    it('calls to execute supplied records', function() {
      var called = {
        addCharm: false,
        addMachines: false,
        deploy: false,
        addUnit: false,
        addRelation: false
      };
      function executor(record, next) {
        called[record.method] = true;
        next();
      }
      bundleImporter._execute_addCharm = executor;
      bundleImporter._execute_addMachines = executor;
      bundleImporter._execute_deploy = executor;
      bundleImporter._execute_addUnit = executor;
      bundleImporter._execute_addRelation = executor;

      var sortedRecords = [
        { method: 'addCharm' },
        { method: 'addMachines' },
        { method: 'deploy' },
        { method: 'addUnit' },
        { method: 'addRelation' }
      ];
      bundleImporter._executeDryRun(sortedRecords);
      assert.deepEqual(called, {
        addCharm: true,
        addMachines: true,
        deploy: true,
        addUnit: true,
        addRelation: true
      });
    });

    it('does not fail if unknown record type', function() {
      var sortedRecords = [
        { method: 'badMethod' }
      ];
      bundleImporter._executeDryRun(sortedRecords);
    });

    describe('_execute_addCharm', function() {
      it('loads a charm');
      it('shows notification on failure');
    });

    it('_execute_addMachines');
    it('_execute_deploy');
    it('_execute_addUnit');
    it('_execute_addRelation');
  });
});

