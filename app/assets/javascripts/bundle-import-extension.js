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

YUI.add('bundle-import-extension', function(Y) {

  function BundleImport() {}

  BundleImport.prototype = {

    sendToDeployer: function(env, db, fileSources) {
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
          env.deployerImport(e.target.result, null, null, function(result) {
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
    }
  };

  Y.namespace('juju').BundleImport = BundleImport;


});
