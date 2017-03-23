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

  describe('bundle-import-notifications', function() {
    var db, env, ns;

    before(function(done) {
      YUI(GlobalConfig).use(
          'bundle-import-notifications',
          function(Y) {
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
      ns.BundleNotifications._watchDeploymentUpdates(watchId, env, db);
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
      ns.BundleNotifications._watchDeploymentUpdates(watchId, env, db);
    });
  });

  describe('bundle helpers _notifyDeploymentChange', function() {
    var bundleNotifications, db;
    var requirements = ['bundle-import-notifications'];

    before(function(done) {
      YUI(GlobalConfig).use(requirements, function(Y) {
        bundleNotifications = Y.namespace('juju').BundleNotifications;
        done();
      });
    });

    beforeEach(function() {
      db = {notifications: {add: sinon.stub()}};
    });

    // Ensure the expected notification has been added to the database.
    var assertNotification = function(expectedNotification) {
      assert.strictEqual(db.notifications.add.calledOnce, true);
      var args = db.notifications.add.lastCall.args;
      assert.lengthOf(args, 1);
      assert.deepEqual(args[0], expectedNotification);
    };

    it('notifies an error', function() {
      bundleNotifications._notifyDeploymentChange(
          db, 42, 'completed', 'bad wolf');
      assertNotification({
        title: 'Updated status for deployment id: 42',
        message: 'An error occurred while deploying the bundle: bad wolf',
        level: 'error'
      });
    });

    it('notifies that a bundle deployment is pending', function() {
      bundleNotifications._notifyDeploymentChange(db, 1, 'scheduled');
      assertNotification({
        title: 'Updated status for deployment id: 1',
        message: 'The deployment has been scheduled and is now pending',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment is started', function() {
      bundleNotifications._notifyDeploymentChange(db, 2, 'started');
      assertNotification({
        title: 'Updated status for deployment id: 2',
        message: 'The deployment is currently in progress',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment is completed', function() {
      bundleNotifications._notifyDeploymentChange(db, 3, 'completed');
      assertNotification({
        title: 'Updated status for deployment id: 3',
        message: 'The deployment has been successfully completed',
        level: 'important'
      });
    });

    it('notifies that a bundle deployment has been cancelled', function() {
      bundleNotifications._notifyDeploymentChange(db, 4, 'cancelled');
      assertNotification({
        title: 'Updated status for deployment id: 4',
        message: 'The deployment has been cancelled',
        level: 'important'
      });
    });

  });

})();
