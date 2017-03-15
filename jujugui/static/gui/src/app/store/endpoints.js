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

/**
 * Provide the EndpointsController class.
 *
 * @module store
 * @submodule store.endpoints
 */

YUI.add('juju-endpoints-controller', function(Y) {

  var juju = Y.namespace('juju');
  var utils = Y.namespace('juju.views.utils');

  /**
   * This controller manages the endpoints for services, handling the events
   * for the services ModelList and maintaining the endpoints map.
   *
   * EndpointsController({db: Database})
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
          this._subscriptions.forEach(sub => {
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
          var mController = this.get('modelController'),
              servicePromise = mController.getServiceWithCharm(
                  service.get('id')),
              self = this;

          servicePromise.then(function(data) {
            data.service.set('subordinate', data.charm.get('is_subordinate'));
            self.addServiceToEndpointsMap(
                data.service.get('id'), data.charm);
          }, function(err) {
            console.warn('Unable to fetch service information', err);
          });
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
          if (utils.isValue(meta)) {

            Object.keys(meta).forEach(ko => {
              const vo = meta[ko];
              rel = {};
              rel.name = ko;
              Object.keys(vo).forEach(ki => {
                rel[ki] = vo[ki];
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
          // this was added to be able to test that the endpoint
          // was successful with the new promises
          /**
            Fired after an endpoint was added to the endpointsMap property

            @event endpointMapAdded
          */
          this.fire('endpointMapAdded');
        }
      }, {
        /**
          Reference to the client db.

          @attribute db
          @type {Y.Base}
          @default undefined
        */
        db: {},

        /**
          Reference to the modelController instance

          @attribute modelController
          @type {Y.juju.ModelController}
          @default undefined
        */
        modelController: {}
      });

  juju.EndpointsController = EndpointsController;

}, '0.1.0', {
  requires: ['juju-models', 'juju-view-utils']
});
