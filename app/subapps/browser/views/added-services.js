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

/*
  Sidebar added services view.

  @module juju.views
*/
YUI.add('juju-added-services', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      Templates = views.Templates;

  ns.AddedServices = Y.Base.create('added-services', Y.View, [
    Y.Event.EventTracker,
    views.AddedServicesButtonExtension,
    views.SearchWidgetMgmtExtension
  ], {

    template: Templates['added-services'],

    /**
      Sets the default properties.

      @method initializer
    */
    initializer: function() {
      var serviceTokens = {},
          key;
      // load services into internal token list
      this.get('db').services.each(function(service) {
        key = service.get('id');
        serviceTokens[key] = new ns.AddedServiceToken({service: service});
      }, this);
      this.set('serviceTokens', serviceTokens);
      // search widget set on render
      this.searchWidget = null;
      this._bindEvents();
    },

    /**
     * Bind the events to the models.
     *
     * @method _bindEvents
     */
    _bindEvents: function() {
      var services = this.get('db').services;

      // Service change handlers
      this.addEvent(services.after('add', this._onServiceAdd, this));
      this.addEvent(services.after('remove', this._onServiceRemove, this));
      this.addEvent(services.after('*:change', this._onServiceChange, this));
    },

    /**
      Handles services added to the db model list.

      @method _onServiceAdd
      @param {Object} e Custom model change event facade.
    */
    _onServiceAdd: function(e) {
      var service = e.model,
          list = this.get('container').one('.services-list'),
          token;
      token = new ns.AddedServiceToken({service: service});
      this.get('serviceTokens')[service.get('id')] = token;
      token.render();
      token.addTarget(this);
      list.append(token.get('container'));
      // Re-render to update the services count on the button.
      this._renderAddedServicesButton(this.get('db').services.size(), false);
    },

    /**
      Handles services removed to the db model list.

      @method _onServiceRemove
      @param {Object} e Custom model change event facade.
    */
    _onServiceRemove: function(e) {
      var service = e.model,
          id = service.get('id'),
          serviceTokens = this.get('serviceTokens'),
          token = serviceTokens[id];
      token.destroy({remove: true});
      delete serviceTokens[id];
      // Re-render to update the services count on the button.
      this._renderAddedServicesButton(this.get('db').services.size(), false);
    },

    /**
      Handles changes to services in the db model list.

      @method _onServiceChange
      @param {Object} e Custom model change event facade.
    */
    _onServiceChange: function(e) {
      var changed = e.changed,
          serviceTokens = this.get('serviceTokens'),
          target = e.target,
          token;
      if (changed) {
        // ID changes require an update in our ID-keyed list.
        if (changed.id && changed.id.newVal !== changed.id.prevVal) {
          var prevId = changed.id.prevVal,
              newId = changed.id.newVal;
          token = serviceTokens[prevId];
          serviceTokens[newId] = token;
          delete serviceTokens[prevId];
        } else {
          token = serviceTokens[target.get('id')];
        }
        // Update any changed fields on the token.
        token.set('service', target);
        token.render();
      }
    },

    /**
      Renders the added services list.

      This method should always be idempotent.

      @method render
    */
    render: function() {
      var serviceTokens = this.get('serviceTokens'),
          container = this.get('container'),
          list;
      // Render the template.
      container.setHTML(this.template());
      // Provided by 'search-widget-mgmt-extension'.
      this._renderSearchWidget();
      // Provided by 'added-services-button.js'.
      this._renderAddedServicesButton(this.get('db').services.size(), false);
      // Render each token in the list
      list = container.one('.services-list');
      Object.keys(serviceTokens).forEach(function(key) {
        var token = serviceTokens[key];
        token.render();
        list.append(token.get('container'));
      });
    },

    /**
      Destroys the rendered tokens.

      @method destructor
    */
    destructor: function() {
      var serviceTokens = this.get('serviceTokens');
      Object.keys(serviceTokens).forEach(function(key) {
        serviceTokens[key].destroy();
        delete serviceTokens[key];
      });
      // Don't want to destroy the container, since it's shared with other
      // sidebar components, e.g., inspector.
      this.get('container').setHTML('');
    }
  },
  {
    ATTRS: {
      /**
        @attribute serviceTokens
        @default undefined
        @type {Object}
      */
      serviceTokens: {}
    }
  });

}, '', {
  requires: [
    'added-services-button',
    'event-tracker',
    'juju-added-service-token',
    'search-widget-mgmt-extension',
    'view'
  ]
});
