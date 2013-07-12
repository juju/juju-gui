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
  Adds the ViewContainer constructor class and viewlet instantiable object

  @module juju-view-container
*/
YUI.add('juju-view-container', function(Y) {

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
      viewlets object on the ViewContainer when possible.

      @property name
      @type {String}
      @default null
    */
    name: null,

    /**
      String template of the viewlet wrapper

      @property templateWrapper
      @type {string | compiled Handlebars template}
      @default '<div class="viewlet-wrapper" style="display: none"></div>'
    */
    templateWrapper: '<div class="viewlet-wrapper" style="display:none"></div>',

    /**
      Template of the viewlet, provided during configuration

      @property template
      @type {string | compiled Handlebars template}
      @default '{{viewlet}}'
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
      When defined it allows the developer to specify another model to bind the
      Viewlet to, usually one nested in the model passed to the View Container.

      @property selectBindModel
      @type {Function}
      @default null
    */
    selectBindModel: null,

    /**
      User defined update method which re-renders the contents of the viewlet.
      Called by the binding engine if a modellist is updated. This is
      accomplished by grabbing the viewlets container and setHTML() with the
      new contents. Passed a reference to the modellist in question.

      @method update
      @type {function}
      @param {Y.ModelList | Y.LazyModelList} modellist from the selectBindModel.
      @default {noop function}
    */
    update: function(modellist) {},

    /**
      Render method to generate the container and insert the compiled viewlet
      template into it. It's passed reference to the model passed to the view
      container.

      @method render
      @type {function}
      @param {Y.Model} model passed to the view container.
      @param {Object} viewContainerAttrs object of all of the view container
        attributes.
      @default {render function}
    */
    render: function(model, viewContainerAttrs) {
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

      @property _changedValues
      @type {Array}
      @default empty array
      @private
    */

    /**
     Model change events handles associated with this viewlet.

     @property _eventHandles
     @type {Array}
     @default empty array
     @private
     */
  };

  /**
    ViewContainer class for rendering a parent view container which manages the
    display of viewlets.

    @namespace juju
    @class ViewContainer
    @constructor
  */
  var jujuViews = Y.namespace('juju.views');
  jujuViews.ViewContainer = new Y.Base.create('view-container', Y.View, [], {

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
      Template of the view container. Set by passing in during instantiation.
      ex) { template: Y.juju.templates['view-container'] }
      Must include {{ viewlets }} to allow rendering of the viewlets.

      @property template,
      @type {Handlebars Template}
      @default '<div class="view-container-wrapper">{{viewlets}}</div>'
    */

    /**
      Handlebars config options for the view-container template. Set by passing
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
      // Map from logical slot name to the CSS selector within viewContainer's
      // DOM to be used to hold this slot when rendered.
      this.slots = {};
      // Internal mapping from slot name to viewlet rendered into slot.
      this._slots = {};
      this._events = [];

      this._setupEvents();

      this.bindingEngine = new jujuViews.BindingEngine(
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
      Renders the viewlets into the view container. Viewlets with a logical
      slot name defined are not rendered by defaul and require that showViewlet
      be called for them to render. Slots are typically filled through event
      callback interactions (for example in a click handler).

      @method render
      @chainable
    */
    render: function() {
      var attrs = this.getAttrs(),
          container = attrs.container,
          model = attrs.model,
          viewletTemplate;

      // To allow you to pass in a string instead of a precompiled template
      if (typeof this.template === 'string') {
        this.template = Y.Handlebars.compile(this.template);
      }
      container.setHTML(this.template(this.templateConfig));

      var viewletContainer = container.one(this.viewletContainer);

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
      // possibly introduce some kind of switching animation here
      //container.all('.viewlet-wrapper').hide();
      // This method can be called directly but it is also an event handler
      // for clicking on the view container tab handles
      if (typeof viewletName !== 'string') {
        viewletName = viewletName.currentTarget.getData('viewlet');
      }
      var viewlet = this.viewlets[viewletName];
      if (!model) {
        model = this.get('model');
      }
      this.fillSlot(viewlet, model);
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
      if (slot === null) {
        return;
      }
      var existing = this._slots[slot];
      if (existing) {
        existing = this.bindingEngine.getViewlet(existing.name);
        if (existing) {
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
      Recalculates and sets the height of the view-container when
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
          vcHeader = container.one('.view-container-navigation'),
          vcFooter = container.one('.view-container-footer'),
          headerHeight = 0,
          footerHeight = 0,
          vcHeaderHeight = 0,
          vcFooterHeight = 0;

      if (header) { headerHeight = header.get('clientHeight'); }
      if (footer) { footerHeight = footer.get('clientHeight'); }
      if (vcHeader) { vcHeaderHeight = vcHeader.get('clientHeight'); }
      if (vcFooter) { vcFooterHeight = vcFooter.get('clientHeight'); }

      var height = winHeight - headerHeight - footerHeight - (TB_SPACING * 3);
      // subtract the height of the header and footer of the view container.
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
        // create viewlet instances using the base and supplied config
        viewlets[key] = Object.create(ViewletBase, viewlet);
        viewlets[key]._changedValues = [];
        viewlets[key]._eventHandles = [];
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
      // uncomment below when we upgrade jshint
      // /*jshint -W089 */
      for (var viewlet in this.viewletConfig) {
        // remove ifcheck when we upgrade jshint
        if (this.viewletConfig.hasOwnProperty(viewlet)) {
          for (var cfg in this.viewletConfig[viewlet]) {
            // remove ifcheck when we upgrade jshint
            if (this.viewletConfig[viewlet].hasOwnProperty(cfg)) {
              if (this.viewletConfig[viewlet][cfg].value === undefined) {
                this.viewletConfig[viewlet][cfg] = {
                  value: this.viewletConfig[viewlet][cfg],
                  writable: true
                };
              }
            }
          }
        }
      }
      // uncomment below when we upgrade jshint
      // /*jshint +W089 */
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
    */
    destructor: function() {
      this._events.forEach(function(event) {
        event.detach();
      });
      this.bindingEngine.unbind();
      this.get('container').remove().destroy(true);
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
