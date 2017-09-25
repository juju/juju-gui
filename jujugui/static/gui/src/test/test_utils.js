/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

(function() {
  describe('utils.ensureTrailingSlash', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('adds a trailing slash if not already there', function() {
      var text = utils.ensureTrailingSlash('/foo/bar');
      assert.strictEqual(text, '/foo/bar/');
    });

    it('avoids adding a trailing slash if not required', function() {
      var text = utils.ensureTrailingSlash('/foo/bar/');
      assert.strictEqual(text, '/foo/bar/');
    });

  });

  describe('getIconPath', function() {
    let jujuConfig, utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(() => {
      jujuConfig = window.juju_config;
      window.juju_config = {charmstoreURL: 'http://4.3.2.1/'};
    });

    afterEach(() => {
      window.juju_config = jujuConfig;
    });

    it('returns local default bundle icon location for bundles', function() {
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('uses staticURL if provided for bundle icon location', function() {
      window.juju_config = {
        staticURL: 'static'
      };
      var path = utils.getIconPath('bundle:elasticsearch', true);
      assert.equal(
        path,
        'static/static/gui/build/app/assets/images/non-sprites/bundle.svg');
    });

    it('returns a qualified charmstoreURL icon location', function() {
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });

    it('handles charmstoreURL with no trailing slash', function() {
      window.juju_config = {charmstoreURL: 'http://4.3.2.1'};
      var path = utils.getIconPath('~paulgear/precise/quassel-core-2');
      assert.equal(
        path,
        'http://4.3.2.1/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });
  });

  describe('addGhostAndEcsUnits', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    function testScaleUp(applicationName) {
      var service = {
        get: function(key) {
          var returnVal;
          switch (key) {
            case 'id':
              returnVal = applicationName;
              break;
            case 'units':
              returnVal = {
                size: function() { return 2; },
                toArray: function() {
                  if (applicationName === 'no-units') {
                    return [];
                  }
                  return [
                    {id: applicationName + '/1'},
                    {id: applicationName + '/2'}
                  ];
                }
              };
              break;
            case 'displayName':
              if (applicationName.indexOf('$') > 0) {
                returnVal = '(' + applicationName + ')';
              } else {
                returnVal = applicationName;
              }
              break;
            case 'charm':
              returnVal = 'I am a charm url';
              break;
            case 'subordinate':
              returnVal = false;
              break;
          }
          return returnVal;
        }
      };
      var db = {
        addUnits: sinon.stub(),
        removeUnits: sinon.stub()
      };
      var env = {
        add_unit: sinon.stub()
      };
      var unitCount = 2;
      var callback = sinon.stub();

      var units = utils.addGhostAndEcsUnits(
        db, env, service, unitCount, callback);
      // Test the db.addUnits call.
      assert.equal(db.addUnits.callCount, 2, 'db addUnits not called');
      var addUnitsArgs = db.addUnits.args;
      // The numbers for the id's are important. The mocks have existing units
      // having indexes of 1 and 2. There was a bug where the next value wasn't
      // being properly computed when there was no 0 unit.
      let firstIndex = 3;
      if (applicationName === 'no-units') {
        firstIndex = 0;
      }
      assert.deepEqual(addUnitsArgs[0][0], {
        id: applicationName + '/' + firstIndex,
        displayName: applicationName + '/' + firstIndex,
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits first not called with proper data');
      assert.deepEqual(addUnitsArgs[1][0], {
        id: applicationName + '/' + (firstIndex+1),
        displayName: applicationName + '/' + (firstIndex+1),
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits second not called with proper data');
      // Test the env.add_unit call.
      assert.equal(env.add_unit.callCount, 2, 'add unit not called');
      var add_unit_args = env.add_unit.args;
      assert.equal(add_unit_args[0][0], applicationName);
      assert.equal(add_unit_args[0][1], 1);
      assert.strictEqual(add_unit_args[0][2], null);
      assert.equal(typeof add_unit_args[0][3], 'function');
      assert.deepEqual(add_unit_args[0][4], {
        modelId: applicationName + '/' + firstIndex
      });
      assert.equal(add_unit_args[1][0], applicationName);
      assert.equal(add_unit_args[1][1], 1);
      assert.strictEqual(add_unit_args[1][2], null);
      assert.equal(typeof add_unit_args[1][3], 'function');
      assert.deepEqual(add_unit_args[1][4], {
        modelId: applicationName + '/' + (firstIndex+1)
      });
      assert.equal(units.length, 2);
    }

    it('creates machines, units; places units; updates unit lists',
      function() {
        testScaleUp('myService');
      }
    );

    it('creates machines, units; places units; updates unit lists (no units)',
      function() {
        testScaleUp('no-units');
      }
    );

    it('creates machines, units; places units; updates unit lists for ghosts',
      function() {
        testScaleUp('myGhostService$');
      }
    );

    it('properly removes the ghost units on env add_unit callback', function() {
      var ghostUnit = { ghostUnit: 'I am' };
      var db = {
        removeUnits: sinon.stub()
      };
      var callback = sinon.stub();
      var e = {
        applicationName: 'appName'
      };
      utils.removeGhostAddUnitCallback(ghostUnit, db, callback, e);
      assert.equal(db.removeUnits.calledOnce, true);
      assert.equal(db.removeUnits.lastCall.args[0].service, 'appName');
      assert.equal(callback.calledOnce, true);
      assert.deepEqual(callback.lastCall.args, [e, db, ghostUnit]);
    });

  });

  describe('isRedirectError', function() {
    let utils;

    before(function(done) {
      YUI().use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('returns true if it is a redirect error', function() {
      assert.equal(
        utils.isRedirectError('authentication failed: redirection required'),
        true);
    });

    it('returns false if it is not a redirect error', function() {
      assert.equal(
        utils.isRedirectError('it broke'),
        false);
    });
  });

  describe('isValue', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can check a value is set and not null', function() {
      assert.equal(utils.isValue('string'), true);
      assert.equal(utils.isValue(''), true);
      assert.equal(utils.isValue(1), true);
      assert.equal(utils.isValue(0), true);
      assert.equal(utils.isValue({key: 'value'}), true);
      assert.equal(utils.isValue({}), true);
      assert.equal(utils.isValue(['array']), true);
      assert.equal(utils.isValue([]), true);
      assert.equal(utils.isValue(undefined), false);
      assert.equal(utils.isValue(null), false);
    });
  });

  describe('isObject', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can check a value is an object', function() {
      assert.equal(utils.isObject({key: 'value'}), true);
      assert.equal(utils.isObject({}), true);
      assert.equal(utils.isObject([]), false);
      assert.equal(utils.isObject(undefined), false);
      assert.equal(utils.isObject(null), false);
    });
  });

  describe('arrayDedupe', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can remove duplicates from an array', function() {
      assert.deepEqual(
        utils.arrayDedupe(
          ['one', 'four', 'one', 'two', 'three', 'two', 'four']),
        ['one', 'four', 'two', 'three']);
    });
  });

  describe('arrayFlatten', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can flatten an array of arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [['one', 'two'], ['three'], 'four']),
        ['one', 'two', 'three', 'four']);
    });

    it('can flatten nested arrays', function() {
      assert.deepEqual(
        utils.arrayFlatten(
          [[['one', 'two'], ['three']]]),
        ['one', 'two', 'three']);
    });
  });

  describe('formatConstraints', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can format constraints', function() {
      assert.equal(
        utils.formatConstraints({
          arch: 'amd64',
          cpuCores: 2,
          cpuPower: 10,
          disk: 2048,
          mem: 1024
        }),
        'arch=amd64 cpuCores=2 cpuPower=10 disk=2048 mem=1024');
    });
  });
})();
