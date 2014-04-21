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

YUI.add('service-inspector', function(Y) {
  var ns = Y.namespace('juju.views'),
      viewlets = Y.namespace('juju.viewlets'),
      models = Y.namespace('juju.models'),
      utils = ns.utils;

  var name = 'service-inspector',
      extensions = [ns.ServiceInspectorUtilsExtension];

  ns.ServiceInspector = Y.Base.create(name, ns.Inspector, extensions, {

    template: Y.juju.views.Templates['service-config-wrapper'],

    slots: {
      'header': '.header-slot',
      'left-hand-panel': '.left-breakout'
    },

    views: {
      overview: viewlets.Overview,
      charmDetails: viewlets.charmDetails,
      config: viewlets.Config,
      constraints: viewlets.Constraints,
      unitDetails: viewlets.UnitDetails,
      inspectorHeader: viewlets.InspectorHeader,
      relations: viewlets.Relations
    },

    events: {
      '.close': {'click': 'onCloseInspector'},
      '.tab': {'click': 'onActivateTab'},
      '.close-slot': {'click': 'hideSlot'},
      '.charm-url': {click: 'onShowCharmDetails'},
      '.rerender-config': {click: 'reloadInspector'},
      'input.expose-toggle': { click: 'toggleExpose' },
      // The following event handlers are provided in the
      // ServiceInspectorUtilsExtension
      '.initiate-destroy': {click: '_onInitiateDestroy'},
      '.cancel-destroy': {click: '_onCancelDestroy'},
      '.destroy-service-trigger span': {click: '_onDestroyClick'}
    },

    /**
      UI setup method for the inspector subclass.

      @method setupUI
    */
    setupUI: function() {
      if (this.get('model').get('subordinate')) {
        this.templateConfig = { subordinate: true };
      }
    },

    /**
      Render method for the inspector subclasses.

      @method renderUI
    */
    renderUI: function() {
      this.showViewlet('inspectorHeader');
      this.showViewlet('overview');
      this.on('viewletSlotClosing', function() {
        this.fire('inspectorTakeoverEnding');
      }, this);
    },

    /**
      Reloads the inspector in order to ensure that data is up-to-date. in the
      case of added/removed fields.

      @method reloadInspector
    */
    reloadInspector: function() {
      // Ensure that any flags which would lead to a reload notification are
      // unset.
      this.get('model').set('charmChanged', false);

      // Reload the inspector itself.
      this.after('destroy', function() {
        // window.flags.il
        // XXX This needs to be re-implemented for the inspector in the browser.
        this.get('environment').createServiceInspector(this.get('model'));
      });
      this.destroy();
    },

    /**
      When the user clicks the x to close the inspector this method is executed.

      @method onCloseInspector
      @param {Object} e The click event object.
    */
    onCloseInspector: function(e) {
      e.preventDefault();
      // The emptySectionA method will destroy this inspector.
      this.fire('changeState', {
        sectionA: {
          component: null,
          metadata: { id: null }}});
    },

    /**
     Loads the charm details view for the inspector.

     @method onShowCharmDetails
     @param {Event} ev the click event from the overview viewlet.

     */
    onShowCharmDetails: function(ev) {
      ev.halt();
      var db = this.get('db');
      var charmId = ev.currentTarget.getData('charmid');
      var charm = db.charms.getById(charmId);
      this.showViewlet('charmDetails', charm);
      this.fire('inspectorTakeoverStarting');
    },

    /**
     Makes the clicked tab active.

     @method onActivateTab
     @param {Event} ev the click event from the tab.

     */
    onActivateTab: function(ev) {
      ev.halt();
      var target = ev.currentTarget,
          viewName = target.getData('viewlet');
      this.switchTab(viewName);
    },

    /**
      Handles exposing the service.

      @method toggleExpose
      @param {Y.EventFacade} e An event object.
      @return {undefined} Nothing.
    */
    toggleExpose: function(e) {
      var service = this.get('model');
      if (service.get('exposed')) {
        this.unexposeService();
      } else {
        this.exposeService();
      }
    },

    /**
     * Unexpose the service stored in this view.
     * Pass this._unexposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method unexposeService
     * @return {undefined} Nothing.
     */
    unexposeService: function() {
      var service = this.get('model'),
          env = this.get('env');
      env.unexpose(service.get('id'),
          Y.bind(this._unexposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * unexpose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _unexposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _unexposeServiceCallback: function(ev) {
      var service = this.get('model'),
          db = this.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error un-exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        service.set('exposed', false);
        db.fire('update');
      }
    },

    /**
     * Expose the service stored in this view.
     * Pass this._exposeServiceCallback as callback to be called when
     * the response is returned by the backend.
     *
     * @method exposeService
     * @return {undefined} Nothing.
     */
    exposeService: function() {
      var service = this.get('model'),
          env = this.get('env');
      env.expose(service.get('id'),
          Y.bind(this._exposeServiceCallback, this));
    },

    /**
     * Callback called when the backend returns a response to a service
     * expose call. Update the service model instance or, if an error
     * occurred, add a failure notification.
     *
     * @method _exposeServiceCallback
     * @param {Object} ev An event object (with "err" and "service_name"
     *  attributes).
     * @return {undefined} Nothing.
     */
    _exposeServiceCallback: function(ev) {
      var service = this.get('model'),
          db = this.get('db');
      if (ev.err) {
        db.notifications.add(
            new models.Notification({
              title: 'Error exposing service',
              message: 'Service name: ' + ev.service_name,
              level: 'error',
              link: undefined, // XXX See note below about getModelURL.
              modelId: service
            })
        );
      } else {
        service.set('exposed', true);
        db.fire('update');
      }
    }
  });

}, '', {
  requires: [
    'inspector-base',
    'juju-templates',
    'juju-models',
    'service-inspector-utils-extension',
    'inspector-overview-view',
    'charm-details-view',
    'service-config-view',
    'service-constraints-view',
    'unit-details-view',
    'inspector-header-view',
    'service-relations-view'
  ]
});
