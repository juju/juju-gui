'use strict';

/**
 * Provide the EndpointsController class.
 *
 * @module store
 * @submodule store.endpoints
 */

YUI.add('juju-endpoints-controller', function(Y) {

  var juju = Y.namespace('juju');

  /**
   * This controller manages the endpoints for services, handling the events
   * for the services ModelList and maintaining the endpoints map.
   *
   * EndpointsController({env: Environment, db: Database})
   *
   * @class EndpointsController
   */
  var EndpointsController = Y.Base.create('EndpointsController',
      Y.Base, [], {

        /**
         * Tell `Y.Base` that it should create ad hoc attributes for
         * config properties.
         *
         * @property _allowAdHocAttrs
         * @type {Boolean}
         * @default true
         * @protected
         * @since 3.5.0
         */

        _allowAdHocAttrs: true,

        /**
         * @method initializer
         * @param {Object} cfg Application configuration data.
         */
        initializer: function(cfg) {
          this._subscriptions = [];
          this.endpointsMap = {};
        },

        /**
         * Bind events for endpoint processing.
         *
         * @method bind
         * @return {undefined} Nothing.
         */
        bind: function() {
          var db = this.get('db');

          // Event handlers for endpoint management.
          this._subscriptions.push(
              db.services.after('add', this.serviceAddHandler, this));
          this._subscriptions.push(
              db.services.after('remove', this.serviceRemoveHandler, this));
          this._subscriptions.push(
              db.services.after('*:pendingChange', this.serviceChangeHandler,
              this));
          this._subscriptions.push(
              db.services.after('*:charmChange', this.serviceChangeHandler,
              this));
          this._subscriptions.push(
              db.services.after('reset', this.reset, this));

        },

        /**
         * Unbind events for endpoint processing.
         *
         * @method unbind
         * @return {undefined} Nothing.
         */
        unbind: function() {
          Y.each(this._subscriptions, function(sub) {
            sub.detach();
          });
          this._subscriptions = [];
        },

        /**
         * Destroy this controller
         *
         * @method destructor
         * @return {undefined} Nothing.
         */
        destructor: function() {
          this.unbind();
        },

        /**
         * Reset the endpoints map.
         *
         * @method reset
         * @return {undefined} Nothing.
         */
        reset: function() {
          this.endpointsMap = {};
        },

        /**
         * Setup once('load') handler for a charm.
         *
         * @method setupCharmOnceLoad
         * @param {Object} charm The charm to watch.
         * @param {String} svcName The name of the correpsonding service.
         * @return {undefined} Nothing.
         */
        setupCharmOnceLoad: function(charm, svcName) {
          charm.once('load', Y.bind(function(svcName, evt) {
            this.addServiceToEndpointsMap(svcName, evt.currentTarget);
          }, this, svcName));
        },

        /**
          Generic handler for a service event.  If it is not pending,
          make sure we have a charm.  If the charm has loaded, set or update
          the service's endpoints; otherwise, make that happen once the load
          has completed.

          @method handleServiceEvent
          @param {object} service A service model.
          @return {undefined} Nothing.
         */
        handleServiceEvent: function(service) {
          // If the service is not a ghost (that is, 'pending' is false),
          // process it.

          if (!service.get('pending')) {

            var svcName = service.get('id'),
                db = this.get('db'),
                charm_id = service.get('charm'),
                charm = db.charms.getById(charm_id),
                env = this.get('env');

            // Call get_service to reload the service and get the full config.
            env.get_service(service.get('id'), this.get('loadService'));

            if (!charm) {
              charm = db.charms.add({id: charm_id})
                .load(env,
                  // If views are bound to the charm model, firing "update" is
                  // unnecessary, and potentially even mildly harmful.
                  function(err, result) { db.fire('update'); });
            }
            if (charm.loaded) {
              this.addServiceToEndpointsMap(svcName, charm);
            } else {
              this.setupCharmOnceLoad(charm, svcName);
            }
          }
        },

        /**
         * Handle event for a service being added to the services modellist.
         *
         * @method serviceAddHandler
         * @param {Object} evt The event, containing a model object.
         * @return {undefined} Nothing.
         */
        serviceAddHandler: function(evt) {
          this.handleServiceEvent(evt.model);
        },

        /**
         * Handle event for a service transitioning from a ghost to a corporeal
         * object as indicated by the 'pending' attribute becoming false.  Also
         * handles changes in the service's charm.
         *
         * @method serviceChangeHandler
         * @param {Object} evt The event, containing the service as the target.
         * @return {undefined} Nothing.
         */
        serviceChangeHandler: function(evt) {
          this.handleServiceEvent(evt.target);
        },

        /**
         * Handle event for a service removal.
         *
         * @method serviceRemoveHandler
         * @param {Object} evt The event, containing the service as the target.
         * @return {undefined} Nothing.
         */
        serviceRemoveHandler: function(evt) {
          var svcName = evt.model.get('id');
          delete this.endpointsMap[svcName];
        },

        /**
         * Flatten the relation metadata.
         *
         * @method flatten
         * @param {Object} meta The relation metadata.
         * @return {List} A list of objects, where each entry is a hash with a
         *   'name' key and the key value pairs from the metadata.
         */
        flatten: function(meta) {
          var result = [];
          var rel;
          if (Y.Lang.isValue(meta)) {

            Y.each(meta, function(vo, ko) {
              rel = {};
              rel.name = ko;
              Y.each(vo, function(vi, ki) {
                rel[ki] = vi;
              });
              result.push(rel);
            });
          }
          return result;
        },

        /**
         * Add the service and charm to the endpoints map.
         *
         * @method addServiceToEndpointsMap
         * @param {String} svcName The name of the service.
         * @param {Object} charm The charm for the service.
         * @return {undefined} Nothing.
         */
        addServiceToEndpointsMap: function(svcName, charm) {
          this.endpointsMap[svcName] = {};
          this.endpointsMap[svcName].provides =
              this.flatten(charm.get('provides'));
          this.endpointsMap[svcName].requires =
              this.flatten(charm.get('requires'));
        }
      });

  juju.EndpointsController = EndpointsController;

}, '0.1.0', {
  requires: ['juju-models']
});
