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


YUI.add('viewlet-request-series', function(Y) {
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
      this.get('container').append(this.template(this.model));
      // So that we can call render multiple times.
      if (!this._eventsBound) {
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
      viewletManager.destroy();
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
      Y.juju.localCharmHelpers._uploadLocalCharm(viewletManager, file, env, db);
      viewletManager.destroy();
    }

  });

}, '0.0.1', {
  requires: [
    'juju-templates',
    'juju-view',
    'viewlet-view-base',
    'local-charm-import-helpers'
  ]
});
