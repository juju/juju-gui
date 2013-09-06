/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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
  Adds the Inspector panel widget to the juju app.

  The Inspector panel widget is used to display a panel like interface with
  nested detail views aligned to a service in the environment.

  @module juju-inspector-widget
*/
YUI.add('juju-inspector-widget', function(Y) {

  /**
    Service inspector widget and view manager

    @class Inspector
  */
  var Inspector = Y.Base.create('juju-inspector', Y.Widget, [
    Y.WidgetPosition,
    Y.WidgetPositionAlign,
    Y.WidgetPositionConstrain
  ], {

    /**
      Sets up the inspector widget

      @method initializer
    */
    initializer: function() {
      this._events = [];
      var initialView = this.get('initialView');

      if (typeof initialView === 'object') {
        this.onceAfter('render', function() {
          this.showView(initialView.name, (initialView.config || {}));
        }, this);
      }
      // When one of the child view instances wants to navigate the inspector
      // to another view it needs to fire a showView event.
      // Navigation can also be handled by the widget UI if necessary by
      // attaching events in the bindUI method.
      this._events.push(this.on('*:showView', function(e) {
        this.showView(e.name, (e.config || {}));
      }, this));
    },

    // Widget render cycle renderUI > bindUI > syncUI
    /**
      @method renderUI
    */
    renderUI: function(config) {
      // Cannot render the UI until we have one from design
    },
    /**
      @method bindUI
    */
    bindUI: function() {
      // UI binding cannot happen until we have a UI from design
    },

    /**
      Sets the alignment of the UI to the specified element in the DOM.

      @method syncUI
    */
    syncUI: function() {
      var alignTo = this.get('alignTo');
      if (alignTo) {
        this.align(alignTo, [
          Y.WidgetPositionAlign.TR, Y.WidgetPositionAlign.TR]);
      }
    },

    /**
      Cleans up after the widget

      @method destructor
    */
    destructor: function() {
      this.detachEvents();
    },

    /**
      Detaches the events attached during the widget lifecycle

      @method detachEvents
    */
    detachEvents: function() {
      this._events.forEach(function(event) {
        event.detach();
      });
    },

    /**
      Shows the requested view

      @method showView
      @param {String} view object key name that you would like to show.
      @param {Object} config object to pass into view for instantiation.
    */
    showView: function(view, config) {
      var viewObj = this.get('views')[view],
          contentBox = this.get('contentBox'),
          activeView = this.get('activeView'),
          viewInstance;

      config = config || {};

      if (!viewObj) {
        console.error('Invalid view choice');
        return;
      }

      if (!viewObj.instance) {
        config.modelController = this.get('modelController');
        config = Y.merge(this.get('config'), config);
        viewInstance = new Y.juju.views[viewObj.type](config);
      }

      if (activeView) {
        // Remove the widget from being a bubble target for the old view.
        activeView.removeTarget(this);
        // Removes the view's container from the DOM but does not
        // detach any event listeners that are registeres to it.
        activeView.remove();
      }

      viewInstance.addTarget(this);
      // Set the active view to the new view instance.
      this.set('activeView', viewInstance);
      // Render the view again and append it to the contentBox.
      contentBox.append(viewInstance.render().get('container'));
      viewObj.instance = viewInstance;
    }

  }, {
    ATTRS: {

      /**
        Reference to the active view instance.

        @attribute activeView
        @type {Y.View}
        @default undefined
      */
      activeView: {},

      /**
        Y.Node instance to align the widget to.

        @attribute alignTo
        @type {Y.Node}
        @default undefined
      */
      alignTo: {},

      /**
        The view and config to render on instantiation. In the format:
        { name: 'viewName', config: {} }

        @attribute initialView
        @type {Object}
        @default undefined
      */
      initialView: {},

      /**
        Reference to the modelController instance.

        @attribute modelController
        @type {Y.juju.ModelController}
        @default undefined
      */
      modelController: {},

      /**
        Configuration object which will be passed to each view instance.

        @attribute config
        @type {Object}
        @default undefined
      */
      config: {},
      /**
        An object of views to which the widget can render in the format:
        { viewName: { type: 'ViewConstructor' }, ... }
        View instance are always preserved - This may be changed later if we
        find that this becomes a memory issue.

        @attribute views
        @type {Object}
        @default undefined
      */
      views: {}

    }
  });

  Y.namespace('juju.widgets').Inspector = Inspector;

}, '', {
  requires: [
    // Widget modules
    'widget',
    'widget-position',
    'widget-position-align',
    'widget-position-constrain'
  ]
});
