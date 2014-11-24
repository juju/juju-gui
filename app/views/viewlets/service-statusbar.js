/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2014 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';


YUI.add('inspector-statusbar-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = views.Templates;

  ns.StatusBar = Y.Base.create('statusbar', Y.View, [ns.ViewletBaseView], {
    template: templates.serviceStatusBar,
    bindings: {
      aggregated_status: {
        'update': function(node, value) {
          if (value && value.uncommitted) {
            // We don't want to update the status bar with uncommitted units.
            delete value.uncommitted;
          }
          var bar = this._statusbar;
          if (!bar) {
            bar = this._statusbar = new views.StatusBar({
              width: 250,
              target: node.getDOMNode(),
              labels: false,
              height: 30
            }).render();
          }
          bar.update(value);
        }
      }
    },
    /**
      Render the view, including the scale up component if required.

      @method render
      @param {Object} attributes The viewlet manager attributes.
    */
    render: function(attributes) {
      var container = this.get('container'),
          rendered = this.get('rendered'),
          model = attributes.model;
      if (!rendered) {
        this.set('rendered', true);
        container.append(this.template(model.getAttrs()));
      } else if (!model.get('pending')) {
        // If the inspector is open when the service is deployed we need
        // to update the inspector.
        var statusBar = container.one('.status-bar');
        // There is no status bar if it is a subordinate service.
        if (statusBar) {
          statusBar.removeClass('hidden');
        }
      }
    }
  }, {
    ATTRS: {
      /**
        Flag to indicate if the render method had been called

        @attribute rendered
        @type {Boolean}
        @default false
      */
      rendered: {
        value: false
      }
    }
  });

}, '0.0.1', {
  requires: [
    'node',
    'd3',
    'd3-statusbar',
    'juju-charm-models',
    'viewlet-view-base',
    'juju-view'
  ]
});
