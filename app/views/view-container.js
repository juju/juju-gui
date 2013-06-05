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

    @Class ViewletBase
    @constructor
  */
  var ViewletBase = {
    template: '{{viewlet}}',
    bind: {},
    generateDOM: function(model) {
      return this.template(model.getAttrs());
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
      ex)
      viewlets: {
        'serviceConfiguration' : {
          // boundings go here from Ben's code
          template: Y.juju.Templates['service-config']
          generateDOM: function() {}
        }
      }

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
      Instance of the view container controller. Set by passing in during
      instantiation ex) { Controller: Y.viewContainer.Controller }

      @property controller
      @default undefined
    */

    /**
      An array of the viewlet instances

      ex) []

      @property viewlets
      @type {Array}
      @default []
    */

    initializer: function(options) {
      // Passed in on instantiation
      this.viewletConfig = options.viewlets;
      this.template = options.template ||
        '<div class="view-container-wrapper">{{viewlets}}</div>';
      this.controller = new options.controller();

      this.viewlets = [];

      this._generateViewlets();
    },

    /**
      Renders the viewlets into the view container

      @method render
    */
    render: function() {
      var container = this.get('container'),
          template, viewletTemplate;

      // To allow you to pass in a string instead of a precompiled template
      if (typeof this.template === 'String') {
        template = Y.Handlebars.compile(this.template);
      } else {
        template = this.template;
      }

      var viewletTemplates = this._renderViewlets();

      container.setHTML(template({viewletTemplates: viewletTemplates}));
    },

    /**
      Switches the visible viewlet to the requested.

      @method showViewlet
      @param {String} viewletName is a string representing the viewlet name
    */
    showViewlet: function(viewletName) {
      var container = this.get('container');
      // possibly introduce some kind of animation here
      container.all('.viewlet-container').setStyle('display', 'none');

      var viewlet = container.one('[data-viewlet=' + viewletName + ']');
      // setStyle() fails with a typeerror during testing on the following line
      viewlet._node.style.display = 'block';
    },

    /**
      Takes the supplied model and renders out the viewlet templates

      @method _renderViewlets
    */
    _renderViewlets: function() {
      var templates = [];
      Y.Object.each(this.viewlets, function(viewlet, key) {
        templates.push(viewlet.generateDOM(this.get('service'), key));
      }, this);
      return templates;
    },

    /**
      Generates the viewlet instances based on the passed in configuration

      @method _generateViewlets
    */
    _generateViewlets: function() {
      Y.Object.each(this.viewletConfig, function(viewlet, key) {
        this.viewlets[key] = Object.create(ViewletBase, viewlet);
      }, this);
    },

    /**
      Handles cleanup on destroy

      @method destructor
    */
    destructor: function() {}

  }, {
    ATTRS: {
      /**
        Reference to the current environment backend

        @attribute env
        @default undefined
      */
      env: {},

      /**
        Reference to the service model

        @attribute service
        @default undefined
      */
      service: {}
    }

  });

  Y.namespace('juju').ViewContainer = ViewContainer;

}, '', {
  requires: [
    'view',
    'node',
    'base-build'
  ]});
