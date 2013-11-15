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

    it('errors when the env does not support deployer', function(done) {
      db.notifications.add = function(info) {
        assert.equal(info.level, 'error');
        assert.notEqual(info.title.indexOf('not available'), -1);
        done();
      };

      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', env, db);
    });

    it('errors when the bundle import fails from the env', function(done) {
      db.notifications.add = function(info) {
        assert.equal(info.level, 'error');
        assert.notEqual(info.title.indexOf('deployment failed'), -1);
        done();
      };

      env.deployerImport = function(bundle, name, callback) {
        callback({
          err: 'Abort abort!'
        });
      };

      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', env, db);
    });

    it('provides deployBundle helper for working through env', function(done) {
      // Watch the notification for the message that we're hitting the default
      // callback.
      var hitNotifications = false;
      db.notifications.add = function(info) {
        hitNotifications = true;
        assert.equal(info.level, 'important');
        assert.notEqual(info.title.indexOf('requested'), -1);
      };

      // Stub out the env call to make sure we check the params and call the
      // provided callback.
      env.deployerImport = function(bundle, name, callback) {
        assert.equal(bundle, 'test bundle');
        assert.equal(
            name, null, 'The name is not currently supported or passed.');
        // This is the default callback from the deployBundle method.
        callback({
          err: undefined,
          DeploymentId: 10
        });
      };

      // A watch should be created in the process of submitting the deployment
      // once there's an ID.
      var _watchDeployment = ns.BundleHelpers._watchDeployment;
      ns.BundleHelpers._watchDeployment = function(id, env, db) {
        assert.equal(id, 10);
        // At this point we've checked the env call, the notification is
        // correct, and now that we've requested a watcher with the right id.
        ns.BundleHelpers._watchDeployment = _watchDeployment;

        // Make sure we did in fact post our notification to the user.
        assert.equal(hitNotifications, true);
        done();
      };

      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', env, db);
    });

    it('provides a notification when a deploy watch updates', function(done) {
      var watchId = 1;
      var callNumber = 0;

      // This will get called twice. First with an update that it was
      // scheduled, then with a second call that it's complete which stops
      // the look in the watch.
      db.notifications.add = function(info) {
        if (callNumber === 0) {
          assert.equal('Updated status for deployment: 42', info.title);
          assert.equal(info.level, 'important');
          assert.isTrue(info.message.indexOf('scheduled') !== -1, info.message);
        } else {
          assert.equal(info.level, 'important');
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
                'Queue': 0}
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
                'Queue': 0}
            ]
          });
        }
      };

      // Testing  private method is evil, but it does a decent amount of
      // work and we want the aid in debugging issues.
      ns.BundleHelpers._watchDeploymentUpdates(
          watchId,
          env,
          db
      );
    });

    it('provides a error when the deploy watch says so', function(done) {
      var watchId = 1;

      // This will get called twice. First with an update that it was
      // scheduled, then with a second call that it's complete which stops
      // the look in the watch.
      db.notifications.add = function(info) {
        assert.equal(info.level, 'error');
        assert.isTrue(info.message.indexOf('boom') !== -1, info.message);
        done();
      };

      env.deployerWatchUpdate = function(watchId, callback) {
        callback({
          err: undefined,
          Changes: [
            // Copied right from the docs of the charm.
            {'DeploymentId': 42, 'Status': 'completed', 'Time': 1377080066,
              'Queue': 2, 'Error': 'Deploy go boom!'},
            {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080062,
              'Queue': 1},
            {'DeploymentId': 42, 'Status': 'started', 'Time': 1377080000,
              'Queue': 0}
          ]
        });
      };

      // Testing  private method is evil, but it does a decent amount of
      // work and we want the aid in debugging issues.
      ns.BundleHelpers._watchDeploymentUpdates(
          watchId,
          env,
          db
      );
    });


    it('the stack of deploy to watch integrate', function(done) {
      // By stubbing only the env calls to behave properly, we should be able to
      // verify that the bundle-import-helpers stack up and call in proper
      // succession to get a deployment id, then a watcher id, then the watch
      // status updates, and then completes.

      // Stub out the env call to make sure we check the params and call the
      // provided callback.
      env.deployerImport = function(bundle, name, callback) {
        callback({
          err: undefined,
          DeploymentId: 10
        });
      };

      env.deployerWatch = function(deploymentId, callback) {
        callback({
          WatchId: 1
        });
      };

      var updated = false;
      env.deployerWatchUpdate = function(watchId, callback) {
        if (!updated) {
          updated = true;
          callback({
            err: undefined,
            Changes: [
              // Copied right from the docs of the charm.
              {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080066,
                'Queue': 2},
              {'DeploymentId': 42, 'Status': 'scheduled', 'Time': 1377080062,
                'Queue': 1},
              {'DeploymentId': 42, 'Status': 'started', 'Time': 1377080000,
                'Queue': 0}
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
                'Queue': 0}
            ]
          });
        }
      };

      // We'll be called several times.
      // 1. Deployment Requested.
      // 2. Watching will pass without a notification.
      // 3. The status will first be scheduled.
      // 4. The status will be completed.
      var called = 0;
      db.notifications.add = function(info) {
        switch (called) {
          case 0:
            assert.notEqual(
                info.title.indexOf('requested'), -1, 'not requested');
            break;
          case 1:
            assert.notEqual(
                info.message.indexOf('scheduled'), -1, 'not scheduled');
            break;
          case 2:
            assert.notEqual(
                info.message.indexOf('completed'), -1, 'not completed');
            done();
            break;
        }
        called = called + 1;
      };

      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', env, db);

    });

  });
})();
