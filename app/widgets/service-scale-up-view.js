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

    initializer: function() {},

    render: function() {
      var content = this.template({
        closed: false,
        services: []
      });
      var container = this.get('container');
      container.addClass('service-scale-up-view');
      container.setHTML(content);
      return this;
    },

    destructor: function() {
      var container = this.get('container');
      container.setHTML('');
      container.removeClass('service-scale-up-view');
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
