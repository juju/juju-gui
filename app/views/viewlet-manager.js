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
    Viewlet object class. It's expected that these properties will be
    overwritten on instantiation and so only basic defaults are defined here.

    Instantiate with Object.create()

    @class ViewletBase
    @constructor
  */
  var ViewletBase = {

    /**
      The user defined name for the viewlet. This will be inferred from the
      viewlets object on the ViewletManager when possible.

      @property name
      @type {String}
      @default null
    */
    name: null,

    /**
      String template of the viewlet wrapper

      @property templateWrapper
      @type {string | compiled Handlebars template}
    */
    templateWrapper:
        '<div class="viewlet-wrapper" style="display:none"></div>',

    /**
      Template of the viewlet, provided during configuration

      @property template
      @type {string | compiled Handlebars template}
    */
    template: '{{viewlet}}', // compiled handlebars template

    /**
      The rendered viewlet element

      @property container
      @type {Y.Node}
      @default null
    */
    container: null,

    /**
      Optional logical slot name for this viewlet to fill.

      @property slot
      @type {String}
      @default null
    */
    slot: null,

    /**
      When defined it allows the developer to specify another model to bind
      the Viewlet to, usually one nested in the model passed to the Viewlet
      Manager.

      @property selectBindModel
      @type {Function}
      @default null
    */
    selectBindModel: null,

    /**
      Show the viewlet to the world.

      @method show

     */
    show: function() {
      this.container.show();
    },

    /**
      Hide the viewlet from the world.

      @method hide

     */
    hide: function() {
      this.container.hide();
    },

    /**
      User defined update method which re-renders the contents of the viewlet.
      Called by the binding engine if a modellist is updated. This is
      accomplished by grabbing the viewlets manager and setHTML() with the new
      contents. Passed a reference to the modellist in question.

      @method update
      @type {function}
      @param {Y.ModelList | Y.LazyModelList} modellist from the selectBindModel.
      @default {noop function}
    */
    update: function(modellist) {},

    /**
      Render method to generate the container and insert the compiled viewlet
      template into it. It's passed reference to the model passed to the
      viewlet manager.

      @method render
      @type {function}
      @param {Y.Model} model passed to the viewlet manager.
      @param {Object} viewletManagerAttrs object of all of the viewlet manager
        attributes.
      @default {render function}
    */
    render: function(model, viewletManagerAttrs) {
      this.container = Y.Node.create(this.templateWrapper);

      if (typeof this.template === 'string') {
        this.template = Y.Handlebars.compile(this.template);
      }

      var modelAttrs;
      if (model && model.getAttrs) {
        modelAttrs = model.getAttrs();
      } else {
        modelAttrs = model;
      }

      this.container.setHTML(this.template(modelAttrs));
    },

    /**
      Called when there is a bind conflict in the viewlet.

      @method conflict
      @type {function}
      @default {noop function}
    */
    conflict: function(node) {},

    /**
      A destroy callback called when removing a viewlet for cleanup.

      @method destroy
      @return {undefined} nothing.
     */
    destroy: function() {
    },

    /**
      Called by the databinding engine when fields drop out of sync with
      the supplied model.

      @method unsyncedFields
      @param {Array} dirtyFields an array of keys representing changed fields.
    */
    unsyncedFields: function(dirtyFields) {},

    /**
      Called by the databinding engine when the viewlet drops out
      off a conflicted state

      @method syncedFields
    */
    syncedFields: function() {}

    /**
      Used for conflict resolution. When the user changes a value on a bound
      viewlet we store a reference of the element key here so that we know to
      offer a conflict resolution.

      @property changedValues
      @type {Object}
      @default empty object
    */

    /**
     Model change events handles associated with this viewlet.

     @property _eventHandles
     @type {Array}
     @default empty array
     @private
     */

    /**
      Removes the databinding events. This method is added to the viewlet
      instance in the databinding class on binding.

      @method remove
    */
  };

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
      Viewlet configuration object. Set by passing `viewlets` in during
      instantiation.
      ex) (see ViewletBase)

      @property viewletConfig
      @default undefined
    */

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
      this.template = options.template;
      this.templateConfig = options.templateConfig || {};
      this.viewletContainer = options.viewletContainer;

      this.views = this._generateViews(options.views); // {String}: {View}

      this.events = options.events;
      // Map from logical slot name to the CSS selector within ViewletManager's
      // DOM to be used to hold this slot when rendered.
      this.slots = {};
      // Internal mapping from slot name to viewlet rendered into slot.
      this._slots = {};
      this._events = [];

      this._setupEvents();

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
      Renders the viewlets into the viewlet manager. Viewlets with a logical
      slot name defined are not rendered by default and require that showViewlet
      be called for them to render. Slots are typically filled through event
      callback interactions (for example in a click handler).

      @method render
      @chainable
    */
    render: function() {
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

      this.recalculateHeight(viewletContainer);

      // chainable
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
      if (view instanceof Y.View) {
        if (!view.model) {
          view.model = model;
        }
        view.render();
        viewContainer.append(view.get('container'));
        this.databindingBind(model, view);
      } else {
        if (!view.name) {
          view.name = name;
        }
        if (view.slot) {
          return;
        }
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
      var container = this.get('container');
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
        // Shows the slot
        container.one(this.slots[view.slot]).show();
      } else {
        Y.Object.each(this.views, function(viewToCheck, name) {
          if (viewName !== name && options && options.visible !== true) {
            if (!viewToCheck.slot) {
              viewToCheck.hide();
            }
          }
        });
      }
      view.show();
      this.recalculateHeight();
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
          // remove the element from the DOM
          existing.container.remove(true);
        }
      }
      if (model === undefined) {
        model = this.get('model');
      }
      if (this.slots[slot]) {
        // Look up the target selector for the slot.
        target = this.get('container').one(this.slots[slot]);
        var result = view.render(model, this.getAttrs());
        if (result) {
          if (typeof result === 'string') {
            result = Y.Node.create(result);
          }
          view.container = result;
        }
        target.setHTML(view.container);
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
        // remove the element from the DOM
        existing.container.remove(true);
        this.get('container').one(this.slots[existing.slot]).hide();
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
      Recalculates and sets the height of the viewlet-manager when
      the browser is resized or by being called directly.

      @method recalculateHeight
      @param {Y.Node} container A reference to the container element.
    */
    recalculateHeight: function(container) {
      // Because this is also a callback we need to check to see
      // if this is an event object or a real container element
      if (container && container.type) { container = null; }
      container = container || this.get('container');
      var TB_SPACING = 20;
      var winHeight = container.get('winHeight'),
          header = Y.one('.navbar'),
          footer = Y.one('.bottom-navbar'),
          // Depending on the render cycle these may or may not be in the DOM
          // which is why we pull their heights separately
          vcHeader = container.one('.header-slot'),
          vcNavigation = container.one('.viewlet-manager-navigation'),
          vcFooter = container.one('.viewlet-manager-footer'),
          headerHeight = 0,
          footerHeight = 0,
          vcHeaderHeight = 0,
          vcNavHeight = 0,
          vcFooterHeight = 0;

      if (header) { headerHeight = header.get('clientHeight'); }
      if (footer) { footerHeight = footer.get('clientHeight'); }
      if (vcHeader) { vcHeaderHeight = vcHeader.get('clientHeight'); }
      if (vcNavigation) { vcNavHeight = vcNavigation.get('clientHeight'); }
      if (vcFooter) { vcFooterHeight = vcFooter.get('clientHeight'); }

      var height = winHeight - headerHeight - footerHeight - (TB_SPACING * 3);

      // The viewlet manager has a couple different wrapper elements which
      // impact which components are shown. In this case we are grabbing an
      // internal wrapper to resize without causing the elements to reflow.
      var wrapper = container.one('.viewlet-manager-wrapper:not(.ghost)');
      if (wrapper) {
        wrapper.setStyle('maxHeight', height + 'px');
      }

      // subtract the height of the header and footer of the viewlet manager.
      height = height - vcHeaderHeight - vcFooterHeight - (TB_SPACING * 3);

      // This needs to pull from the 'real' container not what was passed in.
      // This is because this method can be called to recalculate the height
      // on another wrapper element, not necessarily the real container.
      this.get('container')
          .one(this.viewletContainer).setStyle('maxHeight', height + 'px');
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

        if (singleView instanceof Y.View) {
          singleView.viewletManager = this;
          initializedViews[key] = singleView;
        } else {
          // singleView is a viewlet so we need to compile it.
          // We use Y.merge() to make a copy of viewlet configuration so
          // that we never mutate the original configuration.
          initializedViews[key] = this._generateViewlet(
              Y.merge(singleView), key);
        }

      }, this);

      return initializedViews;
    },

    /**
      Creates a new instance from the viewlet config.

      @method _generateViewlet
      @param {Object} viewlet Viewlet configuration object.
      @param {String} key Name of the viewlet from the view list object.
      @return {Object} An instance of the viewlet configuration object.
    */
    _generateViewlet: function(viewlet, key) {
      // If no viewlet config is passed in it will generate a viewlet using
      // only the base config which causes things to fail further down the
      // line and is difficult to debug.
      if (viewlet === undefined) {
        console.warn('no viewlet config defined for viewlet', key);
        return;
      }
      viewlet = this._expandViewletConfig(viewlet);
      viewlet = Object.create(ViewletBase, viewlet);
      viewlet.changedValues = {};
      viewlet._eventHandles = [];
      viewlet.options = this.getAttrs();
      return viewlet;
    },

    /**
      Expands the basic objects provided in the viewlet config into the
      defineProperty format for Object.create()

      @method _expandViewletConfig
      @private
    */
    _expandViewletConfig: function(viewlet) {
      Object.keys(viewlet).forEach(function(key) {
        if (viewlet[key].value === undefined) {
          viewlet[key] = {
            value: viewlet[key],
            writable: true
          };
        }
      });
      return viewlet;
    },

    /**
      Attaches events which cannot be attached using the container event object

      @method _setupEvents
      @private
    */
    _setupEvents: function() {
      this._events.push(
          Y.one('window').after('resize', this.recalculateHeight, this));
    },

    /**
      Removes and destroys the container

      @method destructor
      @return {undefined} nothing.
    */
    destructor: function() {
      Y.Object.each(this.view, function(view, name) {
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

      @method _switchTab
      @param {Y.EventTarget} ev click event handler.
    */
    switchTab: function(ev) {
      ev.halt();
      var container = this.get('container'),
          target = ev.currentTarget,
          viewName = target.getData('viewlet'),
          active = container.one('.tab.active');
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
