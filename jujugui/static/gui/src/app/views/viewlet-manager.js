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
  Adds the ViewletManager constructor class and viewlet instantiable object

  @module juju-viewlet-manager
*/
YUI.add('juju-viewlet-manager', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views');

  /**
    This mixin provides the databinding methods that the Viewlet Manager
    uses so that it only needs to call local methods to interact with
    the databinding engine but keep the conditionals out of the main
    code flow.

    @method databindingMixin
  */
  function databindingMixin() {}

  databindingMixin.prototype = {

    /**
      Calls the bindingEngine bind() method.

      @method databindingBind
      @param {Object} model Either a Y.Model or POJO to bind the viewlet to.
      @param {Object} viewlet A reference to the viewlet to bind to the model
    */
    databindingBind: function(model, viewlet) {
      if (this.bindingEngine) {
        this.bindingEngine.bind(model, viewlet);
      }
    },

    /**
      Calls the databindingEngine getViewlet() method.

      @method databindingGetViewlet
      @param {String} name The name of the viewlet to fetch
      @return {Object} The viewlet requested
    */
    databindingGetViewlet: function(name) {
      if (this.bindingEngine) {
        return this.bindingEngine.getViewlet(name);
      }
    },

    /**
      Calls the databindingEngine unbind() method.

      @method databindinginUnbind
    */
    databindingUnbind: function() {
      if (this.bindingEngine) {
        this.bindingEngine.unbind();
      }
    }

  };

  ns.databindingMixin = databindingMixin;

  /**
    ViewletManager class for rendering a parent view container which manages the
    display of viewlets.

    @namespace juju
    @class ViewletManager
    @constructor
  */
  var vmName = 'viewlet-manager';
  ns.ViewletManager = new Y.Base.create(vmName, Y.View, [ns.databindingMixin], {

    /**
      DOM bound events for any view container related events

      @property events
    */
    events: {},

    /**
      Template of the viewlet manager. Set by passing in during instantiation.
      ex) { template: Y.juju.templates['viewlet-manager'] }
      Must include {{ viewlets }} to allow rendering of the viewlets.

      @property template,
      @type {Handlebars Template}
      @default '<div class="viewlet-manager-wrapper">{{viewlets}}</div>'
    */

    /**
      Handlebars config options for the viewlet-manager template. Set by passing
      in during instantiation ex) { templateConfig: {} }

      @property templateConfig
      @type {Object}
    */

    /**
      A hash of the viewlet instances

      ex) {}

      @property viewlets
      @type {Object}
      @default undefined
    */

    initializer: function(options) {
      options = options || {};
      if (!this.template) {
        this.template = options.template; }
      if (!this.viewletContainer) {
        this.viewletContainer = options.viewletContainer; }

      this.templateConfig = options.templateConfig || {};
      // {String}: {View}
      this.views = this._generateViews(options.views || this.views);

      this.events = options.events;
      // Map from logical slot name to the CSS selector within ViewletManager's
      // DOM to be used to hold this slot when rendered.
      this.slots = this.slots || {};
      // Internal mapping from slot name to viewlet rendered into slot.
      this._slots = {};
      this._events = [];
      // Pass in databinding: true in the config parameters
      // to enable databinding.
      if (options.enableDatabinding) {
        this.bindingEngine = new views.BindingEngine(
            options.databinding || {});
      }
    },

    /**
      Return the name of the model as a key to index its
      inspector panel.

      @method getName
      @return {String} id of the model.
    */
    getName: function() {
      return this.get('model').get('id');
    },

    /**
      Return the node for the given slot

      @method _getSlotContainer
      @param {Object} slot the slot to retrieve
      @return {Y.Node} the node
    */
    _getSlotContainer: function(slot) {
      if (slot.scope === 'container') {
        return this.get('container').one(slot.selector);
      } else {
        return Y.one(slot.selector);
      }
    },

    /**
      Renders the views into the viewlet manager. Views with a logical
      slot name defined are not rendered by default and require that showViewlet
      be called for them to render. Slots are typically filled through event
      callback interactions (for example in a click handler).

      @method _render
    */
    _render: function() {
      var attrs = this.getAttrs(),
          managerContainer = attrs.container.one('.juju-inspector'),
          model = attrs.model,
          viewletTemplate;

      // To allow you to pass in a string instead of a precompiled template
      if (typeof this.template === 'string') {
        this.template = Y.Handlebars.compile(this.template);
      }
      managerContainer.setHTML(this.template(this.templateConfig));

      var viewletContainer = managerContainer.one(this.viewletContainer);

      // render the view/viewlets into their containers
      Y.Object.each(this.views, function(view, name) {
        this.renderViewlet(view, name, model, viewletContainer);
      }, this);
    },

    /**
      NOOP. This method is to be overwritten by any class which extends this
      one and is called in the render sequence. See render()

      @method _insertContainer
    */
    _insertContainer: function() {},

    /**
      NOOP. This method is to be overwritten by any class which extends this
      one and is called in the render sequence. See render()

      @method setupUI
    */
    setupUI: function() {},

    /**
      NOOP. This method is to be overwritten by any class which extends this
      one and is called in the render sequence. See render()

      @method renderUI
    */
    renderUI: function() {},

    /**
      Renders the viewlet manager. Calls the
      various render methods in proper order.

      @method render
      @chainable
    */
    render: function() {
      this.setupUI();
      this._render();
      this.renderUI();
      this._insertContainer();
      return this;
    },

    /**
      Renders a viewlet into the given container with the given model.

      @method renderViewlet
      @param {Object} view The view/viewlet to render.
      @param {String} name A string name for the viewlet.
      @param {Model} model The model or POJSO for the viewlet.
      @param {Y.Node} viewletContainer The container into which the viewlet
        should be rendered.
    */
    renderViewlet: function(view, name, model, viewContainer) {
      if (!view.name) { view.name = name; }
      if (view.slot) { return; }
      if (view instanceof Y.View) {
        if (!view.model) {
          view.model = model;
        }
        view.render(this.getAttrs());
        viewContainer.append(view.get('container'));
        this.databindingBind(model, view);
      } else {
        var result = view.render(model, this.getAttrs());
        if (result && typeof result === 'string') {
          view.container = Y.Node.create(result);
        }
        viewContainer.append(view.container);
        this.databindingBind(model, view);
      }

    },

    /**
      Switches the visible viewlet to the requested.

      @method showViewlet
      @param {String} viewletName is a string representing the viewlet name.
      @param {Model} model to associate with the viewlet in its slot.
      @param {Object} options a collection of options to modify the rendering
        of the viewlets.
    */
    showViewlet: function(viewName, model, options) {
      // This method can be called directly but it is also an event handler
      // for clicking on the viewlet manager tab handles.
      if (typeof viewName !== 'string') {
        viewName = viewName.currentTarget.getData('viewlet');
      }
      var view = this.views[viewName];
      if (!view) {
        console.warn(
            'Attempted to load a viewlet that does not exist', viewName);
      }
      if (!model) {
        model = this.get('model');
      }
      // If the viewlet has a slot, use fillSlot to manage the slot. Otherwise,
      // hide existing viewlets in the default slot before showing the new one.
      if (view.slot) {
        this.fillSlot(view, model);
        // Makes sure the view is visible
        view.show();
        // Makes sure the slot the view is to be rendered into is visible.
        this._getSlotContainer(this.slots[view.slot]).show();
      } else {
        Y.Object.each(this.views, function(viewToCheck, name) {
          if (!options || (options && options.visible !== true)) {
            // In order to maintain backwards compatibility with the "only a
            // single viewlet can be rendered at once" an additional `options`
            // parameter needed to be added so that multiple views could
            // be rendered into a single container
            if (!viewToCheck.slot) {
              viewToCheck.hide();
            }
          }
        });
      }
      view.show();
    },

    /**
      Render a viewlet/model pair into a logically named slot.
      Called automatically by showViewlet. When the viewlet has a
      slot defined this method registers the model bindings
      properly removing any existing bindings for the slot.

      @method fillSlot
      @param {Viewlet} viewlet to render.
      @param {Model} model to bind to the slot.
    */
    fillSlot: function(view, model) {
      var target;
      var slot = view.slot;
      var existing = this._slots[slot];
      if (existing) {
        existing = this.databindingGetViewlet(existing.name);
        if (existing) {
          // remove only removes the databinding but does not clear the DOM.
          existing.remove();
          // Destroy the view rendered into the slot.
          existing.destroy();
        }
      }
      if (model === undefined) {
        model = this.get('model');
      }
      if (this.slots[slot]) {
        // Look up the target selector for the slot.
        target = this._getSlotContainer(this.slots[slot]);
        view.render(model, this.getAttrs());
        target.setHTML(view.get('container'));
        this._slots[slot] = view;
        this.databindingBind(model, view);
      } else {
        console.error('View Container Missing slot', slot);
      }
    },

    /**
      Event callback which hides the viewlet slot which is related
      to the close button

      @method hideSlot
      @param {Y.EventFacade} e Click event.
    */
    hideSlot: function(e) {
      e.halt();
      var existing = this._slots[e.currentTarget.getData('slot')];
      if (existing) {
        // unbind the databinding
        existing.remove();
        // Destroy the view rendered into the slot.
        existing.destroy();
        this._getSlotContainer(this.slots[existing.slot]).hide();
        /**
          Fired when the viewlet slot is closing.  May be used by other
          components in order to expand/contract in reaction to the viewlet
          slot changing sizes.

          @event endpointMapAdded
        */
        this.fire('viewletSlotClosing');
      }
    },

    /**
      Generates a new instance of all of the views passed into the viewlet
      manager.

      @method _generateViews
      @param {Object} views A collection of views in the following formats
        ex) {
          'testView2': new testView({})
        }
    */
    _generateViews: function(views) {
      var initializedViews = {};

      Object.keys(views).forEach(function(key) {
        // singleView can be a viewlet or an instance of Y.View
        var singleView = views[key];

        if (singleView instanceof Y.View === false) {
          /* jshint -W055 */
          singleView = new singleView();
          singleView.addTarget(this);
        }

        singleView.viewletManager = this;
        singleView.options = this.getAttrs();
        initializedViews[key] = singleView;
      }, this);

      return initializedViews;
    },

    /**
      Removes and destroys the container

      @method destructor
      @return {undefined} nothing.
    */
    destructor: function() {
      Y.Object.each(this.views, function(view, name) {
        if (!view.slot) {
          view.destroy();
        }
      });
      this._events.forEach(function(event) {
        event.detach();
      });
      this.databindingUnbind();
      this.get('container').remove().destroy(true);
    },

    /**
      Switch tab viewlet.

      @method switchTab
      @param {String} viewName the name of the new active tab.
    */
    switchTab: function(viewName) {
      var container = this.get('container'),
          active = container.one('.tab.active'),
          target = container.one('.tab[data-viewlet=' + viewName + ']');
      this.showViewlet(viewName);
      if (active) {
        active.removeClass('active');
      }
      target.addClass('active');
    }

  }, {
    ATTRS: {
      /**
        Reference to the model

        @attribute model
        @default undefined
      */
      model: {},
      /**
        Reference to the database

        @attribute db
        @default undefined
      */
      db: {},
      /**
        Reference to the environment.

        @attribute env
        @default undefined
      */
      env: {}
    }

  });

}, '', {
  requires: [
    'juju-databinding',
    'view',
    'node',
    'base-build',
    'handlebars'
  ]});
