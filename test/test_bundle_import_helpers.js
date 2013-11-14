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

  describe('bundle-import-helpers', function() {
    var db, env, ns, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('bundle-import-helpers', function(Y) {
        ns = Y.namespace('juju');
        done();
      });
    });

    beforeEach(function() {
      db = {
        notifications: {
          add: function(info) {

          }
        }
      };

      env = {};
    });

    afterEach(function() {
      db = undefined;
      env = undefined;
    });

    // Start at the end of the chain and work backwards as there are fewest
    // parts in the chain at this point.
    it.only('provides a notification when a deploy watch updates', function(done) {
        var watchId = 1;
        var callNumber = 0;

        // This will get called twice. First with an update that it was
        // scheduled, then with a second call that it's complete which stops
        // the look in the watch.
        db.notifications.add = function(info) {
          if (callNumber === 0) {
              assert.equal('Updated status for deployment: 42', info.title);
              assert.equal(info.level, 'info');
              assert.isTrue(info.message.indexOf('scheduled') !== -1, info.message);
          } else {
              assert.equal(info.level, 'info');
              assert.isTrue(info.message.indexOf('completed') !== -1, info.message);
              done();
          }
          callNumber = callNumber + 1;
        };

        var called = false;
        env.deployerWatchUpdate = function(watchId, callback) {
          if (!called) {
            called = true;
            callback({
              err: undefined,
              Changes: [
                // Copied right from the docs of the charm.
                {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080066,
                 'Queue': 2},
                {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080062,
                 'Queue': 1},
                {'DeploymentId': 42, 'Status': 'started', 'Time': 1377080000,
                 'Queue': 0},
              ]
            });
          } else {
            // Make that this is done now.
            callback({
              err: undefined,
              Changes: [
                // Copied right from the docs of the charm.
                {'DeploymentId': 42, 'Status': 'completed', 'Time': 1377080066,
                 'Queue': 2},
                {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080062,
                 'Queue': 1},
                {'DeploymentId': 42, 'Status': 'started', 'Time': 1377080000,
                 'Queue': 0},
              ]
            });
          }
        };

        // Testing  private method is evil, but it does a decent amount of
        // work and we want the aid in debugging issues.
        ns.BundleImport._processWatchDeploymentUpdates(
            watchId,
            env,
            db
        );
    });

})();
