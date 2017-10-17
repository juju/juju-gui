/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const viewUtils = require('../views/utils');

/**
 * This controller manages the endpoints for services, handling the events
 * for the services ModelList and maintaining the endpoints map.
 *
 * EndpointsController({db: Database})
 *
 * @class EndpointsController
 */
class EndpointsController {
  constructor(config={}) {
    this.db = config.db;
    this.modelController = config.modelController;
    this._subscriptions = [];
    this.endpointsMap = {};
    this._allowAdHocAttrs = true;
  }

  /**
     * Bind events for endpoint processing.
     *
     * @method bind
     * @return {undefined} Nothing.
     */
  bind() {
    var db = this.db;

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
  }

  /**
     * Unbind events for endpoint processing.
     *
     * @method unbind
     * @return {undefined} Nothing.
     */
  unbind() {
    this._subscriptions.forEach(sub => {
      sub.detach();
    });
    this._subscriptions = [];
  }

  /**
     * Destroy this controller
     *
     * @method destructor
     * @return {undefined} Nothing.
     */
  destructor() {
    this.unbind();
  }

  /**
     * Reset the endpoints map.
     *
     * @method reset
     * @return {undefined} Nothing.
     */
  reset() {
    this.endpointsMap = {};
  }

  /**
      Generic handler for a service event.  If it is not pending,
      make sure we have a charm.  If the charm has loaded, set or update
      the service's endpoints; otherwise, make that happen once the load
      has completed.

      @method handleServiceEvent
      @param {object} service A service model.
      @return {undefined} Nothing.
     */
  handleServiceEvent(service) {
    // If the service is not a ghost (that is, 'pending' is false),
    // process it.
    var mController = this.modelController,
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
  }

  /**
     * Handle event for a service being added to the services modellist.
     *
     * @method serviceAddHandler
     * @param {Object} evt The event, containing a model object.
     * @return {undefined} Nothing.
     */
  serviceAddHandler(evt) {
    this.handleServiceEvent(evt.model);
  }

  /**
     * Handle event for a service transitioning from a ghost to a corporeal
     * object as indicated by the 'pending' attribute becoming false.  Also
     * handles changes in the service's charm.
     *
     * @method serviceChangeHandler
     * @param {Object} evt The event, containing the service as the target.
     * @return {undefined} Nothing.
     */
  serviceChangeHandler(evt) {
    this.handleServiceEvent(evt.target);
  }

  /**
     * Handle event for a service removal.
     *
     * @method serviceRemoveHandler
     * @param {Object} evt The event, containing the service as the target.
     * @return {undefined} Nothing.
     */
  serviceRemoveHandler(evt) {
    var svcName = evt.model.get('id');
    delete this.endpointsMap[svcName];
  }

  /**
     * Flatten the relation metadata.
     *
     * @method flatten
     * @param {Object} meta The relation metadata.
     * @return {List} A list of objects, where each entry is a hash with a
     *   'name' key and the key value pairs from the metadata.
     */
  flatten(meta) {
    var result = [];
    var rel;
    if (viewUtils.isValue(meta)) {

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
  }

  /**
     * Add the service and charm to the endpoints map.
     *
     * @method addServiceToEndpointsMap
     * @param {String} svcName The name of the service.
     * @param {Object} charm The charm for the service.
     * @return {undefined} Nothing.
     */
  addServiceToEndpointsMap(svcName, charm) {
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
    document.dispatchEvent(new Event('endpointMapAdded'));
  }
};

module.exports = EndpointsController;
