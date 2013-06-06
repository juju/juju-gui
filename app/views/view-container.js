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
      Bindings config for the binding engine
      ex) [ { name: 'modelFieldName', target: 'querySelectorString' } ]
      ex) [ { name: 'modelFieldName', target: [ 'querySelectorString' ] } ]

      @property bindings
      @type {array}
      @default []
    */
    bindings: [],

    /**
      The rendered viewlet element

      @property container
      @type {Y.Node}
      @default ''
    */
    container: '',

    /**
      User defined update method which re-renders the contents of the viewlet.
      Called by the binding engine if a modellist is updated.

      @property update
      @type {function}
      @default {noop function}
    */
    update: function(modellist) {
      // rerender the ui from a modellist
      //this.container.setHTML();
    },

    /**
      Render method to generate the container and insert the compiled viewlet
      template into it.

      @property render
      @type {function}
      @default {render function}
    */
    render: function(model) {
      this.container = Y.Node.create(this.templateWrapper);

      if (typeof this.template === 'string') {
        this.template = Y.Handlebars.compile(this.template);
      }
      this.container.setHTML(this.template(model.getAttrs()));
    }
  };

  /**
    ViewContainer class for rendering a parent view container which manages the
    display of viewlets.

    @namespace juju
    @class ViewContainer
    @constructor
  */
  var ViewContainer = new Y.Base.create('view-container', Y.View, [], {

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
      Instance of the view container controller. Set by passing in during
      instantiation ex) { Controller: Y.viewContainer.Controller }

      @property controller
      @default undefined
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
      this.templateConfig = options.templateConfig;
      // create new instance of passed in controller
      this.controller = new options.controller();
      this.viewlets = this._generateViewlets();
    },

    /**
      Renders the viewlets into the view container

      @method render
    */
    render: function() {
      var container = this.get('container'),
          model = this.get('model'),
          viewletTemplate;

      // To allow you to pass in a string instead of a precompiled template
      if (typeof this.template === 'String') {
        this.template = Y.Handlebars.compile(this.template);
      }

      container.setHTML(this.template(this.templateConfig));

      // We may want to make this selector user defined at some point
      var viewletContainer = container.one('.viewlet-container');

      // render the viewlets into their containers
      Y.Object.each(this.viewlets, function(viewlet) {
        viewlet.render(model);
        viewletContainer.append(viewlet.container);
      });

      // chainable
      return container;
    },

    /**
      Switches the visible viewlet to the requested.

      @method showViewlet
      @param {String} viewletName is a string representing the viewlet name.
    */
    showViewlet: function(viewletName) {
      var container = this.get('container');
      // possibly introduce some kind of switching animation here
      container.all('.viewlet-container').setStyle('display', 'none');
      this.viewlets[viewletName].container.setStyle('display', 'block');
    },

    /**
      Generates the viewlet instances based on the passed in configuration

      @method _generateViewlets
    */
    _generateViewlets: function() {
      var viewlets = {},
          model = this.get('model');

      // expand out the config to defineProperty syntax
      this.expandViewletConfig();

      Y.Object.each(this.viewletConfig, function(viewlet, key) {
        // create viewlet instances using the base and supplied config
        viewlets[key] = Object.create(ViewletBase, viewlet);
        // bind the UI to the model
        this.controller.bind(model, viewlets[key]);
      }, this);

      return viewlets;
    },

    /**
      Expands the basic objects provided in the viewlet config into the
      defineProperty format for Object.create()

      @method expandViewletConfig
    */
    expandViewletConfig: function() {
      // uncomment below when we upgrade jshint
      // /*jshint -W089 */
      for (var viewlet in this.viewletConfig) {
        if (true) { // remove when we upgrade jshint
          for (var cfg in this.viewletConfig[viewlet]) {
            if (true) { // remove when we upgrade jshint
              this.viewletConfig[viewlet][cfg] = {
                value: this.viewletConfig[viewlet][cfg],
                writable: true
              };
            }
          }
        }
      }
      // uncomment below when we upgrade jshint
      // /*jshint +W089 */
    },

    /**
      Handles cleanup on destroy

      @method destructor
    */
    destructor: function() {}

  }, {
    ATTRS: {
      /**
        Reference to the model

        @attribute model
        @default undefined
      */
      model: {}
    }

  });

  Y.namespace('juju').ViewContainer = ViewContainer;

}, '', {
  requires: [
    'view',
    'node',
    'base-build',
    'handlebars'
  ]});
