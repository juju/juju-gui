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
  var ns = Y.namespace('juju');

  ns.BundleHelpers = {
    /**
      Calls the deployer import method with the bundle data
      to deploy the bundle to the environment.

      @method deployBundle
      @param {String} bundle Bundle YAML data.
      @param {String} bundleId Bundle ID for Charmworld.  May be null.
      @param {Environment} env Environment with access to the bundle back end.
      calls.
      @param {Database} db The app Database with access to the NotificationList.
    */
    deployBundle: function(bundle, bundleId, env, db, customCallback) {
      var notifications = db.notifications;

      var defaultCallback = function(result) {
        if (result.err) {
          console.log('bundle import failed:', result.err);
          notifications.add({
            title: 'Bundle deployment failed',
            message: 'Unable to deploy the bundle. The server returned the ' +
                'following error: ' + result.err,
            level: 'error'
          });
        } else {
          notifications.add({
            title: 'Bundle deployment requested',
            message: 'Bundle deployment request successful. The full ' +
                'deployment can take some time to complete',
            level: 'important'
          });

          ns.BundleHelpers._watchDeployment(result.DeploymentId, env, db);
        }
      };

      if (Y.Lang.isFunction(env.deployerImport)) {
        var bundleData = {
          name: null,
          id: bundleId
        };
        env.deployerImport(
            bundle,
            bundleData,
            customCallback ? customCallback : defaultCallback
        );
      } else {
        notifications.add({
          title: 'Bundle deployment not available.',
          message: 'Bundle deployments are not currently available for your' +
              'environment.',
          level: 'error'
        });
      }
    },

    /**
      Deploy one or more files, generally from the import file picker
      utility.

      @method deployBundleFiles
      @param {Array} fileSources The list of files from the import control.
      @param {Environment} env Environment with access to the bundle back end.
      calls.
      @param {Database} db The app Database with access to the NotificationList.
     */
    deployBundleFiles: function(fileSources, env, db) {
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

        // Once the file has been loaded, deploy it.
        reader.onload = function(e) {
          ns.BundleHelpers.deployBundle(
              e.target.result,
              undefined,
              env,
              db,
              function(result) {
                if (!result.err) {

                  notifications.add({
                    title: 'Imported Deployer file',
                    message: 'Import from "' + file.name +
                        '" successful. This ' +
                        'can take some time to complete.',
                    level: 'important'
                  });

                  ns.BundleHelpers._watchDeployment(
                      result.DeploymentId, env, db);

                } else {
                  console.warn('import failed', file, result);
                  notifications.add({
                    title: 'Import Environment Failed',
                    message: 'Import from "' + file.name +
                        '" failed.<br/>' + result.err,
                    level: 'error'
                  });
                }
              }
          );
        };

        // Start the loading process.
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
    _watchDeployment: function(deploymentId, env, db) {
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
          ns.BundleHelpers._watchDeploymentUpdates(
              data.WatchId, env, db);
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
      var notifications = db.notifications;

      var processUpdate = function(data) {
        if (data.err) {
          notifications.add({
            title: 'Error watching deployment',
            message: 'The watch of the deployment errored:' +
                data.err,
            level: 'error'
          });

          // Break the loop of calling for the next update from the server.
          return;

        } else {
          // Just grab the latest change and notify the user of the
          // status.
          var newChange = data.Changes[0];
          // The change could be the result of an error.
          if (newChange.Error !== undefined) {
            notifications.add({
              title: 'Updated status for deployment id: ' +
                  newChange.DeploymentId,
              message: 'The deployment errored: ' +
                  newChange.Error,
              level: 'error'
            });
          } else {
            notifications.add({
              title: 'Updated status for deployment id: ' +
                  newChange.DeploymentId,
              message: 'The deployment is currently: ' +
                  newChange.Status,
              level: 'important'
            });
          }

          // If the status is 'completed' then we're done watching this.
          if (newChange.Status === 'completed') {
            // There's nothing else to see here.
            return;
          } else {
            env.deployerWatchUpdate(watchId, processUpdate);
          }
        }
      };

      // Make the first call to the env and the processUpdate callback will
      // handle re-calling on each update.
      env.deployerWatchUpdate(watchId, processUpdate);
    }

  };

}, '0.1.0', {
  requires: []
});
