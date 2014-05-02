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
   * @class ServiceUnitToken
   */
  var ServiceScaleUpView = Y.Base.create('service-scale-up-view', Y.View, [], {

    template: Templates['service-scale-up-view'],

    itemTemplate: Templates['service-scale-up-item'],

    events: {
      '.action-block button': {
        click: 'onActionButtonClick'
      },
      '.actions button.cancel': {
        click: 'onCancelButtonClick'
      }
    },

    initializer: function() {
      this._bindModelEvents();
    },

    _bindModelEvents: function() {
      this.get('db').services.on(['add', 'remove'], this._updateServiceList);
    },

    _updateServiceList: function() {
      var db = this.get('db');
      var services = [];
      if (!db.services) {
        return;
      }
      db.services.each(function(service) {
        service = service.getAttrs();
        if (service.pending) {
          return;
        }
        services.push({
          id: service.id,
          name: service.displayName,
          icon: service.icon
        });
      });
      this._services = services;
      this._updateUI();
    },

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

    onCancelButtonClick: function(e) {
      e.preventDefault();
      this._toggleServiceList(false);
    },

    onActionButtonClick: function(e) {
      e.preventDefault();
      var opened = e.currentTarget.hasClass('opened');
      this._toggleServiceList(!opened);
    },

    _toggleServiceList: function(opened) {
      this.get('container').toggleClass('opened', opened);
    },

    render: function() {
      console.log('render');
      var content = this.template();
      var container = this.get('container');
      container.addClass('service-scale-up-view');
      container.setHTML(content);
      this._updateServiceList();
      return this;
    },

    destructor: function() {
      var container = this.get('container');
      container.setHTML('');
      container.removeClass('service-scale-up-view');
    }
  }, {
    ATTRS: {
      db: {}
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
