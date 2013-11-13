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
 * Provide the help dropdown view.
 *
 * @module views
 */

YUI.add('help-dropdown', function(Y) {

  var views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets'),
      Templates = views.Templates;

  /**
   * The view associated with the help dropdown.
   *
   * @class HelpDropdownView
   */
  var HelpDropdownView = Y.Base.create('HelpDropdownView', Y.View,
      [
        Y.juju.Dropdown,
        Y.Event.EventTracker
      ], {
        template: Templates['help-dropdown'],

        events: {
          '.start-onboarding': {
            click: '_startOnboarding'
          }
        },

        /**
         * Start the onboarding tutorial.
         *
         * @method _startOnboarding
         * @param {Event} ev the click event from the control.
         * @private
         */
        _startOnboarding: function(ev) {
          ev.halt();
          // Added by the view-dropdown-extension.js
          this.__close(); // Closes itself
          // Because we need the app to be in sidebar mode when
          // the user views the onboarding we navigate to it.
          // Once fullscreen is removed we can interact with
          // onboarding here instead of in browser.js
          localStorage.setItem('force-onboarding', true);
          this.fire('navigate', { url: '/sidebar' });
        },

        /**
         * Show the Landscape URL if available.
         *
         * @method _displayLandscapeURL
         * @private
         */
        _displayLandscapeURL: function() {
          var env = this.get('env'),
              url = this.get('container').one('.landscape-url'),
              baseLandscapeURL = views.utils.getLandscapeURL(env);

          if (baseLandscapeURL) {
            url.one('a').setAttribute('href', baseLandscapeURL);
            url.removeClass('hidden');
          }
        },

        /**
         * Sets up the DOM nodes and renders them to the DOM.
         *
         * @method render
         */
        render: function() {
          var container = this.get('container');
          container.setHTML(this.template());
          this._displayLandscapeURL();
          // Added by the view-dropdown-extension.js
          this._addDropdownFunc();
          return this;
        }
      });

  views.HelpDropdownView = HelpDropdownView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'event-tracker',
    'node',
    'handlebars',
    'view-dropdown-extension'
  ]
});
