/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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
  describe('juju-views-utils', function() {
    var views;
    before(function(done) {
      YUI(GlobalConfig).use(
          'juju-view-utils', 'node-event-simulate',
          function(Y) {
            views = Y.namespace('juju.views');
            done();
          });
    });

    it('generates the correct export file name', function() {
      var envName = 'foobar';
      var date = new Date('October 13, 2014 11:13:00');
      var exportFilename =
        views.utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foobar-2014-10-13.yaml');

      var envName = 'foo-bar';
      var date = new Date('January 13, 2014 11:13:00');
      var exportFilename =
        views.utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'foo-bar-2014-01-13.yaml');

      var envName = 'sandbox';
      var date = new Date('October 1, 2014 11:13:00');
      var exportFilename =
        views.utils._genereateBundleExportFileName(envName, date);
      assert.equal(exportFilename, 'sandbox-2014-10-01.yaml');
    });
  });
}) ();

describe('utilities', function() {
  var Y, views, models, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['juju-views', 'juju-models'], function(Y) {
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju.views.utils');
      done();
    });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = Y.Lang.now();
    // Javascript timestamps are in milliseconds
    views.humanizeTimestamp(now).should.equal('less than a minute ago');
    views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');
  });

  it('generate a list of status by unit counts', function() {
    var units = [
      {id: 1, agent_state: 'started'},
      {id: 2, agent_state: 'pending'},
      {id: 3, agent_state: 'error'},
      {id: 4},
      {id: 5},
      {id: 6, agent_state: 'started'},
      {id: 7, agent_state: 'error'},
      {id: 8, agent_state: 'error'},
      {id: 9}
    ];
    assert.deepEqual(utils.getUnitStatusCounts(units), {
      uncommitted: {priority: 3, size: 3},
      started: {priority: 2, size: 2},
      pending: {priority: 1, size: 1},
      error: {priority: 0, size: 3}
    });
  });

  it('can calculate the number of unplaced units', function() {
    var db = new models.Database();
    db.services.add({
      id: 'django'
    });
    db.addUnits([{
      id: 'django/42'
    }, {
      id: 'django/43',
      machine: '15'
    }, {
      id: 'django/44'
    }]);
    assert.equal(utils.getUnplacedUnitCount(db.units), 2);
  });

  it('can calculate the number of unplaced units for zero', function() {
    var db = new models.Database();
    db.services.add({
      id: 'django'
    });
    db.addUnits([{
      id: 'django/43',
      machine: '15'
    }]);
    assert.equal(utils.getUnplacedUnitCount(db.units), 0);
  });
});

(function() {
  describe('service state simplification', function() {

    var simplifyState;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        simplifyState = Y.namespace('juju.views.utils').simplifyState;
        done();
      });
    });

    var makeUnit = function(state, relationErrors) {
      var unit = {agent_state: state};
      if (relationErrors) {
        unit.relation_errors = {myrelation: ['service']};
      }
      return unit;
    };

    it('translates service running states correctly', function() {
      var unit = makeUnit('started');
      assert.strictEqual('running', simplifyState(unit));
    });

    it('translates service error states correctly', function() {
      var states = ['install-error', 'foo-error', '-error', 'error'];
      states.forEach(function(state) {
        var unit = makeUnit(state);
        assert.strictEqual(simplifyState(unit), 'error', state);
      });
    });

    it('translates service pending states correctly', function() {
      var states = ['pending', 'installed', 'waiting', 'stopped'];
      states.forEach(function(state, index) {
        var unit = makeUnit(state);
        assert.strictEqual(simplifyState(unit), states[index], state);
      });
    });

  });
})();

(function() {

  describe('utils.getUnitSeries', function() {
    var utils, db;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      db = {
        services: {
          getServiceByName: function(name) {
            assert.equal(name, 'rails');
            return {
              get: function(arg) {
                assert.equal(arg, 'series');
                return 'precise';
              }
            };
          }
        }
      };
    });

    it('returns the series of a charmstore charm', function() {
      var series = utils.getUnitSeries({id: 'rails/47'}, db);
      assert.strictEqual(series, 'precise');
    });
  });
})();

