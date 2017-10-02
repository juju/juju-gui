/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

var viewsUtils = {};

/**
   Get a list of all the supported series.

   @method getSeriesList
   @return {Object} A collection of series.
 */
viewsUtils.getSeriesList = function() {
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
viewsUtils.ensureTrailingSlash = function(text) {
  if (text.lastIndexOf('/') !== text.length - 1) {
    text += '/';
  }
  return text;
};

/**
  Returns the icon path result from either the Juju environment (for local
  charms) or the charmstore (for all others). You should call this method
  instead of the others directly to maintain consistency throughout the app.

  @method getIconPath
  @param {String} charmId The id of the charm to fetch the icon for.
  @param {Boolean} isBundle Whether or not this is an icon for a bundle.
*/
viewsUtils.getIconPath = function(charmId, isBundle, env) {
  var cfg = window.juju_config,
      charmstoreURL = (cfg && cfg.charmstoreURL) || '',
      localIndex = charmId.indexOf('local:'),
      path;
  charmstoreURL = viewsUtils.ensureTrailingSlash(charmstoreURL);

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
viewsUtils.isRedirectError = function(error) {
  return error === 'authentication failed: redirection required';
};

/**
  Check that a value is valid and not null.

  @method isValue
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is not undefined, null or NaN.
*/
viewsUtils.isValue = value => {
  return value !== undefined && value !== null;
};

/**
  Check that a value is an object.

  @method isObject
  @param {Any} value The value to check.
  @returns {Boolean} Whether the value is an object.
*/
viewsUtils.isObject = value => {
  return typeof(value) === 'object' && value !== null &&
    !Array.isArray(value);
};

/**
  Remove duplicate entries from an array.

  @method arrayDedupe
  @returns {Array} An array with no duplicates.
*/
viewsUtils.arrayDedupe = function(array) {
  // Sets can only contain unique values, so use that to do the dedupe and
  // then turn it back into an array.
  return [...new Set(array)];
};

/**
  Turn an array of arrays into a single array.

  @method arrayFlatten
  @returns {Array} A single depth array.
*/
viewsUtils.arrayFlatten = function(array) {
  return array.reduce((flattened, current) => {
    return flattened.concat(
      // If this is an array then flatten it before concat, otherwise concat
      // the current value.
      Array.isArray(current) ? viewsUtils.arrayFlatten(current) : current);
  }, []);
};

/**
  Format the constraints to: cpu-power=w cores=x mem=y root-disk=z

  @method formatConstraints
  @param constraints {Object} A collection of constraints.
  @returns {String} A formatted constraints string.
*/
viewsUtils.formatConstraints = constraints => {
  return Object.keys(constraints || {}).reduce((collected, key) => {
    const value = constraints[key];
    if (value) {
      collected.push(key + '=' + value);
    }
    return collected;
  }, []).join(' ');
};

if (module && module.exports) {
  module.exports = viewsUtils;
}
if (YUI) {
  YUI.add('juju-view-utils', function(Y) {
    Y.namespace('juju.views').utils = viewsUtils;
  }, '0.1.0', {
    requires: [
    ]
  });
}
