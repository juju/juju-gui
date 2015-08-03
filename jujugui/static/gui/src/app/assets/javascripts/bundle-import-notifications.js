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

YUI.add('bundle-import-notifications', function(Y) {
  var ns = Y.namespace('juju');

  // Maps bundle deployment statuses to notification messages.
  var STATUS_MESSAGES = {
    scheduled: 'The deployment has been scheduled and is now pending',
    started: 'The deployment is currently in progress',
    completed: 'The deployment has been successfully completed',
    cancelled: 'The deployment has been cancelled'
  };

  ns.BundleNotifications = {
    /**
      Start watching scheduled/started bundle deployments.
      Notify recently occurred deployment errors.
      @method watchAll
      @param {Environment} env The environment object exposing the Juju API.
      @param {Database} db The db which contains the NotificationList used
        for adding notifications to the system.
    */
    watchAll: function(env, db) {
      env.deployerStatus(function(response) {
        if (response.err) {
          db.notifications.add({
            title: 'Unable to retrieve bundle deployment statuses',
            message: 'Failure retrieving bundles status: ' + response.err,
            level: 'error'
          });
          return;
        }
        var timestamp = (Date.now() / 1000) - (60 * 60); // One hour ago.
        response.changes.forEach(function(change) {
          var status = change.status;
          // Start watching scheduled/in progress bundle deployments.
          if (status === 'scheduled' || status === 'started') {
            ns.BundleNotifications._watchDeployment(
                change.deploymentId, env, db);
            return;
          }
          // Notify bundle deployment errors occurred in the last hour.
          if (change.err && change.time >= timestamp) {
            ns.BundleNotifications._notifyDeploymentChange(
                db, change.deploymentId, status, change.err);
          }
          // If none of the previous blocks detect any changes then ignore
          // successfully completed/old/canceled deployments.
        });
      });
    },

    /**
      Notify a deployment change.
      Add a record to the notifications database.
      @method _notifyDeploymentChange
      @param {Database} db The db which contains the NotificationList used
        for adding notifications to the system.
      @param {Integer} deploymentId The bundle deployment identifier.
      @param {String} status The bundle deployment status
        ('scheduled', 'started', 'completed' or 'cancelled').
      @param {String} error The error message
        (only defined if an error occurred while deploying the bundle).
    */
    _notifyDeploymentChange: function(db, deploymentId, status, error) {
      var title = 'Updated status for deployment id: ' + deploymentId;
      if (error) {
        db.notifications.add({
          title: title,
          message: 'An error occurred while deploying the bundle: ' + error,
          level: 'error'
        });
      } else {
        db.notifications.add({
          title: title,
          message: STATUS_MESSAGES[status],
          level: 'important'
        });
      }
    },

    /**
      Watch a deployment for changes and notify the user of updates.
      @method _watchDeployment
      @param {Integer} deploymentId The ID returned from the deployment call.
      @param {Environment} env The environment so that we can call the backend.
      @param {Database} db The db which contains the NotificationList used
        for adding notifications to the system.
    */
    _watchDeployment: function(deploymentId, env, db) {
      // First generate a watch.
      env.deployerWatch(deploymentId, function(data) {
        if (data.err) {
          db.notifications.add({
            title: 'Unable to watch status of import.',
            message: 'Attempting to watch the deployment failed: ' + data.err,
            level: 'error'
          });
        } else {
          ns.BundleNotifications._watchDeploymentUpdates(data.WatchId, env, db);
        }
      });
    },

    /**
      Once we've got a Watch, we need to continue to call Next on it to
      receive updates. Watch the deployment until it's either completed or
      we've gotten an error.
      This will make nested calls upon each update from the server and could
      be a potential point for recursive callback issues. It appears that we
      should only get a couple of levels deep in the notification stack and
      will be safe.
      @method watchDeployment
      @param {Integer} watchId The ID of the Watcher from the watchDeployment
      call.
      @param {Environment} env The environment so that we can call the
      back end.
      @param {Database} db The db which contains the NotificationList used
      for adding notifications to the system.
     */
    _watchDeploymentUpdates: function(watchId, env, db) {

      var processUpdate = function(data) {
        if (data.err) {
          db.notifications.add({
            title: 'Error watching deployment',
            message: 'The watch of the deployment errored:' + data.err,
            level: 'error'
          });
          // Break the loop of calling for the next update from the server.
          return;
        } else {
          // Just grab the latest change and notify the user of the status.
          var newChange = data.Changes[data.Changes.length - 1];
          // Notify the new deployment change.
          ns.BundleNotifications._notifyDeploymentChange(
              db, newChange.DeploymentId, newChange.Status, newChange.Error);
          // If the status is 'completed' then we're done watching this.
          if (newChange.Status === 'completed') {
            // There's nothing else to see here.
            return;
          } else {
            env.deployerNext(watchId, processUpdate);
          }
        }
      };
      // Make the first call to the env and the processUpdate callback will
      // handle re-calling on each update.
      env.deployerNext(watchId, processUpdate);
    }

  };

}, '0.1.0', {
  requires: []
});
