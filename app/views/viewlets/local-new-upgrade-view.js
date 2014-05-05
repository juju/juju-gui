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


YUI.add('local-new-upgrade-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      templates = Y.namespace('juju.views').Templates;

  var name = 'local-new-upgrade-view';

  ns.LocalNewUpgradeView = Y.Base.create(name, Y.View, [ns.ViewletBaseView], {

    events: {
      'button.confirm': { click: '_upgradeSelectedServices' },
      'button.cancel': { click: 'closeInspector' }
    },

    template: templates['local-new-upgrade'],

    /**
      Renders the template into the container.

      @method render
    */
    render: function() {
      this.get('container').setHTML(this.template({
        services: this.get('services')
      }));
    },

    /**
      Calls the viewlet managers destroy method to close the inspector.

      @method closeInspector
    */
    closeInspector: function() {
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser'
          }
        });
      } else {
        this.viewletManager.destroy();
      }
    },

    /**
      Calls the helper methods to upgrade the selected services.

      @method _upgradeSelectedServices
      @param {Object} e the event object from the click
    */
    _upgradeSelectedServices: function(e) {
      var db = this.get('db');
      var services = this._getSelectedServices(db);
      if (services.length > 0) {
        Y.juju.localCharmHelpers.upgradeServiceUsingLocalCharm(
            services, this.get('file'), this.get('env'), db);
      }
      this.closeInspector();
    },

    /**
      Gets the selected services form the inspector dom.

      @method _getSelectedServices
      @return {Array} An array of service names to upgrade
    */
    _getSelectedServices: function() {
      var services = this.get('container').all('input[type=checkbox]');
      var selectedServices = [];
      services.each(function(service) {
        if (service.get('checked')) {
          var srv = this.get('db').services.getById(service.get('name'));
          selectedServices.push(srv);
        }
      }, this);
      return selectedServices;
    }

  }, {
    ATTRS: {
      /**
        A collection of services raw attribute objects

        @attribute services
        @type {Array}
      */
      services: {}
    }
  });

}, '', {
  requires: [
    'juju-templates',
    'viewlet-view-base',
    'local-charm-import-helpers'
  ]
});
