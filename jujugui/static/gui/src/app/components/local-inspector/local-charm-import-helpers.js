/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const yui = window.yui;

/**
  Public method to upgrade a collection of services from a local charm.
  @param {Object} env reference to the environment.
  @param {Object} db reference to the database.
  @param {Array} services an array of services to upgrade.
  @param {Object} file the file object from the browser.
*/
function upgradeServiceUsingLocalCharm(env, db, services, file) {
  const series = services[0].get('charm').match(/[^:]*(?=\/)/)[0];
  uploadLocalCharm(env, db, series, file, {
    services: services
  });
}

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
function uploadLocalCharm(env, db, series, file, options) {
  series = series || env.get('defaultSeries');
  env.uploadLocalCharm(
    file,
    series,
    _uploadLocalCharmProgress,
    _uploadLocalCharmLoad.bind(null, file, env, db, options));
}

/**
  Queries Juju for the charm details of the recently uploaded charm.

  @method loadCharmDetails
  @param {String} charmUrl The url of the charm in the environment to deploy
    ex) "local:precise/ghost-4".
  @param {Object} env Reference to the environment.
  @param {Function} callback The callback to call once the charm data
    has been loaded.
*/
function loadCharmDetails(charmUrl, env, callback) {
  var charm = new yui.juju.models.Charm({ id: charmUrl });
  charm.after('load', function(e) {
    callback(charm);
  });
  charm.load(env);
}

/**
  Callback for the loadCharmDetails method.
  Fires the initiateDeploy event to deploy the ghost inspector.
  @param {Object} charm The loaded charm model.
*/
function _loadCharmDetailsCallback(charm) {
  // The charm is generated and populated in loadCharmDetails() then passed
  // here and fired in this event which the deployService() method of the
  // application catches to show the ghostInspector.
  document.dispatchEvent(new CustomEvent('initiateDeploy', {'detail': {
    charm: charm,
    ghostAttributes: {}
  }}));
}
/**
  Callback for the progress events returned from uploading the charm.
  XXX noop right now until this is implemented better cross browser.
  Most browsers right now only fire two progress events, start and finish.
  @param {Object} e The progress event.
*/
function _uploadLocalCharmProgress(e) {}

/**
  Callback for the load event returned from uploading the charm.
  The load event is fired as long as the XHR request returns from anything
  except a complete network failure so this also needs to handle errors
  returned from the server.
  @param {Object} file The file object from the browser.
  @param {Object} env Reference to the environment.
  @param {Object} db Reference to the database.
  @param {Object} options a collection of options from the charm upload.
  @param {Object} e The load event.
*/
function _uploadLocalCharmLoad(file, env, db, options, e) {
  const notifications = db.notifications;
  const res = _parseUploadResponse(e.target.responseText);

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

    let callback;
    if (options && options.services) {
      callback = _upgradeServices.bind(
        null, options.services, env, db);
    } else {
      callback = _loadCharmDetailsCallback;
    }
    loadCharmDetails(res['charm-url'], env, callback);
  }
}

/**
  Upgrades a collection of services to the specified charm.
  @param {Object} services the services to upgrade.
  @param {Object} env Reference to the environment.
  @param {Object} db Reference to the database.
  @param {Object} charm the upgraded charm.
*/
function _upgradeServices(services, env, db, charm) {
  services.forEach(function(service) {
    env.setCharm(
      service.get('id'),
      charm.get('id'),
      false,
      _showServiceUpgradedNotification.bind(null, db));
  });
}

/**
  Shows a notification after the service upgrade.
  @param {Object} db Reference to the database.
  @param {Object} result the result of the service upgrade.
*/
function _showServiceUpgradedNotification(db, result) {
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
}

/**
  Parses the upload response returned from Juju.
  @param {String} data The data returned from the charm upload.
*/
function _parseUploadResponse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

module.exports = {
  upgradeServiceUsingLocalCharm,
  uploadLocalCharm
};
