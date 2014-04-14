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
 * Provides the Unit widget, for handling the deployment of units to machines
 * or containers.
 *
 * @namespace juju
 * @module views
 */
YUI.add('juju-serviceunit', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates;

  views.ServiceUnitView = Y.Base.create('ServiceUnitView', Y.View, [], {
    template: Templates['machine-view-serviceunit'],

    events: {
      '.unit .icons .move': {
        'click': '_startMoveHandler'
      },
      '.unit .machines select': {
        'change': '_machineSelectionHandler'
      },
      '.unit .actions .move': {
        'click': '_finishMoveHandler'
      }
    },

    /**
     * Default general initializer method.
     *
     * @method initializer
     * @param {Object} config The widget configuration options.
     */
    initializer: function(cfg) {},

    /**
     * Empties the views container and removes attached classes
     *
     * @method destructor
     */
    destructor: function() {
      var container = this.get('container');
      container.setHTML('');
      container.removeClass('serviceunit-container');
    },

    /**
     * Sets up the DOM nodes and renders them to the DOM.
     *
     * @method render
     */
    render: function() {
      var unit = this.get('unit'),
          html;
      html = this.template({
        id: unit.get('id'),
        displayName: unit.get('displayName')
      });
      var container = this.get('container');
      container.setHTML(html);
      container.addClass('serviceunit-container');
      return this;
    },

    /**
     * Handles clicks on the Move icon.
     *
     * @method _startMoveHandler
     * @param {Y.Event} e EventFacade object.
     */
    _startMoveHandler: function(e) {
      e.halt();
      var target = e.target,
          unit = target.ancestor('.unit');
      unit.all('.name, .icons').hide();
      unit.one('.machines').show();
    },

    /**
     * Handles clicks on the Move action.
     *
     * @method _finishMoveHandler
     * @param {Y.Event} e EventFacade object.
     */
    _finishMoveHandler: function(e) {
      e.halt();
      var target = e.target,
          unit = target.ancestor('.unit');
      // XXX Not sure if this is the right approach or if instead we should
      // re-render the view. -kadams
      unit.all('.name, .icons').show();
      unit.all('.machines, .containers, .actions').hide();
      this.fire('moveUnit');
    },

    /**
     * Handles changes to the machine selection
     *
     * @method _machineSelectionHandler
     * @param {Y.Event} e EventFacade object.
     */
    _machineSelectionHandler: function(e) {
      e.halt();
      var target = e.target,
          unit = target.ancestor('.unit');
      // ensure valid selection
      if (target.get('value') === 'new') {
        unit.one('.containers').hide();
        unit.one('.actions').hide();
      } else {
        unit.one('.containers').show();
        unit.one('.actions').show();
      }
    }
  }, {
    ATTRS: {
      /**
       * The container element for the view.
       *
       * @attribute container
       * @type {Object}
       */
      container: {}
    }
  });
}, '0.1.0', {
  requires: [
    'base',
    'juju-templates',
    'handlebars'
  ]
});
