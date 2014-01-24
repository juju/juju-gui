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

  describe('local-charm-import-helpers', function() {
    var db, env, Y, lch, notificationParams;

    before(function(done) {
      Y = YUI(GlobalConfig).use('local-charm-import-helpers', function(Y) {
        lch = Y.juju.localCharmHelpers;
        done();
      });
    });

    beforeEach(function() {
      db = {
        notifications: {
          add: function(info) {
            notificationParams = info;
          }
        }
      };
    });

    afterEach(function() {
      db = undefined;
    });

    describe('destroyLocalCharm', function() {

      it('requests an upload from the environment', function(done) {
        var fileObj = { name: 'foo' },
            defSeries = 'precise',
            reqAttr = 'defaultSeries';

        lch.deployLocalCharm(fileObj, {
          uploadLocalCharm: function(file, series, progress, callback) {
            assert.deepEqual(file, fileObj);
            assert.equal(series, defSeries);
            assert.isFunction(progress);
            assert.isFunction(callback);
            // called the proper env method
            done();
          },
          get: function(attr) {
            assert.equal(attr, reqAttr);
            return defSeries;
          }
        }, db);
      });

      it('throws a notification on a successful upload', function(done) {
        var fileObj = { name: 'foo' },
            defSeries = 'precise',
            reqAttr = 'defaultSeries';

        lch.deployLocalCharm(fileObj, {
          uploadLocalCharm: function(file, series, progress, callback) {
            assert.isFunction(callback);
            callback({type: 'load'});
            assert.deepEqual(notificationParams, {
              title: 'Imported local charm file',
              message: 'Import from "foo" successful.',
              level: 'important'
            });

            done();
          },
          get: function(attr) {
            return defSeries;
          }
        }, db);
      });

      it('throws a notification on a failed upload', function(done) {
        var fileObj = { name: 'foo' },
            defSeries = 'precise',
            reqAttr = 'defaultSeries';

        lch.deployLocalCharm(fileObj, {
          uploadLocalCharm: function(file, series, progress, callback) {
            assert.isFunction(callback);
            callback({type: 'error'});
            assert.deepEqual(notificationParams, {
              title: 'Import failed',
              message: 'Import from "foo" failed.',
              level: 'error'
            });

            done();
          },
          get: function(attr) {
            return defSeries;
          }
        }, db);
      });

    });


  });
})();
