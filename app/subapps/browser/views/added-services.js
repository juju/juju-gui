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
      // Load services into the internal token list.
      this.get('db').services.each(function(service) {
        key = service.get('id');
        serviceTokens[key] = new ns.AddedServiceToken({
          service: service.getAttrs()
        });
        serviceTokens[key].addTarget(this);
      }, this);
      this.set('serviceTokens', serviceTokens);
      // Widgets are set on render.
      this.searchWidget = null;
      this.environmentCounts = null;
      this._bindEvents();
    },

    /**
      Bind the events to the models.

      @method _bindEvents
    */
    _bindEvents: function() {
      var services = this.get('db').services;

      // Service change handlers
      this.addEvent(services.after('add', this._onServiceAdd, this));
      this.addEvent(services.after('remove', this._onServiceRemove, this));
      this.addEvent(services.after('*:change', this._onServiceChange, this));

      // Button event handlers
      this.addEvent(this.on('*:fade', this._onFade, this));
      this.addEvent(this.on('*:show', this._onShow, this));
      this.addEvent(this.on('*:highlight', this._onHighlightToggle, this));
      this.addEvent(this.on('*:highlight', this._onHighlight, this));
      this.addEvent(this.on('*:unhighlight', this._onUnhighlight, this));
    },

    /**
      Handles services added to the db model list.

      @method _onServiceAdd
      @param {Object} e Custom model change event facade.
    */
    _onServiceAdd: function(e) {
      var service = e.model,
          list = this.get('container').one('.services-list'),
          serviceTokens = this.get('serviceTokens'),
          token;
      token = new ns.AddedServiceToken({service: service.getAttrs()});
      serviceTokens[service.get('id')] = token;
      token.render();
      token.addTarget(this);
      // If the list DOM element is present, we've already rendered.
      if (list) {
        list.append(token.get('container'));
        // Re-render to update the services count on the button.
        this._renderAddedServicesButton(this.get('db').services.size(), false);
        // Hide the "no services" message if needed.
        if (Object.keys(serviceTokens).length > 0) {
          this.get('container').one('.no-services').addClass('hide');
        }
      }
    },

    /**
      Handles services removed to the db model list.

      @method _onServiceRemove
      @param {Object} e Custom model change event facade.
    */
    _onServiceRemove: function(e) {
      var service = e.model,
          list = this.get('container').one('.services-list'),
          id = service.get('id'),
          serviceTokens = this.get('serviceTokens'),
          token = serviceTokens[id];
      token.destroy({remove: true});
      delete serviceTokens[id];
      // If the list DOM element is present, we've already rendered.
      if (list) {
        // Re-render to update the services count on the button.
        this._renderAddedServicesButton(this.get('db').services.size(), false);
        // Show the "no services" message if needed.
        if (Object.keys(serviceTokens).length === 0) {
          this.get('container').one('.no-services').removeClass('hide');
        }
      }
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
        token.set('service', target.getAttrs());
        token.render();
      }
    },

    /**
      Handles toggling the highlight state across the service tokens.

      @method _onHighlightToggle
      @param {Object} e Custom model change event facade.
    */
    _onHighlightToggle: function(e) {
      var id = e.id,
          tokens = this.get('serviceTokens');
      Object.keys(tokens).forEach(function(key) {
        if (key !== id) {
          tokens[key].unhighlight();
        }
      });
    },

    /**
      Fire a change event on all machine models associated with a service.

      @method _fireMachineChanges
      @param {Object} service The service that the machines are associated with
          via units.
    */
    _fireMachineChanges: function(service) {
      var db = this.get('db'),
          services;
      if (service) {
        services = [service];
      } else {
        services = db.services.toArray();
      }
      // We also need to fire change events for the related machines in order
      // to trigger re-rendering in machine view
      services.forEach(function(service) {
        var changedMachines = [];
        service.get('units').each(function(unit) {
          var machine = unit.machine;
          if (machine && changedMachines.indexOf(machine) < 0) {
            changedMachines.push(machine);
          }
        });
        changedMachines.forEach(function(machineId) {
          db.machines.fire('change', {
            changed: true,
            instance: db.machines.getById(machineId)
          });
        });
      });
    },

    /**
      Handle highlight events for services/units.

      @method _onHighlight
      @param {Object} e The event facade.
    */
    _onHighlight: function(e) {
      var id = e.id,
          db = this.get('db'),
          service = db.services.getById(id);
      service.set('highlight', true);
      db.updateUnitFlags(service, 'highlight');
      // Need to toggle fade off.
      this._onShow({id: id});
      // Unrelated services need to be faded.
      var unrelated = db.findUnrelatedServices(service);
      unrelated.each(function(model) {
        model.set('hide', true);
      });
      db.setMVVisibility(id, true);
    },

    /**
      Handle unhighlight events for services/units.

      @method _onUnhighlight
      @param {Object} e The event facade.
    */
    _onUnhighlight: function(e) {
      var db = this.get('db'),
          id = e.id,
          service = db.services.getById(id);
      service.set('highlight', false);
      db.updateUnitFlags(service, 'highlight');
      // Unrelated services need to be unfaded.
      var unrelated = db.findUnrelatedServices(service);
      unrelated.each(function(model) {
        model.set('hide', false);
      });
      db.setMVVisibility(id, false);
    },

    /**
      Handle fade events for services/units.

      @method _onFade
      @param {Object} e The event facade.
    */
    _onFade: function(e) {
      var id = e.id,
          db = this.get('db'),
          service = db.services.getById(id);
      service.set('fade', true);
      db.updateUnitFlags(service, 'fade');
      // Need to toggle highlight off but only if it's not already hidden.
      if (!service.get('hide')) {
        this._onUnhighlight({id: id});
        this._fireMachineChanges(service);
      }
    },

    /**
      Handle show events for services/units.

      @method _onShow
      @param {Object} e The event facade.
    */
    _onShow: function(e) {
      var db = this.get('db'),
          service = db.services.getById(e.id);
      service.set('fade', false);
      db.updateUnitFlags(service, 'fade');
      this._fireMachineChanges(service);
    },

    /**
      Renders (and instantiates, if needed) the widget that displays the unit,
      service, and machine counts.

      @method _renderEnvironmentCounts
    */
    _renderEnvironmentCounts: function() {
      if (!this.environmentCounts) {
        this.environmentCounts = new ns.EnvironmentCounts({
          container: this.get('container').one('.environment-counts'),
          db: this.get('db')
        });
      }
      this.environmentCounts.render();
    },

    /**
      Renders the added services list.

      This method should always be idempotent.

      @method render
    */
    render: function() {
      var serviceTokens = this.get('serviceTokens'),
          container = this.get('container'),
          servicesCount = this.get('db').services.size(),
          unitsCount = this.get('db').units.size(),
          machinesCount = this.get('db').machines.size(),
          list;
      // Render the template.
      var noServices = container.one('.no-services');
      // This template needs to be updated if it already exists because we use
      // it as a container for sub views.
      if (noServices === null) {
        container.setHTML(this.template({
          servicesCount: servicesCount
        }));
      } else if (servicesCount) {
        noServices.addClass('hide');
      } else {
        noServices.removeClass('hide');
      }
      // Provided by 'search-widget-mgmt-extension'.
      if (!this.searchWidget) {
        this._renderSearchWidget();
      }
      // Provided by 'added-services-button.js'.
      this._renderAddedServicesButton(servicesCount, false);
      // Render the environment counts widget.
      this._renderEnvironmentCounts();
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
      // Destroy all the tokens.
      var serviceTokens = this.get('serviceTokens');
      Object.keys(serviceTokens).forEach(function(key) {
        serviceTokens[key].destroy();
        delete serviceTokens[key];
      });
      // Destroy the various subviews
      if (this.environmentCounts) {
        this.environmentCounts.destroy();
      }
      if (this.searchWidget) {
        this.searchWidget.destroy();
      }
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
    'juju-environment-counts',
    'search-widget-mgmt-extension',
    'view'
  ]
});