(function() {

  describe('utils.getName', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('returns the name of a charm', function() {
      var name = utils.getName('cs:~uros/precise/rails-server-47');
      assert.strictEqual(name, 'rails-server');
    });

    it('returns the name of a charm when version is missing', function() {
      var name = utils.getName('cs:~uros/precise/rails-server');
      assert.strictEqual(name, 'rails-server');
    });

  });
})();

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

  describe('utils.getLandscapeURL', function() {
    var environment, models, service, unit, utils;
    var requirements = ['juju-models', 'juju-view-utils'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        models = Y.namespace('juju.models');
        utils = Y.namespace('juju.views.utils');
        var db = new models.Database();
        // Set up environment annotations for testing.
        environment = db.environment;
        environment.set('annotations', {
          'landscape-url': 'http://landscape.example.com',
          'landscape-computers': '/computers/criteria/environment:test',
          'landscape-reboot-alert-url': '+alert:computer-reboot/info#power',
          'landscape-security-alert-url':
              '+alert:security-upgrades/packages/list?filter=security'
        });
        // Create the Service and a Unit model instances for testing.
        service = db.services.add({
          id: 'django',
          annotations: {'landscape-computers': '+service:django'}
        });
        var unitObj = db.addUnits({
          id: 'django/42',
          annotations: {'landscape-computer': '+unit:django-42'}
        });
        unit = db.units.revive(unitObj);
        done();
      });
    });

    // Create and return a Landscape URL including the given path.
    var makeURL = function(path) {
      var address = 'http://landscape.example.com';
      var lastSegment = path || '/';
      return address + '/computers/criteria/environment:test' + lastSegment;
    };

    it('returns the generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment);
      var expected = makeURL();
      assert.strictEqual(url, expected);
    });

    it('returns the reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'reboot');
      var expected = makeURL('+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, null, 'security');
      var expected = makeURL(
          '+alert:security-upgrades/packages/list?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the service generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service);
      var expected = makeURL('+service:django/');
      assert.strictEqual(url, expected);
    });

    it('returns the service reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'reboot');
      var expected = makeURL(
          '+service:django/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the service security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, service, 'security');
      var expected = makeURL(
          '+service:django/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

    it('returns the unit generic Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit);
      var expected = makeURL('+unit:django-42/');
      assert.strictEqual(url, expected);
    });

    it('returns the unit reboot Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'reboot');
      var expected = makeURL(
          '+unit:django-42/+alert:computer-reboot/info#power');
      assert.strictEqual(url, expected);
    });

    it('returns the unit security upgrade Landscape URL', function() {
      var url = utils.getLandscapeURL(environment, unit, 'security');
      var expected = makeURL(
          '+unit:django-42/+alert:security-upgrades/packages/list' +
          '?filter=security');
      assert.strictEqual(url, expected);
    });

  });

  describe('getIconPath', function() {
    var config, utils;

    before(function(done) {
      window.juju_config = {charmstoreURL: 'local/'};
      YUI(GlobalConfig).use('juju-view-utils',
          function(Y) {
            utils = Y.namespace('juju.views.utils');
            done();
          });
    });

    beforeEach(function() {
      // Store the juju_config so that it can be reset after the test runs.
      config = window.juju_config;
    });

    afterEach(function() {
      window.juju_config = config;
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
          'local/v5/~paulgear/precise/quassel-core-2/icon.svg');
    });

    after(function() {
      delete window.juju_config;
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
                toArray: function() { return [
                  {id: applicationName + '/1'},
                  {id: applicationName + '/2'}
                ]; }};
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
      assert.deepEqual(addUnitsArgs[0][0], {
        id: applicationName + '/' + 3,
        displayName: applicationName + '/' + 3,
        charmUrl: 'I am a charm url',
        subordinate: false
      }, 'addUnits first not called with proper data');
      assert.deepEqual(addUnitsArgs[1][0], {
        id: applicationName + '/' + 4,
        displayName: applicationName + '/' + 4,
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
        modelId: applicationName + '/' + 3
      });
      assert.equal(add_unit_args[1][0], applicationName);
      assert.equal(add_unit_args[1][1], 1);
      assert.strictEqual(add_unit_args[1][2], null);
      assert.equal(typeof add_unit_args[1][3], 'function');
      assert.deepEqual(add_unit_args[1][4], {
        modelId: applicationName + '/' + 4
      });
      assert.equal(units.length, 2);
    }

    it('creates machines, units; places units; updates unit lists',
       function() {
         testScaleUp('myService');
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

  describe('destroyService', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('responds to service removal failure by alerting the user', function() {
      var notificationAdded;
      var APPNAME = 'the name of the application being removed';
      var evt = {
        err: true,
        applicationName: APPNAME
      };
      var service = ['service', 'mediawiki'];

      var db = {
        notifications: {
          add: function(notification) {
            // The notification has the required attributes.
            assert.isOk(notification.title);
            assert.isOk(notification.message);
            // The service name is mentioned in the error message.
            assert.notEqual(notification.message.indexOf(APPNAME, -1));
            assert.equal(notification.level, 'error');
            assert.deepEqual(notification.modelId, ['service', 'mediawiki']);
            notificationAdded = true;
          }
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
    });

    it('removes the relations when the service is destroyed', function() {
      var notificationAdded = false;
      var APPNAME = 'the name of the application being removed';
      var evt = {
        err: false,
        applicationName: APPNAME
      };
      var service = {
        get: function () {
          return [];
        }
      };

      var db = {
        notifications: {
          add: function(attrs) {
            // The notification has the required attributes.
            assert.equal(attrs.hasOwnProperty('title'), true,
                'Does not have a title');
            assert.equal(attrs.hasOwnProperty('message'), true,
                'Does not have a message');
            // The service name is mentioned in the error message.
            assert.notEqual(attrs.message.indexOf(APPNAME, -1));
            assert.equal(attrs.level, 'important');
            notificationAdded = true;
          }
        },
        relations: {
          remove: sinon.stub()
        }
      };

      utils._destroyServiceCallback(service, db, null, evt);
      assert.isTrue(notificationAdded);
      // Check that relations were removed.
      assert.equal(db.relations.remove.calledOnce, true,
          'Remove relations not called');
    });
  });

  describe('numToLetter', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.juju.views.utils;
        done();
      });
    });

    it('converts numbers to letters correctly', function() {
      // Map of numbers and output to check. This list isn't exhaustive
      // but checks some important milestones for common issues with this
      // technique.
      var mapping = {
        1: 'a',
        2: 'b',
        10: 'j',
        15: 'o',
        26: 'z',
        27: 'aa',
        28: 'ab',
        52: 'az',
        53: 'ba',
        54: 'bb',
        703: 'aaa',
        748: 'abt',
        1982: 'bxf'
      };
      Object.keys(mapping).forEach(function(key) {
        assert.equal(
          utils.numToLetter(key), mapping[key],
          key + ' did not properly convert to ' + mapping[key]);
      });
    });
  });

  describe('letterToNum', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.juju.views.utils;
        done();
      });
    });

    it('converts letters to numbers correctly', function() {
      // Map of numbers and output to check. This list isn't exhaustive
      // but checks some important milestones for common issues with this
      // technique.
      var mapping = {
        a: 1,
        b: 2,
        j: 10,
        o: 15,
        z: 26,
        aa: 27,
        ab: 28,
        az: 52,
        ba: 53,
        bb: 54,
        aaa: 703,
        abt: 748,
        bxf: 1982
      };
      Object.keys(mapping).forEach(function(key) {
        assert.equal(
          utils.letterToNum(key), mapping[key],
          key + ' did not properly convert to ' + mapping[key]);
      });
    });
  });

  describe('compareSemver', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('properly compares semver values', function() {
      var versions = [
        '1.2.3',
        '2.0-alpha-foo-bar',
        '4.11.6',
        '4.2.0',
        '1.5.19',
        '1.5.5',
        '1.5.5-foo',
        '3.7.1-alpha-foo',
        '4.1.3',
        '2.3.1',
        '10.5.5',
        '5.1',
        '11.3.0'
      ];

      assert.deepEqual(
        versions.slice().sort(utils.compareSemver), [
          '1.2.3',
          '1.5.5-foo',
          '1.5.5',
          '1.5.19',
          '2.0-alpha-foo-bar',
          '2.3.1',
          '3.7.1-alpha-foo',
          '4.1.3',
          '4.2.0',
          '4.11.6',
          '5.1',
          '10.5.5',
          '11.3.0'
        ]);
    });

  });

  describe('linkify', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    var testLinks = [
      {
        text: 'google.com',
        expected: '<a href="google.com" target="_blank">google.com</a>'
      },
      {
        text: 'www.domain.com',
        expected: '<a href="www.domain.com" target="_blank">www.domain.com</a>'  // eslint-disable-line max-len
      },
      {
        text: 'thisisareallylongdomainnamewithunder62parts.co',
        expected: '<a href="thisisareallylongdomainnamewithunder62parts.co" target="_blank">thisisareallylongdomainnamewithunder62parts.co</a>'  // eslint-disable-line max-len
      },
      {
        text: 'node-1.www4.example.com.jp',
        expected: '<a href="node-1.www4.example.com.jp" target="_blank">node-1.www4.example.com.jp</a>'  // eslint-disable-line max-len
      },
      {
        text: 'http://domain.com',
        expected: '<a href="http://domain.com" target="_blank">http://domain.com</a>'  // eslint-disable-line max-len
      },
      {
        text: 'ftp://foo.1.example.com.uk',
        expected: '<a href="ftp://foo.1.example.com.uk" target="_blank">ftp://foo.1.example.com.uk</a>'  // eslint-disable-line max-len
      },
      {
        text: 'example.com/?foo=bar',
        expected: '<a href="example.com/?foo=bar" target="_blank">example.com/?foo=bar</a>'  // eslint-disable-line max-len
      },
      {
        text: 'example.com/foo/bar?baz=true&something=%20alsotrue',
        expected: '<a href="example.com/foo/bar?baz=true&amp;something=%20alsotrue" target="_blank">example.com/foo/bar?baz=true&amp;something=%20alsotrue</a>'  // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/index?foo=bar<script>alert(\'xss\')</script>',  // eslint-disable-line max-len
        expected: '<a href="http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt" target="_blank">http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt</a>;'  // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/foo"bar',
        expected: '<a href="http://example.com/foo&quot;bar" target="_blank">http://example.com/foo"bar</a>'  // eslint-disable-line max-len
      },
      {
        text: 'Hi there John.Bob',
        expected: 'Hi there John.Bob'
      }
    ];

    testLinks.forEach(function(test) {
      it('correctly linkifies: ' + test.text, function() {
        var actual = utils.linkify(test.text);
        assert.equal(actual, test.expected);
      });
    });
  });

  describe('switchModel', function() {
    var utils, _showUncommittedConfirm, _hidePopup,
        models;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      _hidePopup = utils._hidePopup;
      utils._hidePopup = sinon.stub();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = sinon.stub();
      utils.changeState = sinon.stub();
      utils.set = sinon.stub();
      utils.showConnectingMask = sinon.stub();
      models = [{
        uuid: 'uuid1',
        user: 'spinach',
        password: 'hasselhoff',
        hostPorts: ['localhost:80', 'localhost:443']
      }];
    });

    afterEach(function() {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
    });

    it('can switch directly if there are no uncommitted changes', function() {
      var createSocketURL = sinon.stub().returns('newaddress:80');
      var switchEnv = sinon.stub();
      var env = {
        get: sinon.stub().returns({
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      var callback = sinon.stub();
      var _switchModel = utils._switchModel;
      utils._switchModel = sinon.stub();
      utils.switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);
      assert.deepEqual(utils._switchModel.callCount, 1);
      var switchArgs = utils._switchModel.lastCall.args;
      assert.deepEqual(switchArgs, [
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback]);
      utils._switchModel = _switchModel;
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      var createSocketURL = sinon.stub().returns('newaddress:80');
      var switchEnv = sinon.stub();
      var env = {
        get: sinon.stub().returns({
          getCurrentChangeSet: sinon.stub().returns({change: 'a change'})
        })
      };
      var callback = sinon.stub();
      var _switchModel = utils._switchModel;
      utils._switchModel = sinon.stub();
      utils.switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 1);
      assert.deepEqual(utils._switchModel.callCount, 0);
      utils._switchModel = _switchModel;
    });

    it('can switch models', function() {
      var createSocketURL = sinon.stub().returns('newaddress:80');
      var switchEnv = sinon.stub();
      var env = {set: sinon.stub()};
      var callback = sinon.stub();
      utils._switchModel(
        createSocketURL, switchEnv, env, 'uuid1', models, 'ev', callback);

      assert.deepEqual(utils._hidePopup.callCount, 1);
      assert.deepEqual(createSocketURL.callCount, 1);
      var socketArgs = createSocketURL.lastCall.args;
      assert.deepEqual(socketArgs[0], models[0].uuid);
      assert.deepEqual(socketArgs[1], 'localhost');
      assert.deepEqual(socketArgs[2], '80');

      assert.deepEqual(switchEnv.callCount, 1);
      var switchEnvArgs = switchEnv.lastCall.args;
      assert.deepEqual(switchEnvArgs[0], 'newaddress:80');
      assert.deepEqual(switchEnvArgs[1], models[0].user);
      assert.deepEqual(switchEnvArgs[2], models[0].password);
      assert.deepEqual(switchEnvArgs[3], callback);

      assert.deepEqual(env.set.callCount, 1);
      var envSet = env.set.lastCall.args;
      assert.deepEqual(envSet[0], 'environmentName');
      assert.deepEqual(envSet[1], 'ev');

      assert.deepEqual(utils.showConnectingMask.callCount, 1);
      assert.deepEqual(utils.changeState.callCount, 1);
    });

    it('just disconnects if uuid is missing', function() {
      var createSocketURL = sinon.stub();
      var switchEnv = sinon.stub();
      var env = {set: sinon.stub()};
      utils._switchModel(createSocketURL, switchEnv, env, undefined, models);
      assert.deepEqual(createSocketURL.callCount, 0);
      assert.deepEqual(switchEnv.callCount, 1);
      assert.deepEqual(
        switchEnv.lastCall.args, [null, null, null, undefined]);
    });

    it('just disconnects if modelList is missing', function() {
      var createSocketURL = sinon.stub();
      var switchEnv = sinon.stub();
      var env = {set: sinon.stub()};
      utils._switchModel(createSocketURL, switchEnv, env, 'model1', undefined);
      assert.deepEqual(createSocketURL.callCount, 0);
      assert.deepEqual(switchEnv.callCount, 1);
      assert.deepEqual(
        switchEnv.lastCall.args, [null, null, null, undefined]);
    });
  });

  describe('showProfile', function() {
    var utils, _showUncommittedConfirm, _hidePopup;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      _hidePopup = utils._hidePopup;
      utils._hidePopup = sinon.stub();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = sinon.stub();
    });

    afterEach(function() {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
    });

    it('can show the profile if there are no uncommitted changes', function() {
      var ecs = {
        getCurrentChangeSet: sinon.stub().returns({})
      };
      var changeState = sinon.stub();
      utils.showProfile(ecs, changeState);
      assert.deepEqual(changeState.callCount, 1);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 0);
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      var ecs = {
        getCurrentChangeSet: sinon.stub().returns({change: 'one'})
      };
      var changeState = sinon.stub();
      utils.showProfile(ecs, changeState);
      assert.deepEqual(changeState.callCount, 0);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 1);
    });

    it('can show a confirmation and clear changes', function() {
      var ecs = {
        clear: sinon.stub(),
        getCurrentChangeSet: sinon.stub().returns({change: 'one'})
      };
      var changeState = sinon.stub();
      utils._showProfile(ecs, changeState, true);
      assert.deepEqual(changeState.callCount, 1);
      assert.deepEqual(changeState.lastCall.args[0], {
        sectionB: {
          component: 'profile',
          metadata: null
        }
      });
      assert.deepEqual(utils._hidePopup.callCount, 1);
      assert.deepEqual(ecs.clear.callCount, 1);
    });
  });

  describe('deploy util', function() {
    var callback, commit, env, envSet, jem, users, autoPlaceUnits, appSet,
        createSocketURL, utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      autoPlaceUnits = sinon.stub();
      appSet = sinon.stub();
      callback = sinon.stub();
      commit = sinon.stub();
      createSocketURL = sinon.stub().returns('wss://socket-url');
      envSet = sinon.stub();
      env = {
        connect: sinon.stub(),
        get: sinon.stub().returns({
          commit: commit
        }),
        on: sinon.stub(),
        set: envSet,
        setCredentials: sinon.stub()
      };
      jem = {
        newModel: sinon.stub(),
      };
      users = {
        jem : {
          user: 'spinach'
        }
      };
    });

    it('can auto place when requested', function() {
      utils.deploy(
        env, jem, users, autoPlaceUnits, createSocketURL, appSet, false,
        callback, true);
      assert.equal(autoPlaceUnits.callCount, 1);
    });

    it('does not auto place when requested', function() {
      utils.deploy(
        env, jem, users, autoPlaceUnits, createSocketURL, appSet, false,
        callback, false);
      assert.equal(autoPlaceUnits.callCount, 0);
    });

    it('can commit to an existing model', function() {
      utils.deploy(
        env, jem, users, autoPlaceUnits, createSocketURL, appSet, true,
        callback);
      assert.equal(commit.callCount, 1);
      assert.equal(callback.callCount, 1);
      assert.equal(jem.newModel.callCount, 0);
    });

    it('can create a new model', function() {
      utils.deploy(
        env, jem, users, autoPlaceUnits, createSocketURL, appSet, false,
        callback, true, 'new-model', 'the-credential', 'azure', 'north');
      assert.equal(commit.callCount, 0);
      assert.equal(callback.callCount, 0);
      assert.equal(jem.newModel.callCount, 1);
      var args = jem.newModel.args[0];
      assert.equal(args[0], 'spinach');
      assert.equal(args[1], 'new-model');
      assert.equal(args[2], 'the-credential');
      assert.deepEqual(args[3], {
        cloud: 'azure',
        region: 'north'
      });
      assert.equal(args[4], null);
      assert.isFunction(args[5]);
    });

    it('can connect to a newly created model', function() {
      var model = {
        hostPorts: ['http:80', 'https:443'],
        password: 'taquitos123!',
        user: 'spinach',
        uuid: 'uuid123'
      };
      utils._newModelCallback(
        env, createSocketURL, appSet, callback, null, model);
      assert.equal(env.setCredentials.callCount, 1);
      assert.deepEqual(env.setCredentials.args[0][0], {
        user: 'user-spinach',
        password: 'taquitos123!'
      });
      assert.equal(createSocketURL.callCount, 1);
      var createSocketURLArgs = createSocketURL.args[0];
      assert.equal(createSocketURLArgs[0], 'uuid123');
      assert.equal(createSocketURLArgs[1], 'http');
      assert.equal(createSocketURLArgs[2], '80');
      assert.equal(appSet.callCount, 2);
      var appSetArgs = appSet.args;
      assert.equal(appSetArgs[0][0], 'jujuEnvUUID');
      assert.equal(appSetArgs[0][1], 'uuid123');
      assert.equal(appSetArgs[1][0], 'socket_url');
      assert.equal(appSetArgs[1][1], 'wss://socket-url');
      assert.equal(envSet.callCount, 1);
      var envSetArgs = envSet.args[0];
      assert.equal(envSetArgs[0], 'socket_url');
      assert.equal(envSetArgs[1], 'wss://socket-url');
      assert.equal(env.connect.callCount, 1);
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

  describe('generateCloudCredentialTag', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can generate a cloud credential tag', function() {
      assert.equal(
        utils.generateCloudCredentialTag('azure', 'user-spinach', 'super-cred'),
        'cloudcred-azure_spinach_super-cred');
    });
  });

})();
