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
  Provides the UI for the mass service scale up in machine view.

  @module service-scale-up-view
 */
YUI.add('service-scale-up-view', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates;

  /**
   * The view associated with the machine token.
   *
   * @class ServicesScaleUpView
   */
  var ServiceScaleUpView = Y.Base.create('service-scale-up-view', Y.View, [], {

    template: Templates['service-scale-up-view'],

    itemTemplate: Templates['service-scale-up-item'],

    events: {
      '.enabled.action-block button': {
        click: '_onActionButtonClick'
      },
      '.actions .button.cancel': {
        click: '_onCancelButtonClick'
      },
      '.actions button.add-units': {
        click: '_onAddUnitsButtonClick'
      }
    },

    /**
      Parses the service database and generates a service list of the services
      to display in the service scale up dropdown.

      @method _updateServiceList
    */
    _updateServiceList: function() {
      var serviceList = this.get('services');
      var services = [];
      // Sometimes the services modellist isn't yet ready by the time this is
      // called.
      if (!serviceList) {
        return;
      }
      serviceList.each(function(service) {
        service = service.getAttrs();
        services.push({
          id: service.id,
          name: service.displayName.replace(/^\(/, '').replace(/\)$/, ''),
          icon: service.icon
        });
      });

      this._services = services;
      this._updateUI();
    },

    /**
      Updates the UI to match the currently deployed services.

      @method _updateUI
    */
    _updateUI: function() {
      var services = this._services;
      var serviceList = this.get('container').one('.service-list ul');
      var serviceElements = serviceList.all('li');
      var exists, newElement;

      services.forEach(function(service) {
        exists = serviceElements.some(function(element) {
          if (service.id === element.getData('service')) {
            element.setData('exists', true);
            return true;
          }
        });
        if (!exists) {
          newElement = serviceList.append(this.itemTemplate({
            id: service.id,
            name: service.name,
            icon: service.icon
          }));
          newElement.setData('exists', true);
        }
      }, this);

      serviceElements.each(function(element) {
        if (!element.getData('exists')) {
          element.remove();
        } else {
          element.setData('exists', undefined);
        }
      });
    },

    /**
      Handler for clicking the cancel or X buttons.

      @method onCancelButtonClick
      @param {Object} e The click event.
    */
    _onCancelButtonClick: function(e) {
      e.preventDefault();
      this._toggleServiceList(false);
    },

    /**
      Handler for open/close action button click

      @method onActionButtonClick
      @param {Object} e The click event.
    */
    _onActionButtonClick: function(e) {
      e.preventDefault();
      var opened = this.get('container').hasClass('opened');
      this._toggleServiceList(!opened);
    },

    /**
      Handler for clicking the add units button.

      @method _onAddUnitsButtonClick
      @param {Object} e The click event.
    */
    _onAddUnitsButtonClick: function(e) {
      e.preventDefault();
      var services = this.get('container').one('ul').all('li'),
          serviceName, unitCount, serviceInput;
      services.each(function(service) {
        serviceName = service.getData('service');
        serviceInput = service.one('input.service-units');
        unitCount = parseInt(
            serviceInput.get('value'), 10);
        if (unitCount && unitCount > 0) {
          this.fire('addUnit', {
            serviceName: serviceName,
            unitCount: unitCount
          });
        }
        serviceInput.set('value', '');
      }, this);
      this._toggleServiceList(false);
    },

    /**
      Toggles the opened class on the service list container

      @method _toggleServiceList
      @param {Bool} opened Whether the opened class should be added.
    */
    _toggleServiceList: function(opened) {
      // If we are opening the list then update the service list
      if (opened) {
        this._updateServiceList();
        this.fire('listOpened');
      } else {
        this.fire('listClosed');
      }
      this.get('container').toggleClass('opened', opened);
    },

    /**
      Enable the UI.

      @method enableScaleUp
    */
    enableScaleUp: function() {
      this.get('container').one('.action-block').addClass('enabled');
    },

    /**
      Disable the UI.

      @method disableScaleUp
    */
    disableScaleUp: function() {
      this.get('container').one('.action-block').removeClass('enabled');
    },

    /**
      Renders the template content into the container and sets the
      apropriate classes.

      @method render
      @return {Object} reference to the view instance.
    */
    render: function() {
      var content = this.template();
      var container = this.get('container');
      container.addClass('service-scale-up-view');
      container.setHTML(content);
      return this;
    },

    /**
      Empties out the container and removes the added classes.

      @method destructor
    */
    destructor: function() {
      var container = this.get('container');
      container.setHTML('');
      container.removeClass('service-scale-up-view');
    }
  }, {
    ATTRS: {
      services: {}
    }
  });

  views.ServiceScaleUpView = ServiceScaleUpView;

}, '0.1.0', {
  requires: [
    'event-tracker',
    'handlebars',
    'juju-templates',
    'juju-view-utils',
    'node',
    'view'
  ]
});
