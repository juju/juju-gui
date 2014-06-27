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
    var db, env, ns, utils, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use('bundle-import-helpers', 'juju-tests-utils',
          function(Y) {
            ns = Y.namespace('juju');
            utils = Y.namespace('juju-tests').utils;
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
      ns.BundleHelpers.deployBundle('test bundle', undefined, env, db);
    });

    it('errors when the bundle import fails from the env', function() {
      var add = utils.makeStubMethod(db.notifications, 'add');
      this._cleanups.push(add.reset);
      env.deployerImport = function(bundle, bundleData, callback) {
        callback({
          err: 'Abort abort!'
        });
      };
      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', '~jorge/wiki/wiki', env, db);
      var addArgs = add.allArguments();
      assert.deepEqual(addArgs[0][0], {
        level: 'important',
        message: 'Waiting for bundle deployment request confirmation.',
        title: 'Bundle deployment requested'
      });
      assert.deepEqual(addArgs[1][0], {
        level: 'error',
        message: 'Unable to deploy the bundle. The server returned the ' +
            'following error: Abort abort!',
        title: 'Bundle deployment failed'
      });
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
      env.deployerImport = function(bundle, bundleData, callback) {
        assert.equal(bundle, 'test bundle');
        assert.equal(bundleData.id, '~jorge/wiki/wiki');
        assert.equal(
            bundleData.name, null,
            'The name is not currently supported or passed.');
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
        assert.equal(true, hitNotifications);
        done();
      };

      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', '~jorge/wiki/wiki', env, db);
    });

    it('provides a notification when a deploy watch updates', function(done) {
      var watchId = 1;
      var callNumber = 0;

      // This will get called twice. First with an update that it was
      // scheduled, then with a second call that it's complete which stops
      // the look in the watch.
      db.notifications.add = function(info) {
        assert.strictEqual('Updated status for deployment id: 42', info.title);
        assert.strictEqual(info.level, 'important');
        if (callNumber === 0) {
          assert.include(info.message, 'scheduled');
        } else {
          assert.include(info.message, 'completed');
          done();
        }
        callNumber = callNumber + 1;
      };

      var called = false;
      env.deployerNext = function(watchId, callback) {
        if (!called) {
          called = true;
          callback({
            err: undefined,
            Changes: [
              {DeploymentId: 42, Status: 'scheduled', Time: 47, Queue: 1}
            ]
          });
        } else {
          // Make that this is done now.
          callback({
            err: undefined,
            Changes: [
              {DeploymentId: 42, Status: 'scheduled', Time: 47, Queue: 1},
              {DeploymentId: 42, Status: 'started', Time: 48, Queue: 0},
              {DeploymentId: 42, Status: 'completed', Time: 49}
            ]
          });
        }
      };

      // Testing private method is evil, but it does a decent amount of
      // work and we want the aid in debugging issues.
      ns.BundleHelpers._watchDeploymentUpdates(watchId, env, db);
    });

    it('provides a error when the deploy watch says so', function(done) {
      var watchId = 1;
      // This will get called twice. First with an update that it was
      // scheduled, then with a second call that it's complete which stops
      // the look in the watch.
      db.notifications.add = function(info) {
        assert.strictEqual(info.level, 'error');
        assert.include(info.message, 'boom!');
        done();
      };

      env.deployerNext = function(watchId, callback) {
        callback({
          err: undefined,
          Changes: [
            {DeploymentId: 42, Status: 'started', Time: 47, Queue: 0},
            {DeploymentId: 42, Status: 'completed', Time: 48,
              Error: 'Deploy go boom!'}
          ]
        });
      };

      // Testing private method is evil, but it does a decent amount of
      // work and we want the aid in debugging issues.
      ns.BundleHelpers._watchDeploymentUpdates(watchId, env, db);
    });

    it('the stack of deploy to watch integrate', function() {
      // By stubbing only the env calls to behave properly, we should be able to
      // verify that the bundle-import-helpers stack up and call in proper
      // succession to get a deployment id, then a watcher id, then the watch
      // status updates, and then completes.

      // Stub out the env call to make sure we check the params and call the
      // provided callback.
      env.deployerImport = function(bundle, bundleData, callback) {
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
      env.deployerNext = function(watchId, callback) {
        if (!updated) {
          updated = true;
          callback({
            err: undefined,
            Changes: [
              {DeploymentId: 42, Status: 'scheduled', Time: 47, Queue: 1},
              {DeploymentId: 42, Status: 'started', Time: 48, Queue: 0}
            ]
          });
        } else {
          // Make that this is done now.
          callback({
            err: undefined,
            Changes: [{DeploymentId: 42, Status: 'completed', Time: 49}]
          });
        }
      };
      var add = utils.makeStubMethod(db.notifications, 'add');
      this._cleanups.push(add.reset);
      // Start the process by deploying the bundle.
      ns.BundleHelpers.deployBundle('test bundle', undefined, env, db);
      assert.equal(add.callCount(), 4);
      var addArgs = add.allArguments();
      assert.deepEqual(addArgs[0][0], {
        level: 'important',
        message: 'Waiting for bundle deployment request confirmation.',
        title: 'Bundle deployment requested'
      });
      assert.deepEqual(addArgs[1][0], {
        level: 'important',
        message: 'Bundle deployment request successful. The full deployment ' +
            'can take some time to complete.',
        title: 'Bundle deployment requested'
      });
      assert.deepEqual(addArgs[2][0], {
        level: 'important',
        message: 'The deployment is currently in progress',
        title: 'Updated status for deployment id: 42'
      });
      assert.deepEqual(addArgs[3][0], {
        level: 'important',
        message: 'The deployment has been successfully completed',
        title: 'Updated status for deployment id: 42'
      });
    });

  });

  describe('bundle helpers watchAll', function() {
    var bundleHelpers, conn, db, env, juju, testUtils, Y;
    var requirements = [
      'bundle-import-helpers', 'juju-env', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        juju = Y.namespace('juju');
        bundleHelpers = juju.BundleHelpers;
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      conn = new testUtils.SocketStub();
      env = juju.newEnvironment({
        conn: conn, user: 'user', password: 'password'
      }, 'go');
      env.connect();
      db = {notifications: {add: testUtils.makeStubFunction()}};
      bundleHelpers._watchDeployment = testUtils.makeStubFunction();
    });

    afterEach(function()  {
      env.destroy();
    });

    it('sends a deployer status message', function() {
      bundleHelpers.watchAll(env, db);
      var expectedMessage = {
        RequestId: 1,
        Type: 'Deployer',
        Request: 'Status',
        Params: {}
      };
      assert.deepEqual(conn.last_message(), expectedMessage);
    });

    it('handles status errors', function() {
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {},
        Error: 'bad wolf'
      });
      // No bundles are being watched.
      assert.strictEqual(bundleHelpers._watchDeployment.called(), false);
      // An error notification has been added.
      assert.strictEqual(db.notifications.add.calledOnce(), true);
      var args = db.notifications.add.lastArguments();
      assert.lengthOf(args, 1);
      var expectedNotification = {
        title: 'Unable to retrieve bundle deployment statuses',
        message: 'Failure retrieving bundles status: bad wolf',
        level: 'error'
      };
      assert.deepEqual(args[0], expectedNotification);
    });

    it('starts watching started/pending deployments', function() {
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {
          LastChanges: [
            {DeploymentId: 3, Status: 'started', Time: 42, Queue: 0},
            {DeploymentId: 5, Status: 'scheduled', Time: 47, Queue: 1}
          ]
        }
      });
      // We started observing the two bundles.
      assert.strictEqual(bundleHelpers._watchDeployment.callCount(), 2);
      var allArgs = bundleHelpers._watchDeployment.allArguments();
      assert.deepEqual([3, env, db], allArgs[0], 'first bundle');
      assert.deepEqual([5, env, db], allArgs[1], 'second bundle');
      // No notifications have been added.
      assert.strictEqual(db.notifications.add.called(), false);
    });

    it('notifies deployment errors occurred in the last hour', function() {
      var time = Date.now() / 1000; // Surely less than one hour ago.
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {
          LastChanges: [{
            DeploymentId: 7, Status: 'completed', Time: time, Error: 'bad wolf'
          }]
        }
      });
      // No bundles are being watched.
      assert.strictEqual(bundleHelpers._watchDeployment.called(), false);
      // An error notification has been added.
      assert.strictEqual(db.notifications.add.calledOnce(), true);
      var args = db.notifications.add.lastArguments();
      assert.lengthOf(args, 1);
      var expectedNotification = {
        title: 'Updated status for deployment id: 7',
        message: 'An error occurred while deploying the bundle: bad wolf',
        level: 'error'
      };
      assert.deepEqual(args[0], expectedNotification);
    });

    it('ignores completed deployments', function() {
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {
          LastChanges: [{DeploymentId: 3, Status: 'completed', Time: 42}]
        }
      });
      // No bundles are being watched.
      assert.strictEqual(bundleHelpers._watchDeployment.called(), false);
      // No notifications have been added.
      assert.strictEqual(db.notifications.add.called(), false);
    });

    it('ignores old failures', function() {
      var time = (Date.now() / 1000) - (60 * 61); // More than one hour ago.
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {
          LastChanges: [{
            DeploymentId: 7, Status: 'completed', Time: time, Error: 'bad wolf'
          }]
        }
      });
      // No bundles are being watched.
      assert.strictEqual(bundleHelpers._watchDeployment.called(), false);
      // No notifications have been added.
      assert.strictEqual(db.notifications.add.called(), false);
    });

    it('ignores cancelled deployments', function() {
      bundleHelpers.watchAll(env, db);
      // Simulate a response from the server.
      conn.msg({
        RequestId: 1,
        Response: {
          LastChanges: [{DeploymentId: 42, Status: 'cancelled', Time: 47}]
        }
      });
      // No bundles are being watched.
      assert.strictEqual(bundleHelpers._watchDeployment.called(), false);
      // No notifications have been added.
      assert.strictEqual(db.notifications.add.called(), false);
    });

  });

  describe('bundle helpers _notifyDeploymentChange', function() {
    var bundleHelpers, db, testUtils, Y;
    var requirements = ['bundle-import-helpers', 'juju-tests-utils'];

    before(function(done) {
      Y = YUI(GlobalConfig).use(requirements, function(Y) {
        bundleHelpers = Y.namespace('juju').BundleHelpers;
        testUtils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      db = {notifications: {add: testUtils.makeStubFunction()}};
    });

    // Ensure the expected notification has been added to the database.
    var assertNotification = function(expectedNotification) {
      assert.strictEqual(db.notifications.add.calledOnce(), true);
      var args = db.notifications.add.lastArguments();
      assert.lengthOf(args, 1);
      assert.deepEqual(args[0], expectedNotification);
    };

    it('notifies an error', function() {
      bundleHelpers._notifyDeploymentChange(db, 42, 'completed', 'bad wolf');
      assertNotification({
        title: 'Updated status for deployment id: 42',
        message: 'An error occurred while deploying the bundle: bad wolf',
        level: 'error'
      });
    });

    it('notifies that a bundle deployment is pending', function() {
      bundleHelpers._notifyDeploymentChange(db, 1, 'scheduled');
      assertNotification({
        title: 'Updated status for deployment id: 1',
        message: 'The deployment has been scheduled and is now pending',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment is started', function() {
      bundleHelpers._notifyDeploymentChange(db, 2, 'started');
      assertNotification({
        title: 'Updated status for deployment id: 2',
        message: 'The deployment is currently in progress',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment is completed', function() {
      bundleHelpers._notifyDeploymentChange(db, 3, 'completed');
      assertNotification({
        title: 'Updated status for deployment id: 3',
        message: 'The deployment has been successfully completed',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment has been cancelled', function() {
      bundleHelpers._notifyDeploymentChange(db, 4, 'cancelled');
      assertNotification({
        title: 'Updated status for deployment id: 4',
        message: 'The deployment has been cancelled',
        level: 'important'
      });
    });

  });

})();
