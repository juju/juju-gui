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
      '.action': {'click': '_onActionClick'},
      '.name': {'click': '_onNameClick'}
    },

    /**
      Fires the proper event when an action button is clicked.

      @method _onActionClick
      @param {Object} e Event facade.
     */
    _onActionClick: function(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      // This function can be invoked in response to a DOM event (in which case
      // we need to obtain the action off the DOM) or directly (in which case
      // the action is passed in).
      var action = e.action || e.currentTarget.getAttribute('data-action');
      this.fire(action, {id: this.get('service').id});
    },

    /**
      Fires the proper state change to open an inspector when a service name is
      clicked on.

      @method _onNameClick
      @param {Object} e Event facade.
     */
    _onNameClick: function(e) {
      this.fire('changeState', {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: this.get('service').id,
            flash: { hideHelp: true }
          }
        }
      });
    },

    /**
      Renders the token.

      This method should always be idempotent.

      @method render
    */
    render: function(useServiceVisibility) {
      var attrs = this.getAttrs(),
          container = this.get('container'),
          content;
      // Render the template.
      content = this.template(attrs);
      container.setHTML(content);
      // Make the token easily selectable in the DOM.
      container.addClass('token');
      container.setAttribute('data-id', this.get('service').id);
    },

    /**
      Convenience method for mimicing a click on the unhighlight button.

      @method unhighlight
     */
    unhighlight: function() {
      this._onActionClick({action: 'unhighlight'});
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
