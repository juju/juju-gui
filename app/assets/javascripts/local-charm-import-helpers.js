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
      Public method entry to deploy local charm.

      Calls the _requestSeries() method to request the series to deploy their
      local charm to.

      @method deployLocalCharm
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
    */
    deployLocalCharm: function(file, env, db) {
      ns.localCharmHelpers._requestSeries(file, env, db);
    },

    /**
      Sends the local charm file contents and callbacks to the uploadLocalCharm
      method in the environment.

      @method uploadLocalCharm
      @param {String} series The Ubuntu series to deploy to.
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
      @param {Object} options Optional A collection of options to send to the
                      uploadLocalCharm load callback.
    */
    uploadLocalCharm: function(series, file, env, db, options) {
      var helper = ns.localCharmHelpers;
      series = series || env.get('defaultSeries');
      env.uploadLocalCharm(
          file,
          series,
          helper._uploadLocalCharmProgress,
          helper._uploadLocalCharmLoad.bind(null, file, env, db, options));
    },

    /**
      Requests the series to deploy their local charm to by rendering an
      inspector with the requestSeries viewlet

      @method _requestSeries
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
    */
    _requestSeries: function(file, env, db) {
      var container = Y.Node.create(
          Y.juju.views.Templates['service-inspector']());

      container.appendTo(Y.one('#content'));

      var viewletManager = new Y.juju.viewlets.ViewletManager({
        container: container,
        viewletContainer: '.viewlet-container',
        template: '<div class="viewlet-container"></div>',
        // views accepts views and viewlets
        views: {
          'requestSeries': Y.juju.viewlets.requestSeries
        },
        model: {
          name: file.name,
          size: file.size,
          defaultSeries: env.get('defaultSeries')
        }
      });

      viewletManager.render();
      viewletManager.showViewlet('requestSeries');

      ns.localCharmHelpers._attachViewletEvents(viewletManager, file, env, db);
    },

    /**
      Attaches the events for the inspector externally until we are able to
      refactor the viewletManager to handle event bindings.

      @method _attachViewletEvents
      @param {Object} viewletManager The reference to the viewletManager.
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
    */
    _attachViewletEvents: function(viewletManager, file, env, db) {
      var handlers = [],
          helper = ns.localCharmHelpers,
          container = viewletManager.get('container');

      handlers.push(
          container.one('button.cancel').on(
              'click', helper._cleanUp, null, viewletManager, handlers));
      handlers.push(
          container.one('button.confirm').on(
              'click',
              helper._chooseSeriesHandler, null,
              viewletManager, handlers, file, env, db));
    },

    /**
      Destroys the viewletManager and detaches the attached events

      @method _cleanUp
      @param {Object} _ The click event object.
      @param {Object} viewletManager Reference to the viewletManager.
      @param {Array} handlers Collection of event handlers to detach.
    */
    _cleanUp: function(_, viewletManager, handlers) {
      viewletManager.destroy();
      handlers.forEach(function(event) {
        if (event && event.detach && typeof event.detach === 'function') {
          event.detach();
        }
      });
    },

    /**
      Series select confirm button click event handler. Handles getting the
      series, cleaning up, and calling the upload method.

      @method _chooseSeriesHandler
      @param {Object} _ The click event object.
      @param {Object} viewletManager Reference to the viewletManager.
      @param {Array} handlers Collection of event handlers to detach.
      @param {Object} file The file object from the browser.
      @param {Object} env Reference to the environment.
      @param {Object} db Reference to the database.
    */
    _chooseSeriesHandler: function(e, viewletManager, handlers, file, env, db) {
      var helper = ns.localCharmHelpers;
      var series = helper._getSeriesValue(viewletManager);
      helper._cleanUp(null, viewletManager, handlers);
      helper.uploadLocalCharm(series, file, env, db);
    },

    /**
      Grabs the series value from the user input field in the inspector

      @method _getSeriesValue
      @param {Object} viewletManager Reference to the viewletManager.
      @return {String} The series to deploy the charm to.
    */
    _getSeriesValue: function(viewletManager) {
      return viewletManager.get('container')
                           .one('input[defaultSeries]').get('value');
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
      var handler = charm.after('load', function(e) {
        handler.detach();
        callback(charm, env);
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
      Shows notifications for the status of the local charm upgrade. Callback
      after a successful upload of the charm to upgrade.

      @method _localCharmUpgradeCallback
      @param {Object} db A reference to the db.
      @param {Object} options The options from the file drop.
      @param {Object} charm The charm model to upgrade to.
      @param {Object} env A reference to the environment.
    */
    _localCharmUpgradeCallback: function(db, options, charm, env) {
      env.setCharm(options.serviceId, charm.get('id'), false, function(e) {
        if (e.err) {
          db.notifications.add({
            title: 'Charm upgrade failed',
            message: 'Upgrade for "' + e.service_name + '" failed. ' + e.err,
            level: 'error'
          });
        } else {
          db.notifications.add({
            title: 'Charm upgrade accepted',
            message: 'Upgrade for "' + e.service_name + '" from "' +
                e.charm_url + '" accepted.',
            level: 'important'
          });
        }
      });
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
      @param {Object} e The load event.
      @param {Object} options Optional A collection of options to send to the
                      uploadLocalCharm load callback.
    */
    _uploadLocalCharmLoad: function(file, env, db, options, e) {
      var helper = ns.localCharmHelpers,
          notifications = db.notifications;

      var res = helper._parseUploadResponse(e.target.responseText);

      if (e.type === 'error' || e.target.status >= 400) {
        // If the server does not return a properly formatted error response
        // then it's safe to assume that local charm upload is not supported.
        var errorMessage = res.Error || 'Your version of ' +
                'Juju does not support local charm uploads. Please use at ' +
                'least version 1.18.0.';

        notifications.add({
          title: 'Import failed',
          message: 'Import from "' + file.name + '" failed. ' + errorMessage,
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

        if (options && options.upgrade) {
          callback = helper._localCharmUpgradeCallback.bind(null, db, options);
        } else {
          callback = helper._loadCharmDetailsCallback;
        }

        helper.loadCharmDetails(res.CharmURL, env, callback);
      }
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
    'viewlet-request-series',
    'juju-viewlet-manager'
  ]
});
