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
      this.container.setHTML(this.template(model.getAttrs()));
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
     Model Data access helper. By default this uses YUI Attribute styled access
     but to support property styled access you can pass an optional get
     callback such as:

     function(model) {return model[this.name];}

     This callback will be passed the model and triggered with the binding as
     'this'. `this.name` refers to the name of the model property the binding
     is managing.

     @property get
     @type {Function}
     @default Attribute access
     */

    /**
      Removes the databinding events. This method is added to the viewlet
      instance in the databinding class on binding.

      @method remove
    */
  };

  /**
    ViewletManager class for rendering a parent view container which manages the
    display of viewlets.

    @namespace juju
    @class ViewletManager
    @constructor
  */
  ns.ViewletManager = new Y.Base.create('viewlet-manager', Y.View, [], {

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
      // Passed in on instantiation
      this.viewletConfig = options.viewlets;
      this.template = options.template;
      this.templateConfig = options.templateConfig || {};
      this.viewletContainer = options.viewletContainer;
      this.viewlets = this._generateViewlets(); // {String}: {Viewlet}
      this.events = options.events;
      // Map from logical slot name to the CSS selector within ViewletManager's
      // DOM to be used to hold this slot when rendered.
      this.slots = {};
      // Internal mapping from slot name to viewlet rendered into slot.
      this._slots = {};
      this._events = [];

      this._setupEvents();

      this.bindingEngine = new views.BindingEngine(
          options.databinding || {});
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

      // render the viewlets into their containers
      Y.Object.each(this.viewlets, function(viewlet, name) {
        if (!viewlet.name) {
          viewlet.name = name;
        }
        if (viewlet.slot) {
          return;
        }
        var result = viewlet.render(model, attrs);
        if (result && typeof result === 'string') {
          viewlet.container = Y.Node.create(result);
        }
        viewletContainer.append(viewlet.container);
        this.bindingEngine.bind(model, viewlet);
      }, this);

      this.recalculateHeight(viewletContainer);

      // chainable
      return this;
    },

    /**
      Switches the visible viewlet to the requested.

      @method showViewlet
      @param {String} viewletName is a string representing the viewlet name.
      @param {Model} model to associate with the viewlet in its slot.
    */
    showViewlet: function(viewletName, model) {
      var container = this.get('container');
      // This method can be called directly but it is also an event handler
      // for clicking on the viewlet manager tab handles.
      if (typeof viewletName !== 'string') {
        viewletName = viewletName.currentTarget.getData('viewlet');
      }

      var viewlet = this.viewlets[viewletName];
      if (!viewlet) {
        console.warn(
            'Attempted to load a viewlet that does not exist', viewletName);
      }
      if (!model) {
        model = this.get('model');
      }
      // If the viewlet has a slot, use fillSlot to manage the slot. Otherwise,
      // hide existing viewlets in the default slot before showing the new one.
      if (viewlet.slot) {
        this.fillSlot(viewlet, model);
        // Shows the slot
        container.one(this.slots[viewlet.slot]).show();
      } else {
        Y.Object.each(this.viewlets, function(viewletToCheck) {
          if (!viewletToCheck.slot) {
            viewletToCheck.hide();
          }
        });
      }
      viewlet.show();
      viewlet.container.show();
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
    fillSlot: function(viewlet, model) {
      var target;
      var slot = viewlet.slot;
      var existing = this._slots[slot];
      if (existing) {
        existing = this.bindingEngine.getViewlet(existing.name);
        if (existing) {
          existing.destroy();
          // remove only removes the databinding but does not clear the DOM.
          existing.remove();
        }
      }
      if (model === undefined) {
        model = this.get('model');
      }
      if (this.slots[slot]) {
        // Look up the target selector for the slot.
        target = this.get('container').one(this.slots[slot]);
        var result = viewlet.render(model, this.getAttrs());
        if (result) {
          if (typeof result === 'string') {
            result = Y.Node.create(result);
          }
          viewlet.container = result;
        }
        target.setHTML(viewlet.container);
        this._slots[slot] = viewlet;
        this.bindingEngine.bind(model, viewlet);
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

      var height = winHeight - headerHeight -
                   vcNavHeight - footerHeight - (TB_SPACING * 3);
      // subtract the height of the header and footer of the viewlet manager.
      height = height - vcHeaderHeight - vcFooterHeight;

      this.get('container').one(this.viewletContainer)
                           .setStyle('maxHeight', height + 'px');
    },

    /**
      Generates the viewlet instances based on the passed in configuration

      @method _generateViewlets
      @private
    */
    _generateViewlets: function() {
      var viewlets = {},
          model = this.get('model');

      // expand out the config to defineProperty syntax
      this._expandViewletConfig();

      Y.Object.each(this.viewletConfig, function(viewlet, key) {
        // If no viewlet config is passed in it will generate a viewlet using
        // only the base config which causes things to fail further down the
        // line and is difficult to debug.
        if (viewlet === undefined) {
          console.warn('no viewlet config defined for viewlet', key);
          return;
        }
        // create viewlet instances using the base and supplied config
        viewlets[key] = Object.create(ViewletBase, viewlet);
        var resultingViewlet = viewlets[key];
        resultingViewlet.changedValues = {};
        resultingViewlet._eventHandles = [];
        resultingViewlet.options = this.getAttrs();
      }, this);

      return viewlets;
    },

    /**
      Expands the basic objects provided in the viewlet config into the
      defineProperty format for Object.create()

      @method _expandViewletConfig
      @private
    */
    _expandViewletConfig: function() {
      /*jshint -W089 */
      // Tells jshint to ignore the lack of hasOwnProperty in forloops
      for (var viewlet in this.viewletConfig) {
        for (var cfg in this.viewletConfig[viewlet]) {
          if (this.viewletConfig[viewlet][cfg].value === undefined) {
            this.viewletConfig[viewlet][cfg] = {
              value: this.viewletConfig[viewlet][cfg],
              writable: true
            };
          }
        }
      }
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
      Y.Object.each(this.viewlets, function(viewlet, name) {
        if (!viewlet.slot) {
          viewlet.destroy();
        }
      });
      this._events.forEach(function(event) {
        event.detach();
      });
      this.bindingEngine.unbind();
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
          viewletName = target.getData('viewlet'),
          active = container.one('.tab.active');
      this.showViewlet(viewletName);
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
