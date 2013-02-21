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

      /**
       * Internal utility method to manage annotation rollup.
       * Complexity comes from preserving the property that
       * we want to be able to track if any value was positive
       * for a given set and its interaction with Y.some
       *
       * @method rollupAnnotation
       * @param {Model} service (optional).
       * @param {Model} env (optional).
       * @param {String} name of annotation.
       * @param {Boolean} value of annotation.
       * @param {Boolean} force used to force the recording of false values.
       * @return {Boolean} value.
       **/
      function rollupAnnotation(service, env, name, value, force) {
        var serviceAnno, envAnno;
        if (value === true || force) {
          if (service) {
            serviceAnno = service.get('annotations');
            if (!serviceAnno) {
              service.set('annotations', {});
            }
            service.get('annotations')[name] = value;
          }

          if (env) {
            // If we mark a service as needing a security upgrade also
            // mark the environment
            env.get('annotations')[name] = value;
          }
          return true;
        }
        return false;
      }

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
        var serviceFlagged = Y.some(db.services, function(service) {
          // Iterate the unit.ts services.
          var result = Y.some(
              db.units.get_units_for_service(service),
              function(unit) {
                var annotations = unit.annotations;
                if (!annotations) {
                  return false;
                }
                return rollupAnnotation(service, env, annotationName,
                                        annotations[annotationName]);
              }, this);

          // If 'some' returned false we need to force
          // recording a false value at the service level.
          if (result === false) {
            rollupAnnotation(service, false, annotationName,
                             false, true);
          }
          return result;
        }, this);
        if (!serviceFlagged) {
          // No service has this flag marked as true so we
          // can remove the environment annotation.
          rollupAnnotation(null, env, annotationName, false, true);
        }
      }, this);
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
      var env = this.get('db').environment;
      var annotations = env.get('annotations');
      var url = slash(annotations['landscape-url']);

      if (model.name === 'environment') {
        if (intent === 'reboot') {
          return url + '+alert:computer-reboot/info#power';
        } else if (intent === 'security') {
          return url + '+alert:security-upgrades/packages/list?filter=security';
        }
        return url;
      }
      // Indicate we want a computer in this environment.
      url += 'computers/criteria/environment:' + env.get('uuid');

      if (model.name === 'service') {
        url += slash('+service:' + model.get('id'));
      } else if (model.name === 'serviceUnit') {
        url += slash('+unit:' + model.urlName);
      } else {
        url = slash(url);
      }
      return url;
    }
  });

}, '0.1.0', {
  requires: [
    'juju-models',
    'base'
  ]
});
