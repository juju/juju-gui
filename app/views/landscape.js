'use strict';

/**
 * Methods to aid landscape integration.
 *
 * @module views
 * @submodule views.landscape
 */

YUI.add('juju-landscape', function(Y) {
  var views = Y.namespace('juju.views');

  /**
   * Ensure a trailing slash on a string.
   * @method slash
   * @return {String} string with trailing slash.
   **/
  function slash(u) {
    if (u.lastIndexOf('/') !== u.length - 1) {
      u += '/';
    }
    return u;
  }

  /**
   * Collect annotation data about landscape integration
   * for easy consumption.
   *
   * For now this inspects the current database and
   * computes data.
   *
   * TODO: take set of [a/c] | [d] models and do
   * incremental updates.
   * @class Landscape
   **/
  function Landscape() {
    Landscape.superclass.constructor.apply(this, arguments);
  }

  views.Landscape = Y.extend(Landscape, Y.Base, {
    /**
     * This tells `Y.Base` that it should create ad-hoc attributes for config
     * properties passed to Model's constructor. This makes it possible to
     * instantiate a model and set a bunch of attributes without having to
     * subclass `Y.Model` and declare all those attributes first.
     *
     * @property _allowAdHocAttrs
     * @type {Boolean}
     * @default true
     * @protected
     * @since 3.5.0
     **/
    _allowAdHocAttrs: true,

    /**
     * Collect annotation information from units to services and from
     * services to environemnt.
     *
     * @method update
     * @chainable
     ***/
    update: function() {
      // Roll up information from the unit level
      // to the service level.
      var db = this.get('db');
      var env = db.environment;

      // Rollup each unit annotation name applying it
      // service and environment.
      //
      // Iterate each landscape annotation.
      Y.each([
              'landscape-security-upgrades',
              'landscape-needs-reboot'],
      function(annotationName) {
        // Iterate each service, we do this so we can rollup
        // when no unit in the services set has the annotation.
        // This is needed to be able to detect and clear annotations
        // at the service/environment level when the unit level flags
        // are cleared.
        // The inner loop uses Y.some allowing it to stop on the
        // first true value.
        var serviceFlagged = false;
        Y.each(db.services, function(service) {
          /*jslint bitwise: true*/
          // The above lint is needed to allow a |= expression
          // to pass the linter.
          serviceFlagged |= service[annotationName] = Y.some(
              db.units.get_units_for_service(service),
              function(unit) {
                var annotations = unit.annotations;
                return Boolean(
                    annotations && annotations[annotationName]);
              });
        });
        env[annotationName] = Boolean(serviceFlagged);
      });
      return this;
    },

    /**
     * Get the landscape url for a given service with respect to
     * the models in the db we've been passed. This depends on
     * the 'db' attribute of this object being set.
     *
     * @method getLandscapeURL
     * @param {Model} model to get URL for.
     * @param {String} intent (optional) can be 'security' or 'reboot'.
     * @return {String} URL to access model entity in landscape.
     **/
    getLandscapeURL: function(model, intent) {
      var env = this.get('db').environment.get('annotations');
      var url = env['landscape-url'];

      if (!url) {
        // If this environment annotation doesn't exist
        // we cannot generate URLs.
        return undefined;
      }

      url += env['landscape-computers'];
      if (model.name === 'service') {
        url += slash(model.get('annotations')['landscape-computers']);
      } else if (model.name === 'serviceUnit') {
        url += slash(model.annotations['landscape-computer']);
      }

      if (!intent) {
        return slash(url);
      } else if (intent === 'reboot') {
        return url + env['landscape-reboot-alert-url'];
      } else if (intent === 'security') {
        return url + env['landscape-security-alert-url'];
      }
    },

    /**
     * Given a model and an intent return an object
     * with the properties of a badge. If the object
     * shouldn't have a badge undefined is returned.
     **/
    getLandscapeBadge: function(model, intent, hint) {
      var badge = {};
      var props = model;
      var sprite = 'landscape_';

      if (model.name === 'serviceUnit') {
        props = model.annotations;
      }
      if (!props) {
        return undefined;
      }

      badge.link = this.getLandscapeURL(model, intent);
      if (intent === 'reboot') {
        if (!props['landscape-needs-reboot']) {
          return undefined;
        }
        sprite += 'restart';

      } else if (intent === 'security') {
         if (!props['landscape-security-upgrades']) {
          return undefined;
        }
        sprite += intent;
      }

      if (hint) {
        sprite += '_' + hint;
      }

      badge.sprite = sprite;
      return badge;
    }
  });

}, '0.1.0', {
  requires: [
    'juju-models',
    'base'
  ]
});
