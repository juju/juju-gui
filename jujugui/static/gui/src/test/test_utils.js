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
        'juju-view-utils',
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
    });
  });
}) ();

describe('utilities', function() {
  var views, models, utils;

  before(function(done) {
    YUI(GlobalConfig).use(['juju-views', 'juju-models'], function(Y) {
      views = Y.namespace('juju.views');
      models = Y.namespace('juju.models');
      utils = Y.namespace('juju.views.utils');
      done();
    });
  });

  it('must be able to display humanize time ago messages', function() {
    var now = new Date().getTime();
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

  describe('unloadWindow', function() {
    var utils;

    before(function(done) {
      YUI(GlobalConfig).use(['juju-view-utils'], function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('does not block when no uncommitted changes', function() {
      var context = {env: {
        get: sinon.stub().returns({
          getCurrentChangeSet: sinon.stub().returns({})
        })
      }};

      var result = utils.unloadWindow.call(context);
      assert.strictEqual(result, undefined);
    });

    it('does block when has uncommitted changes', function() {
      var context = {env: {
        get: sinon.stub().returns({
          getCurrentChangeSet: sinon.stub().returns({foo: 'bar'})
        })
      }};

      var expected = 'You have uncommitted changes to your model. You will ' +
        'lose these changes if you continue.';
      var result = utils.unloadWindow.call(context);
      assert.strictEqual(result, expected);
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
        expected: '<a href="www.domain.com" target="_blank">www.domain.com</a>' // eslint-disable-line max-len
      },
      {
        text: 'thisisareallylongdomainnamewithunder62parts.co',
        expected: '<a href="thisisareallylongdomainnamewithunder62parts.co" target="_blank">thisisareallylongdomainnamewithunder62parts.co</a>' // eslint-disable-line max-len
      },
      {
        text: 'node-1.www4.example.com.jp',
        expected: '<a href="node-1.www4.example.com.jp" target="_blank">node-1.www4.example.com.jp</a>' // eslint-disable-line max-len
      },
      {
        text: 'http://domain.com',
        expected: '<a href="http://domain.com" target="_blank">http://domain.com</a>' // eslint-disable-line max-len
      },
      {
        text: 'ftp://foo.1.example.com.uk',
        expected: '<a href="ftp://foo.1.example.com.uk" target="_blank">ftp://foo.1.example.com.uk</a>' // eslint-disable-line max-len
      },
      {
        text: 'example.com/?foo=bar',
        expected: '<a href="example.com/?foo=bar" target="_blank">example.com/?foo=bar</a>' // eslint-disable-line max-len
      },
      {
        text: 'example.com/foo/bar?baz=true&something=%20alsotrue',
        expected: '<a href="example.com/foo/bar?baz=true&amp;something=%20alsotrue" target="_blank">example.com/foo/bar?baz=true&amp;something=%20alsotrue</a>' // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/index?foo=bar<script>alert(\'xss\')</script>', // eslint-disable-line max-len
        expected: '<a href="http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt" target="_blank">http://example.com/index?foo=bar&lt;script&gt;alert(\'xss\')&lt;/script&gt</a>;' // eslint-disable-line max-len
      },
      {
        text: 'http://example.com/foo"bar',
        expected: '<a href="http://example.com/foo&quot;bar" target="_blank">http://example.com/foo"bar</a>' // eslint-disable-line max-len
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
    let _hidePopup, _showUncommittedConfirm, originalSwitchModel, utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      originalSwitchModel = utils._switchModel;
      _hidePopup = utils._hidePopup;
      utils._hidePopup = sinon.stub();
      _showUncommittedConfirm = utils._showUncommittedConfirm;
      utils._showUncommittedConfirm = sinon.stub();
      utils._getAuth = sinon.stub().returns({rootUserName: 'animal'});
    });

    afterEach(function() {
      utils._hidePopup = _hidePopup;
      utils._showUncommittedConfirm = _showUncommittedConfirm;
      utils._switchModel = originalSwitchModel;
    });

    it('can switch directly if there are no uncommitted changes', function() {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      assert.deepEqual(utils._switchModel.callCount, 1);
      const switchArgs = utils._switchModel.lastCall.args;
      assert.deepEqual(switchArgs, [env, model]);
    });

    it('does not switch to the current model', function() {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid-1')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      const model = {id: 'model-uuid-1', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      // The underlying _switchModel is not called.
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({change: 'a change'})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), model);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 1);
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('does not switch when committing', function() {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(true),
          getCurrentChangeSet: sinon.stub().returns({change: 'a change'})
        })
      };
      const model = {id: 'uuid', name: 'mymodel', 'owner': 'who'};
      const addNotification = sinon.stub();
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, addNotification, model);
      assert.deepEqual(addNotification.callCount, 1);
      assert.deepEqual(utils._switchModel.callCount, 0);
    });

    it('allows switching to disconnected state', function() {
      const app = {
        get: sinon.stub().withArgs('modelUUID').returns('model-uuid')
      };
      const env = {
        get: sinon.stub().returns({
          isCommitting: sinon.stub().returns(false),
          getCurrentChangeSet: sinon.stub().returns({})
        })
      };
      utils._switchModel = sinon.stub();
      utils.switchModel.call(app, env, sinon.stub(), null);
      assert.deepEqual(utils._switchModel.callCount, 1);
      const switchArgs = utils._switchModel.lastCall.args;
      console.log(switchArgs);
      assert.deepEqual(switchArgs, [env, null]);
    });

    it('can switch models', function() {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {changeState: sinon.stub(), current: {}}
      };
      const env = {set: sinon.stub()};
      const model = {id: 'my-uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel.call(app, env, model);
      assert.equal(utils._hidePopup.callCount, 1, '_hidePopup');
      assert.equal(app.state.changeState.callCount, 1, 'changeState');
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null},
        root: null,
        hash: null,
        model: {path: 'who/mymodel', uuid: 'my-uuid'}
      }]);
      assert.equal(env.set.callCount, 1, 'env.set');
      assert.deepEqual(env.set.args[0], ['environmentName', 'mymodel']);
      assert.equal(app.set.callCount, 1, 'app.set');
      assert.deepEqual(app.set.args[0], ['modelUUID', 'my-uuid']);
    });

    it('changes to disconnected mode if model is missing', function() {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {changeState: sinon.stub(), current: {}}
      };
      const env = {set: sinon.stub()};
      utils._switchModel.call(app, env, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null},
        root: 'new',
        hash: null,
        model: null
      }]);
    });

    it('does not set root state to new if profile state exists', function() {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {profile: 'animal'}, changeState: sinon.stub()}
      };
      const env = {set: sinon.stub()};
      utils._switchModel.call(app, env, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null},
        hash: null,
        root: null,
        model: null
      }]);
    });

    it('does not close the status pane when switching to a model', function() {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {gui: {status: ''}}, changeState: sinon.stub()}
      };
      const env = {set: sinon.stub()};
      const model = {id: 'my-uuid', name: 'mymodel', 'owner': 'who'};
      utils._switchModel.call(app, env, model);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: ''},
        hash: null,
        root: null,
        model: {path: 'who/mymodel', uuid: 'my-uuid'}
      }]);
    });

    it('closes the status pane when switching to a new model', function() {
      const app = {
        set: sinon.stub().withArgs('modelUUID'),
        state: {current: {gui: {status: ''}}, changeState: sinon.stub()}
      };
      const env = {set: sinon.stub()};
      utils._switchModel.call(app, env, null);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null},
        hash: null,
        root: 'new',
        model: null
      }]);
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
      utils.showProfile(ecs, changeState, 'spinach');
      assert.deepEqual(changeState.callCount, 1);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 0);
    });

    it('can show a confirmation if there are uncommitted changes', function() {
      var ecs = {
        getCurrentChangeSet: sinon.stub().returns({change: 'one'})
      };
      var changeState = sinon.stub();
      utils.showProfile(ecs, changeState, 'spinach');
      assert.deepEqual(changeState.callCount, 0);
      assert.deepEqual(utils._showUncommittedConfirm.callCount, 1);
    });

    it('can show a confirmation and clear changes', function() {
      var ecs = {
        clear: sinon.stub(),
        getCurrentChangeSet: sinon.stub().returns({change: 'one'})
      };
      var changeState = sinon.stub();
      utils._showProfile(ecs, changeState, 'spinach', true);
      assert.deepEqual(changeState.callCount, 1);
      assert.deepEqual(changeState.lastCall.args[0], {
        profile: 'spinach',
        model: null,
        root: null,
        store: null
      });
      assert.deepEqual(utils._hidePopup.callCount, 1);
      assert.deepEqual(ecs.clear.callCount, 1);
    });
  });

  describe('deploy util', function() {
    let app, callback, commit, envGet, utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(function() {
      const getMockStorage = function() {
        return new function() {
          return {
            store: {},
            setItem: function(name, val) { this.store['name'] = val; },
            getItem: function(name) { return this.store['name'] || null; }
          };
        };
      };
      const userClass = new window.jujugui.User(
        {sessionStorage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      callback = sinon.stub();
      commit = sinon.stub();
      envGet = sinon.stub();
      envGet.withArgs('ecs').returns({commit: commit});
      envGet.withArgs('connected').returns(true);
      app = {
        applicationConfig: {
          apiAddress: 'apiAddress',
          socketTemplate: 'socketTemplate',
          socket_protocol: 'socket_protocol',
          uuid: 'uuid'
        },
        modelAPI: {
          connect: sinon.stub(),
          get: envGet,
          on: sinon.stub(),
          set: sinon.stub()
        },
        controllerAPI: {
          createModel: sinon.stub()
        },
        _autoPlaceUnits: sinon.stub(),
        db: {
          notifications: {
            add: sinon.stub()
          }
        },
        set: sinon.stub(),
        createSocketURL: sinon.stub().returns('wss://socket-url'),
        get: sinon.stub().returns('wss://socket-url'),
        switchEnv: sinon.stub(),
        state: {
          current: {},
          changeState: sinon.stub()
        },
        user: userClass
      };
    });

    it('can auto place when requested', function() {
      const autoPlaceUnits = sinon.stub();
      utils.deploy(app, autoPlaceUnits, sinon.stub(), callback, true);
      assert.equal(autoPlaceUnits.callCount, 1);
    });

    it('does not auto place when requested', function() {
      const autoPlaceUnits = sinon.stub();
      utils.deploy(app, autoPlaceUnits, sinon.stub(), callback, false);
      assert.equal(app._autoPlaceUnits.callCount, 0);
    });

    it('can commit to an existing model', function() {
      utils.deploy(app, sinon.stub(), sinon.stub(), callback);
      assert.equal(commit.callCount, 1);
      assert.equal(callback.callCount, 1);
      assert.equal(app.controllerAPI.createModel.callCount, 0);
    });

    it('can create a new model', function() {
      envGet.withArgs('connected').returns(false);
      utils.deploy(
        app, sinon.stub(), sinon.stub(), callback, true, 'new-model', {
          credential: 'the-credential',
          cloud: 'azure',
          region: 'north'
        });
      assert.equal(commit.callCount, 0);
      assert.equal(callback.callCount, 0);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      const args = app.controllerAPI.createModel.args[0];
      assert.strictEqual(args[0], 'new-model');
      assert.strictEqual(args[1], 'user@local');
      assert.deepEqual(args[2], {
        credential: 'the-credential',
        cloud: 'azure',
        region: 'north'
      });
      assert.isFunction(args[3]);
    });

    it('can create, connect, and commit to the new model', function() {
      const modelData = {
        id: 'abc123',
        name: 'model-name',
        owner: 'foo@external',
        uuid: 'the-uuid'
      };
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      const commit = sinon.stub();
      const createSocketURL = sinon.stub().returns('wss://socket-url');
      envGet.withArgs('ecs').returns({commit});
      utils._hidePopup = sinon.stub();
      utils.deploy(
        app, sinon.stub(), createSocketURL, callback, false, 'my-model', args);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3](null, modelData);
      assert.equal(app.modelUUID, modelData.uuid);
      assert.equal(createSocketURL.callCount, 1);
      assert.deepEqual(createSocketURL.args[0][0], {
        apiAddress: 'apiAddress',
        template: 'socketTemplate',
        protocol: 'socket_protocol',
        uuid: modelData.uuid
      });
      assert.equal(app.switchEnv.callCount, 1);
      assert.equal(app.switchEnv.args[0][0], 'wss://socket-url');
      assert.strictEqual(app.switchEnv.args[0][1], null);
      assert.strictEqual(app.switchEnv.args[0][2], null);
      assert.equal(typeof app.switchEnv.args[0][3], 'function');
      assert.strictEqual(app.switchEnv.args[0][4], true);
      assert.strictEqual(app.switchEnv.args[0][5], false);
      // Call the switchEnv callback handler.
      app.switchEnv.args[0][3](args);
      assert.equal(commit.callCount, 1);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [null]);
      // Check to make sure that the state was changed.
      assert.equal(app.state.changeState.callCount, 1);
      assert.deepEqual(app.state.changeState.args[0], [{
        profile: null,
        gui: {status: null},
        hash: null,
        root: null,
        model: {
          path: 'foo/model-name',
          uuid: 'the-uuid'
        }
      }]);
    });

    it('calls changeState when deploying if state matches rules', () => {
      const modelData = {
        id: 'abc123',
        name: 'model-name',
        owner: 'foo@external',
        uuid: 'the-uuid'
      };
      app.state.current = {
        root: 'new',
        special: {dd: {id: 'cs:apache'}}
      };
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      const commit = sinon.stub();
      envGet.withArgs('ecs').returns({commit});
      sinon.stub(utils, '_switchModel');
      utils.deploy(
        app, sinon.stub(), sinon.stub(), callback, false, 'my-model', args);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3](null, modelData);
      // Check to make sure that the state was changed.
      assert.equal(app.state.changeState.callCount, 2);
      assert.deepEqual(app.state.changeState.args, [
        [{root: null}],
        [{special: {dd: null}}]
      ]);
    });

    it('can display an error notification', function() {
      const modelData = {uuid: 'the-uuid'};
      const args = {model: 'args'};
      envGet.withArgs('connected').returns(false);
      utils.deploy(
        app, sinon.stub(), sinon.stub(), callback, false, 'my-model', args);
      assert.equal(app.controllerAPI.createModel.callCount, 1);
      // Call the handler for the createModel callCount
      app.controllerAPI.createModel.args[0][3]('it broke', modelData);
      assert.equal(app.db.notifications.add.callCount, 1);
      const expectedError = 'cannot create model: it broke';
      assert.deepEqual(app.db.notifications.add.args[0], [{
        title: expectedError,
        message: expectedError,
        level: 'error'
      }]);
      assert.equal(callback.callCount, 1);
      assert.deepEqual(callback.args[0], [expectedError]);
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

  describe('generateCloudCredentialName', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can generate a cloud credential name', function() {
      assert.equal(
        utils.generateCloudCredentialName('azure', 'spinach', 'super-cred'),
        'azure_spinach_super-cred');
    });
  });

  describe('getCloudProviderDetails', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can get details for a provider', function() {
      const provider = utils.getCloudProviderDetails('gce');
      assert.equal(provider.id, 'google');
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

  describe('parseQueryString', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can return a parsed query string', function() {
      assert.deepEqual(utils.parseQueryString(
        'http://example.com?one=1&two=2'), {
        one: '1',
        two: '2'
      });
    });

    it('can handle being passed only the querystring', function() {
      assert.deepEqual(utils.parseQueryString(
        '?one=1&two=2'), {
        one: '1',
        two: '2'
      });
    });

    it('can handle being passed a querystring without a "?"', function() {
      assert.deepEqual(utils.parseQueryString(
        'one=1&two=2'), {
        one: '1',
        two: '2'
      });
    });

    it('can handle a URL with no querystring', function() {
      assert.deepEqual(utils.parseQueryString(
        'http://example.com'), {});
    });

    it('can handle a querystring with no values', function() {
      assert.deepEqual(utils.parseQueryString(
        'http://example.com?'), {});
    });

    it('can handle a URL with multiple question marks', function() {
      assert.deepEqual(utils.parseQueryString(
        'http://example.com??one=1&two=2'), {
        one: '1',
        two: '2'
      });
    });

    it('can handle a URL with multiple querystrings', function() {
      assert.deepEqual(utils.parseQueryString(
        'http://example.com?one=1&two=2?one=1&two=2'), {
        one: ['1', '1'],
        two: ['2', '2']
      });
    });

    it('does not return empty values', function() {
      assert.deepEqual(utils.parseQueryString('http://example.com?one=1&'), {
        one: '1'
      });
    });

    it('returns null when there is no set value', function() {
      assert.deepEqual(utils.parseQueryString('http://example.com?one='), {
        one: null
      });
    });

    it('can handle unfinished values', function() {
      assert.deepEqual(
        utils.parseQueryString('http://example.com?one=&two=2'), {
          one: null,
          two: '2'
        });
    });

    it('can handle duplicate keys', function() {
      assert.deepEqual(
        utils.parseQueryString('http://example.com?one=1&one=2'), {
          one: ['1', '2']
        });
    });
  });

  describe('validateForm', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can validate a form with an invalid field', function() {
      const refs = {
        one: {validate: sinon.stub().returns(false)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      assert.isFalse(utils.validateForm(fields, refs));
    });

    it('can validate a form with valid fields', function() {
      const refs = {
        one: {validate: sinon.stub().returns(true)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      assert.isTrue(utils.validateForm(fields, refs));
    });

    it('validates all fields even if one field is invalid', function() {
      const refs = {
        one: {validate: sinon.stub().returns(false)},
        two: {validate: sinon.stub().returns(true)}
      };
      const fields = ['one', 'two'];
      utils.validateForm(fields, refs);
      assert.equal(refs.one.validate.callCount, 1);
      assert.equal(refs.two.validate.callCount, 1);
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

  describe('arrayZip', function() {
    let utils;

    before(function(done) {
      YUI(GlobalConfig).use('juju-view-utils', function(Y) {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    it('can zip arrays', function() {
      assert.deepEqual(
        utils.arrayZip(
          ['one', 'two'], ['three', 'four']),
        [['one', 'three'], ['two', 'four']]);
      assert.deepEqual(
        utils.arrayZip(
          [1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]),
        [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]]);
    });

    it('can handle arrays of different length', function() {
      assert.deepEqual(
        utils.arrayZip(
          [1, 2], [3], [4, 5, 6]),
        [[1, 3, 4], [2, 5], [6]]);
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

  describe('parseConstraints', () => {
    let genericConstraints, utils;

    before(done => {
      YUI(GlobalConfig).use('juju-view-utils', Y => {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(() => {
      genericConstraints = [
        'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
    });

    it('can parse constraints', () => {
      assert.deepEqual(
        utils.parseConstraints(
          genericConstraints,
          'arch=amd64 cpu-cores=2 cpu-power=10 root-disk=2048 mem=1024'),
        {
          arch: 'amd64',
          cores: null,
          'cpu-cores': '2',
          'cpu-power': '10',
          mem: '1024',
          'root-disk': '2048',
          tags: null
        });
    });
  });

  describe('generateMachineDetails', () => {
    let genericConstraints, units, utils;

    before(done => {
      YUI(GlobalConfig).use('juju-view-utils', Y => {
        utils = Y.namespace('juju.views.utils');
        done();
      });
    });

    beforeEach(() => {
      genericConstraints = [
        'cpu-power', 'cores', 'cpu-cores', 'mem', 'arch', 'tags', 'root-disk'];
      units = {
        filterByMachine: sinon.stub().returns([1, 2, 3])
      };
    });

    it('can generate hardware details', () => {
      const machine = {
        hardware: {
          'cpu-cores': '2',
          'cpu-power': '10',
          mem: '1024',
          'root-disk': '2048'
        },
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, cpu cores: 2, cpu power: 0.1GHz, mem: 1.00GB, '+
        'root disk: 2.00GB');
    });

    it('can generate details with no hardware', () => {
      const machine = {
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, hardware details not available');
    });

    it('can generate constraints', () => {
      const machine = {
        constraints: 'cpu-cores=2 cpu-power=10 root-disk=2048 mem=1024',
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, requested constraints: cpu power: 0.1GHz, cpu cores: 2'+
        ', mem: 1.00GB, root disk: 2.00GB');
    });

    it('can generate details with no constraints', () => {
      const machine = {
        commitStatus: 'uncommitted',
        series: 'wily'
      };
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, wily, default constraints');
    });

    it('can generate details with no series', () => {
      const machine = {};
      assert.deepEqual(
        utils.generateMachineDetails(genericConstraints, units, machine),
        '3 units, hardware details not available');
    });
  });
})();
