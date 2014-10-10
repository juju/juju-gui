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
  Token representing a single added service in the service sidebar.

  @module juju.views
*/
YUI.add('juju-added-service-token', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      Templates = views.Templates;

  ns.AddedServiceToken = Y.Base.create('added-service-token', Y.View, [], {

    template: Templates['added-service-token'],

    events: {
      '.action': {'click': '_onActionClick'}
    },

    /**
      Fires the proper event when an action button is clicked.

      @method _onActionClick
     */
    _onActionClick: function(e) {
      e.preventDefault();
      var button = e.currentTarget,
          action = button.getAttribute('data-action'),
          service = this.get('service'),
          args = {};
      if (action === 'fade' || action === 'show') {
        args.serviceNames = [service.get('name')];
        this.set('visible', action === 'show');
      } else if (action === 'highlight' || action === 'unhighlight') {
        args.serviceName = service.get('name');
        this.set('highlight', action === 'highlight');
      }
      // Re-render because we changed the token's attributes
      this.render();
      this.fire(action, args);
    },

    /**
      Renders the token.

      This method should always be idempotent.

      @method render
    */
    render: function() {
      var attrs = this.getAttrs(),
          container = this.get('container'),
          content;
      // Need to convert the model to a POJO for the template.
      attrs.service = attrs.service.getAttrs();
      content = this.template(attrs);
      container.setHTML(content);
      // Make the token easily selectable in the DOM.
      container.addClass('token');
      container.setAttribute('data-id', this.get('service').get('id'));
    },

    /**
      Destroys the rendered tokens.

      @method destructor
    */
    destructor: function() {
      this.get('container').remove(true);
    }
  },
  {
    ATTRS: {
      /**
        @attribute service
        @default undefined
        @type {Object}
      */
      service: {},

      /**
        @attribute visible
        @default true
        @type {Boolean}
      */
      visible: {
        value: true
      },

      /**
        @attribute highlight
        @default false
        @type {Boolean}
      */
      highlight: {
        value: false
      }
    }
  });

}, '', {
  requires: [
    'juju-templates',
    'view'
  ]
});
