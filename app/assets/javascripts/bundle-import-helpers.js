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

YUI.add('bundle-import-helpers', function(Y) {
  var ns = Y.namespace('juju'),
      utils = Y.namespace('juju.views.utils');

  ns.BundleImport = {
    /**
      Calls the deployer import method with the bundle data
      to deploy the bundle to the environment.

      @method deployBundle
      @param {Object} bundle Bundle data.
    */
    deployBundle: function(bundle, env, db) {
      var notifications = db.notifications;
      if (!Y.Lang.isFunction(env.deployerImport)) {
        env.deployerImport(
            Y.JSON.stringify({
              bundle: bundle
            }),
            null,
            Y.bind(utils.deployBundleCallback, null, notifications)
        );
      }
    },

    sendToDeployer: function(fileSources, env, db) {
      var notifications = db.notifications;
      if (!Y.Lang.isFunction(env.deployerImport)) {
        // Notify the user that their environment is too old and return.
        notifications.add({
          title: 'Deployer Import Unsupported',
          message: 'Your environment is too old to support deployer file' +
              ' imports directly. Please consider upgrading to use' +
              ' this feature.',
          level: 'important'
        });
        return;
      }

      // Handle dropping Deployer files on the canvas.
      Y.Array.each(fileSources, function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          // Import each into the environment
          env.deployerImport(e.target.result, null, function(result) {
            if (!result.err) {
              notifications.add({
                title: 'Imported Deployer file',
                message: 'Import from "' + file.name + '" successful. This ' +
                    'can take some time to complete.',
                level: 'important'
              });
            } else {
              console.warn('import failed', file, result);
              notifications.add({
                title: 'Import Environment Failed',
                message: 'Import from "' + file.name +
                    '" failed.<br/>' + result.err,
                level: 'error'
              });
            }
          });
        };
        reader.readAsText(file);
      });
    },

    /**
      Watch a deployment for changes and notify the user of updates.

      @method watchDeployment
      @param {Integer} deploymentId The ID returned from the deployment call.
      @param {Environment} env The environment so that we can call the back
      end.
      @param {Database} db The db which contains the NotificationList used
      for adding notifications to the system.
     */
    watchDeployment: function(deploymentId, env, db) {
      var notifications = db.notifications;

      // First generate a watch.
      env.deployerWatch(deploymentId, function(data) {
        if (data.err) {
          notifications.add({
            title: 'Unable to watch status of import.',
            message: 'Attempting to watch the deployment failed: ' +
                data.err,
            level: 'error'
          });
        } else {
          ns.BundleImport._processWatchDeploymentUpdates(
              data.WatchId, env, db);
        }
      });
    },

    /**
      Once we've got a Watch, we need to continue to call Next on it to
      receive updates. Watch the deployment until it's either completed or
      we've gotten an error.

      @method watchDeployment
      @param {Integer} watchId The ID of the Watcher from the watchDeployment
      call.
      @param {Environment} env The environment so that we can call the
      back end.
      @param {Database} db The db which contains the NotificationList used
      for adding notifications to the system.
     */
    _processWatchDeploymentUpdates: function(watchId, env, db) {
      // Now that we've got a watcher we can continue to monitor it for
      // changes. Each time we get a response we check if the deployment
      // is complete. If so, we stop watching.
      var done = false,
          notifications = db.notifications;

      var processUpdate = function(data) {
        if (data.err) {
          // Make sure we stop watching. There was an error, ignore
          // further updates.
          done = true;

          notifications.add({
            title: 'Error watching deployment',
            message: 'The watch of the deployment errored:' +
                data.err,
            level: 'error'
          });
        } else {
          // Just grab the latest change and notify the user of the
          // status.
          var newChange = data.Changes[0];
          // If the status is 'completed' then we're done watching this.
          if (newChange.Status === 'completed') {
            done = true;
          }
          notifications.add({
            title: 'Updated status for deployment: ' +
                newChange.DeploymentId,
            message: 'The deployment is currently: ' +
                newChange.Status,
            level: 'info'
          });
        }
      };

      while (!done) {
        env.deployerWatchUpdate(watchId, processUpdate);
      }
    }

  };

}, '0.1.0', {
  requires: [
    'juju-view-utils'
  ]
});
