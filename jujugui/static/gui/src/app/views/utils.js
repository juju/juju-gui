/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const utils = {};

/**
   Get a list of all the supported series.

   @method getSeriesList
   @return {Object} A collection of series.
 */
utils.getSeriesList = function() {
  // For a list of supported series in Juju see:
  // https://github.com/juju/charmstore/blob/v5-unstable/internal/
  // series/series.go#L37
  return {
    precise: {name: 'Precise 12.04'},
    trusty: {name: 'Trusty 14.04'},
    xenial: {name: 'Xenial 16.04'},
    centos7: {name: 'CentOS 7'},
    win2012hvr2: {name: 'Windows Server 2012 R2 Hyper-V'},
    win2012hv: {name: 'Windows Server 2012 Hyper-V'},
    win2012r2: {name: 'Windows Server 2012 R2'},
    win2012: {name: 'Windows Server 2012'}
  };
};

/**
 * Ensure a trailing slash on a string.
 * @method ensureTrailingSlash
 * @param {String} text The input string to check.
 * @return {String} The output string with trailing slash.
 */
utils.ensureTrailingSlash = function(text) {
  if (text.lastIndexOf('/') !== text.length - 1) {
    text += '/';
  }
  return text;
};

/**
  Given the db, env, service, unit count and constraints, create and auto
  place those units on new machines.

  @method createMachinesPlaceUnits
  @param {Object} db Reference to the app db.
  @param {Object} env Reference to the app env.
  @param {Object} service Reference to the service model to add units to.
  @param {Integer} numUnits The unit count from the form input.
  @param {Object} constraints The constraints to create the new machines with.
*/
utils.createMachinesPlaceUnits = function(
  db, env, service, numUnits, constraints) {
  let machine;
  let parentId = null;
  let containerType =null;
  for (let i = 0; i < parseInt(numUnits, 10); i += 1) {
    machine = db.machines.addGhost(
      parentId, containerType,
      {constraints: utils.formatConstraints(constraints)});
    env.addMachines([{
      constraints: constraints
    }], function(machine) {
      db.machines.remove(machine);
    }.bind(this, machine), { modelId: machine.id});
    env.placeUnit(
      utils.addGhostAndEcsUnits(db, env, service, 1)[0],
      machine.id);
  }
};

/**
  Given the db, env, service, and unit count, add these units to the db
  and to the environment such that the unit tokens can be displayed and that
  the ECS will clean them up on deploy.

  @method addGhostAndEcsUnits
  @param {Object} db Reference to the app db.
  @param {Object} env Reference to the app env.
  @param {Object} service Reference to the service model to add units to.
  @param {Integer} unitCount the unit count from the form input.
  @param {Function} callback optional The callback to call after the units
    have been added to the env.
*/
utils.addGhostAndEcsUnits = function(db, env, service, unitCount, callback) {
  var serviceName = service.get('id'),
      unitCount = parseInt(unitCount, 10),
      units = [],
      displayName, ghostUnit, unitId, unitIdCount;
  // u will be a unit OR the previous unit index value.
  const parseId = u => parseInt((u.id && u.id.split('/')[1]) || u, 10);
  const serviceUnits = service.get('units').toArray();
  let highestIndex = -1;
  if (serviceUnits.length) {
    highestIndex = serviceUnits.reduce(
      (prev, curr) => Math.max(parseId(prev), parseId(curr)), 0);
  }
  // Service names have a $ in them when they are uncommitted. Uncomitted
  // service's display names are also wrapped in parens to display on the
  // canvas.
  if (serviceName.indexOf('$') > 0) {
    displayName = service.get('displayName')
      .replace(/^\(/, '').replace(/\)$/, '');
  } else {
    displayName = serviceName;
  }

  for (let i = 1; i <= unitCount; i += 1) {
    unitIdCount = highestIndex + i;
    unitId = serviceName + '/' + unitIdCount;
    ghostUnit = db.addUnits({
      id: unitId,
      displayName: displayName + '/' + unitIdCount,
      charmUrl: service.get('charm'),
      subordinate: service.get('subordinate')
    });
    env.add_unit(
      serviceName,
      1,
      null,
      removeGhostAddUnitCallback.bind(null, ghostUnit, db, callback),
      {modelId: unitId});
    units.push(ghostUnit);
  }
  return units;
};

