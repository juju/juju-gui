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

/*
  Environment counts view.
*/
YUI.add('juju-environment-counts', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views'),
      templates = views.Templates;

  /**
    Provides a view with counts of various pieces of the environment: the
    number of machines, units, and services.

    @class views.EnvironmentCounts
    @extends {Y.View}
  */
  ns.EnvironmentCounts = Y.Base.create('environment-counts', Y.View, [
    Y.Event.EventTracker
  ], {

    template: templates['environment-counts'],

    /**
      Sets up the environment count view.

      @method initializer
    */
    initializer: function() {
      this._bindEvents();
    },

    /**
      Bind the events to the models.

      @method _bindEvents
    */
    _bindEvents: function() {
      var db = this.get('db');
      this.addEvent(db.units.after('add', this._onCountChange, this));
      this.addEvent(db.units.after('remove', this._onCountChange, this));
      this.addEvent(db.services.after('add', this._onCountChange, this));
      this.addEvent(db.services.after('remove', this._onCountChange, this));
      this.addEvent(db.machines.after('add', this._onCountChange, this));
      this.addEvent(db.machines.after('remove', this._onCountChange, this));
    },

    /**
      Handles any events that change the counts displayed in the view.

      @method _onCountChnage
    */
    _onCountChange: function(e) {
      this.render();
    },

    /**
      Renders the Added Services Button to the views container. Render is
      idempotent.

      @method render
      @return {Object} reference to the view.
    */
    render: function() {
      var db = this.get('db');
      this.get('container').setHTML(this.template({
        servicesCount: db.services.size(),
        unitsCount: db.units.size(),
        machinesCount: db.machines.size()
      }));
      return this;
    },

    /**
      Properly tears down the added services button.

      @method destructor
    */
    destructor: function() {
      this.get('container').remove(true);
    }

  }, {
    ATTRS: {
      /**
        The database.

        @attribute db
        @type {Object}
        @default undefined
      */
      db: {}
    }
  });

}, '', {
  requires: [
    'event-tracker',
    'juju-templates',
    'view'
  ]
});
