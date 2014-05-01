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


YUI.add('request-series-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      templates = Y.namespace('juju.views').Templates;

  var viewName = 'request-series-view';
  var extensions = [ns.ViewletBaseView, Y.Event.EventTracker];

  ns.RequestSeries = Y.Base.create(viewName, Y.View, extensions, {

    template: templates['request-series'],

    /**
      The initializer.

      @method initializer
    */
    initializer: function() {
      this._eventsBound = false;
    },

    /**
      Renders the template into the dom and calls the _bindUI method on
      the first render.

      @method render
    */
    render: function() {
      var file = this.get('file');
      var env = this.get('env');
      this.get('container').setHTML(this.template({
        name: file.name,
        size: file.size,
        allSeries: env.series,
        defaultSeries: env.get('defaultSeries')
      }));
      // So that we can call render multiple times.
      if (!this._eventsBound) {
        this._eventsBound = true;
        this._bindUI();
      }
    },

    /**
      Binds the button click events to the view's container. It is attached here
      and not in the events object because we need access to the viewletManager
      instance which isn't added until just before render.

      @method _bindUI
    */
    _bindUI: function() {
      var viewletManager = this.viewletManager,
          container = this.get('container');

      this.addEvent(
          container.delegate('click', this.destroyViewletManager,
          'button.cancel',
          this, viewletManager));

      this.addEvent(
          container.delegate('click', this._uploadLocalCharm,
          'button.confirm',
          this, viewletManager, this.get('file'),
          this.get('env'), this.get('db')));
    },

    /**
      Calls the destroy method on the viewlet manager.

      @method destroyViewletManager
      @param {Object} _ The button click event.
      @param {Object} viewletManager The viewlet manager instance.
    */
    destroyViewletManager: function(_, viewletManager) {
      if (window.flags && window.flags.il) {
        this.fire('changeState', {
          sectionA: {
            component: 'charmbrowser',
            metadata: null
          }
        });
      } else {
        viewletManager.destroy();
      }
    },

    /**
      Calls the _uploadLocalCharm method in the localCharmHelpers object.
      Calls the destroy method on the viewlet manager.

      @method _uploadLocalCharm
      @param {Object} _ The button click event.
      @param {Object} viewletManager The viewlet manager instance.
      @param {Object} file The zip file the user is deploying.
      @param {Object} env The applications environment.
      @param {Object} db The applications db.
    */
    _uploadLocalCharm: function(_, viewletManager, file, env, db) {
      var series = this.getSeriesValue(viewletManager);
      Y.juju.localCharmHelpers.uploadLocalCharm(series, file, env, db);
      viewletManager.destroy();
    },

    /**
      Grabs the series value from the user input field in the inspector

      @method getSeriesValue
      @param {Object} viewletManager Reference to the viewletManager.
      @return {String} The series to deploy the charm to.
    */
    getSeriesValue: function(viewletManager) {
      return viewletManager.get('container')
                           .one('select#defaultSeries').get('value');
    }

  }, {
    ATTRS: {
      /**
        The file object that was dropped on the canvas.

        @attribute file
        @type {Object}
      */
      file: {},
      /**
        Reference to the applications env object.

        @attribute env
        @type {Object}
      */
      env: {},
      /**
        Reference to the applications db object

        @attribute db
        @type {Object}
      */
      db: {}
    }
  });

}, '0.0.1', {
  requires: [
    'juju-templates',
    'event-tracker',
    'viewlet-view-base',
    'local-charm-import-helpers'
  ]
});
