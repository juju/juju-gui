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

YUI.add('service-inspector-utils-extension', function(Y) {
  var ns = Y.namespace('juju.views');
  var utils = Y.namespace('juju.views.utils');

  /**
    Extension for the ghost and service inspectors for the methods that they
    both share.
    @class ServiceInspectorUtilsExtension
  */
  function ServiceInspectorUtilsExtension() {}

  ServiceInspectorUtilsExtension.prototype = {
    /**
      React to the user clicking on or otherwise activating the "do it now"
      button on the "destroy this service" prompt.

      @method _onInitiateDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onInitiateDestroy: function(evt) {
      evt.halt();
      this.initiateServiceDestroy();
      this._onCancelDestroy(evt);
      this.get('topo').fire('clearState');
      this.fire('changeState', {
        sectionA: {
          component: null,
          metadata: { id: null }}});
    },

    /**
      React to the user clicking on or otherwise activating the "destroy this
      service" icon.

      @method _onDestroyClick
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onDestroyClick: function(evt) {
      evt.halt();
      this.showDestroyPrompt(evt.container);
    },

    /**
      Display the change version viewlet, fetching version information if
      needed.

      @method onChangeVersionClick
      @param {Object} evt The event data
    */
    _onChangeVersionClick: function(evt) {
      evt.halt();
      var model = this.get('model'),
          // We use the charm attribute here instead of the id because the id
          // is a randomly generated number when it's a ghost service.
          charmId = model.get('charm');

      this.get('charmstore').getAvailableVersions(
          charmId,
          function(idList) {
            model.set('available_versions', idList);
            this.showViewlet('changeVersion', model);
          }.bind(this),
          function() {
            this.get('db').notifications.add({
              title: 'Error fetching charm versions',
              message: 'Unable fetch charm versions for: ' + charmId,
              level: 'error'
            });
            this.showViewlet('changeVersion', model);
          }.bind(this));
    },

    /**
      Handles showing the overview viewlet when the user closes the change
      version pane.

      @method _closeChangeVersion
    */
    _closeChangeVersion: function() {
      this.showViewlet('overview');
    },

    /**
      React to the user clicking on or otherwise activating the cancel button
      on the "destroy this service" prompt.

      @method _onCancelDestroy
      @param {Object} evt The event data.
      @return {undefined} Nothing.
    */
    _onCancelDestroy: function(evt) {
      evt.halt();
      this.hideDestroyPrompt(evt.container);
    },

    /**
      Display the "do you really want to destroy this service?" prompt.

      @method showDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    showDestroyPrompt: function(container) {
      var prompt = container.one('.destroy-service-prompt');
      var model = this.get('model');
      var name = '';
      var pending = false;
      if (model) {
        pending = model.get('pending');
        prompt.one('.pending').toggleClass('hidden', !pending);
      }
      prompt.removeClass('closed');
    },

    /**
      Hide the "do you really want to destroy this service?" prompt.

      @method hideDestroyPrompt
      @param {Y.Node} container The container of the prompt.
    */
    hideDestroyPrompt: function(container) {
      var prompt = container.one('.destroy-service-prompt');
      if (prompt) {
        prompt.addClass('closed');
      }
    },

    /**
      Start the process of destroying the service represented by this
      inspector.

      @method initiateServiceDestroy
      @return {undefined} Nothing.
    */
    initiateServiceDestroy: function() {
      utils.destroyService(this.get('db'), this.get('env'), this.get('model'),
          this.serviceDestroyCallback.bind(this));
    },

    /**
      Callback to change the inspector state after the service has been
      removed.

      @method serviceDestroyCallback
    */
    serviceDestroyCallback: function() {
      // The emptySectionA method will destroy this inspector.
      this.fire('changeState', {
        sectionA: {
          component: null,
          metadata: { id: null }}});
    }
  };

  ns.ServiceInspectorUtilsExtension = ServiceInspectorUtilsExtension;

}, '', {
  requires: ['juju-view-utils']
});