/**
  Callback for the env add_unit call from tne addGhostAndEcsUnit method.

  @method removeGhostAndUnitCallback
  @param {Object} ghostUnit the ghost unit created in the db which this fn
    needs to remove.
  @param {Object} db Reference to the app db instance.
  @param {Function} callback The user supplied callback for the env add_unit
    call.
  @param {Object} e env add_unit event facade.
*/
function removeGhostAddUnitCallback(ghostUnit, db, callback, e) {
  // Remove the ghost unit: the real unit will be re-added by the
  // mega-watcher handlers.
  ghostUnit.service = e.applicationName;
  db.removeUnits(ghostUnit);
  if (typeof callback === 'function') {
    callback(e, db, ghostUnit);
  }
}
utils.removeGhostAddUnitCallback = removeGhostAddUnitCallback;

/**
  Returns the icon path result from either the Juju environment (for local
  charms) or the charmstore (for all others). You should call this method
  instead of the others directly to maintain consistency throughout the app.

  @method getIconPath
  @param {String} charmId The id of the charm to fetch the icon for.
  @param {Boolean} isBundle Whether or not this is an icon for a bundle.
*/
utils.getIconPath = function(charmId, isBundle, env) {
  var cfg = window.juju_config,
      charmstoreURL = (cfg && cfg.charmstoreURL) || '',
      localIndex = charmId.indexOf('local:'),
      path;
  charmstoreURL = utils.ensureTrailingSlash(charmstoreURL);

  if (localIndex > -1 && env) {
    path = env.getLocalCharmIcon(charmId);
  } else if (localIndex === -1) {
    if (typeof isBundle === 'boolean' && isBundle) {
      var staticURL = '';
      if (window.juju_config && window.juju_config.staticURL) {
        // The missing slash is important because we need to use an
        // associated path for GISF but a root path for GiJoe.
        staticURL = window.juju_config.staticURL + '/';
      }
      var basePath = `${staticURL}static/gui/build/app`;
      path = `${basePath}/assets/images/non-sprites/bundle.svg`;
    } else {
      // Get the charm ID from the service.  In some cases, this will be
      // the charm URL with a protocol, which will need to be removed.
      // The following regular expression removes everything up to the
      // colon portion of the quote and leaves behind a charm ID.
      charmId = charmId.replace(/^[^:]+:/, '');
      // Note that we make sure isBundle is Boolean. It's coming from a
      // handlebars template helper which will make the second argument the
      // context object when it's not supplied. We want it optional for
      // normal use to default to the charm version, but if it's a boolean,
      // then check that boolean because the author cares specifically if
      // it's a bundle or not.
      path = charmstoreURL + [
        window.jujulib.charmstoreAPIVersion, charmId, 'icon.svg'].join('/');
    }
  } else {
    // If no env is provided as necessary then return the default icon.
    path = 'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
  }
  return path;
};

/**
  Parses the error string and determines if the error is a redirect error.

  @method isRedirectError
  @param {String} error The error string returned from the api server.
  @return {Boolean} Whether it is a redirect error or not.
*/
utils.isRedirectError = function(error) {
  return error === 'authentication failed: redirection required';
};

/**
  Check that a value is valid and not null.

  @method isValue
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is not undefined, null or NaN.
*/
utils.isValue = value => {
  return value !== undefined && value !== null;
};

/**
  Check that a value is an object.

  @method isObject
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is an object.
*/
utils.isObject = value => {
  return typeof(value) === 'object' && value !== null &&
    !Array.isArray(value);
};

/**
  Remove duplicate entries from an array.

  @method arrayDedupe
  @returns {Array} An array with no duplicates.
*/
utils.arrayDedupe = function(array) {
  // Sets can only contain unique values, so use that to do the dedupe and
  // then turn it back into an array.
  return [...new Set(array)];
};

/**
  Turn an array of arrays into a single array.

  @method arrayFlatten
  @returns {Array} A single depth array.
*/
utils.arrayFlatten = function(array) {
  return array.reduce((flattened, current) => {
    return flattened.concat(
      // If this is an array then flatten it before concat, otherwise concat
      // the current value.
      Array.isArray(current) ? utils.arrayFlatten(current) : current);
  }, []);
};

/**
  Format the constraints to: cpu-power=w cores=x mem=y root-disk=z

  @method formatConstraints
  @param constraints {Object} A collection of constraints.
  @returns {String} A formatted constraints string.
*/
utils.formatConstraints = constraints => {
  return Object.keys(constraints || {}).reduce((collected, key) => {
    const value = constraints[key];
    if (value) {
      collected.push(key + '=' + value);
    }
    return collected;
  }, []).join(' ');
};

if (module && module.exports) {
  module.exports = utils;
}
if (YUI) {
  YUI.add('juju-view-utils', function(Y) {
    Y.namespace('juju.views').utils = utils;
  }, '0.1.0', {
    requires: [
    ]
  });
}
