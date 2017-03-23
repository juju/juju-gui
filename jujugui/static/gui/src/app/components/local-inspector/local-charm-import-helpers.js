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

YUI.add('local-charm-import-helpers', function(Y) {
  var ns = Y.namespace('juju');

  ns.localCharmHelpers = {

    /**
      Public method to upgrade a collection of services from a local charm.

      @method upgradeServiceUsingLocalCharm
      @param {Object} env reference to the environment.
      @param {Object} db reference to the database.
      @param {Array} services an array of services to upgrade.
      @param {Object} file the file object from the browser.
    */
    upgradeServiceUsingLocalCharm: function(env, db, services, file) {
      var series = services[0].get('charm').match(/[^:]*(?=\/)/)[0];
      ns.localCharmHelpers.uploadLocalCharm(env, db, series, file, {
        services: services
      });
    },

    /**
      Sends the local charm file contents and callbacks to the uploadLocalCharm
      method in the environment.

      @method uploadLocalCharm
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
      @param {String} series the series to deploy the charm to.
      @param {Object} file The file object from the browser.
      @param {Object} options a collection of options to pass to the
        uploadLocalCharm callbacks.
    */
    uploadLocalCharm: function(env, db, series, file, options) {
      var helper = ns.localCharmHelpers;
      series = series || env.get('defaultSeries');
      env.uploadLocalCharm(
          file,
          series,
          helper._uploadLocalCharmProgress,
          helper._uploadLocalCharmLoad.bind(null, file, env, db, options));
    },

    /**
      Queries Juju for the charm details of the recently uploaded charm.

      @method loadCharmDetails
      @param {String} charmUrl The url of the charm in the environment to deploy
        ex) "local:precise/ghost-4".
      @param {Object} env Reference to the environment.
      @param {Function} callback The callback to call once the charm data
        has been loaded.
    */
    loadCharmDetails: function(charmUrl, env, callback) {
      var charm = new Y.juju.models.Charm({ id: charmUrl });
      charm.after('load', function(e) {
        callback(charm);
      });
      charm.load(env);
    },

    /**
      Callback for the loadCharmDetails method.

      Fires the initiateDeploy event to deploy the ghost inspector.

      @method _loadCharmDetailsCallback
      @param {Object} charm The loaded charm model.
    */
    _loadCharmDetailsCallback: function(charm) {
      // The charm is generated and populated in loadCharmDetails() then passed
      // here and fired in this event which the deployService() method of the
      // application catches to show the ghostInspector.
      Y.fire('initiateDeploy', charm, {});
    },


    /**
      Callback for the progress events returned from uploading the charm.

      XXX noop right now until this is implemented better cross browser.
      Most browsers right now only fire two progress events, start and finish.

      @method _uploadLocalCharmProgress
      @param {Object} e The progress event.
    */
    _uploadLocalCharmProgress: function(e) {},

    /**
      Callback for the load event returned from uploading the charm.

      The load event is fired as long as the XHR request returns from anything
      except a complete network failure so this also needs to handle errors
      returned from the server.

      @method _uploadLocalCharmLoad
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
      @param {Object} options a collection of options from the charm upload.
      @param {Object} e The load event.
    */
    _uploadLocalCharmLoad: function(file, env, db, options, e) {
      var helper = ns.localCharmHelpers,
          notifications = db.notifications;

      var res = helper._parseUploadResponse(e.target.responseText);

      if (e.type === 'error' || e.target.status >= 400) {
        notifications.add({
          title: 'Import failed',
          message: 'Import from "' + file.name + '" failed. ' + res.Error,
          level: 'error'
        });
        console.log('error', e);
      } else {

        notifications.add({
          title: 'Imported local charm file',
          message: 'Import from "' + file.name + '" successful.',
          level: 'important'
        });

        var callback;
        if (options && options.services) {
          callback = helper._upgradeServices.bind(
              null, options.services, env, db);
        } else {
          callback = helper._loadCharmDetailsCallback;
        }
        helper.loadCharmDetails(res['charm-url'], env, callback);
      }
    },

    /**
      Upgrades a collection of services to the specified charm.

      @method _upgradeServices
      @param {Object} services the services to upgrade.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
      @param {Object} charm the upgraded charm.
    */
    _upgradeServices: function(services, env, db, charm) {
      var charmUrl = charm.get('id');
      var helper = ns.localCharmHelpers;
      services.forEach(function(service) {
        env.setCharm(
            service.get('id'),
            charmUrl,
            false,
            helper._showServiceUpgradedNotification.bind(null, db));
      });
    },

    /**
      Shows a notification after the service upgrade.

      @method _showServiceUpgradedNotification
      @param {Object} db Reference to the database.
      @param {Object} result the result of the service upgrade.
    */
    _showServiceUpgradedNotification: function(db, result) {
      if (result.err) {
        db.notifications.add({
          title: 'Error upgrading charm.',
          message: result.err,
          level: 'error'
        });
        return;
      }
      db.notifications.add({
        title: 'Charm upgrade accepted',
        message: 'Upgrade for "' + result.applicationName + '" from "' +
            result.charmUrl + '" accepted.',
        level: 'important'
      });
    },

    /**
      Parses the upload response returned from Juju.

      @method _parseUploadResponse
      @param {String} data The data returned from the charm upload.
    */
    _parseUploadResponse: function(data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }

    }

  };

}, '0.1.0', {
  requires: [
  ]
});
