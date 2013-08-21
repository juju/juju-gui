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
 * Browser SubApp minized state representation.
 *
 * @module juju.browser
 * @submodule views
 *
 */
YUI.add('subapp-browser-minimized', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      views = Y.namespace('juju.views');

  // XXX jcsackett Aug 21 2013 The minimized view currently dupes a bunch of
  // code from the Mainview. We can't just use mainview here b/c mainview
  // expects search stuff to exist, which is only true for the sidebar and
  // fullscreen views. When we add the search bar to always be present, we
  // should remove this duplication.
  /**
   * The minimized state view.
   *
   * @class MinimizedView
   * @extends {Y.View}
   *
   */
  ns.MinimizedView = Y.Base.create('browser-view-minimized', Y.View, [
    Y.Event.EventTracker
  ], {
    template: views.Templates.minimized,

    events: {
      '.bws-icon': {
        click: '_toggleViewState'
      }
    },

    /**
       Binds the viewmode control events to navigation.

       @method _bindViewmodeControls
     */
    _bindViewmodeControls: function() {
      var container = this.get('container');
      this.addEvent(
          this.controls.on(
              this.controls.EVT_TOGGLE_VIEWABLE, this._toggleViewState, this)
      );

      this.addEvent(
          this.controls.on(
              this.controls.EVT_FULLSCREEN, this._goFullscreen, this)
      );
      this.addEvent(
          this.controls.on(
              this.controls.EVT_SIDEBAR, this._goSidebar, this)
      );
    },

    /**
      Upon clicking the browser icon make sure we re-route to the
      new form of the UX.

      @method _goFullscreen
      @param {Event} ev the click event handler on the button.

     */
    _goFullscreen: function(ev) {
      ev.halt();
      this.fire('viewNavigate', {
        change: {
          viewmode: 'fullscreen'
        }
      });
    },

    /**
      Upon clicking the build icon make sure we re-route to the
      new form of the UX.

      @method _goSidebar
      @param {Event} ev the click event handler on the button.

     */
    _goSidebar: function(ev) {
      ev.halt();
      this.fire('viewNavigate', {
        change: {
          viewmode: 'sidebar'
        }
      });
    },

    /**
     * Toggle the visibility of the browser. Bound to nav controls in the
     * view, however this will be expanded to be controlled from the new
     * constant nav menu outside of the view once it's completed.
     *
     * @method _toggle_sidebar
     * @param {Event} ev event to trigger the toggle.
     *
     */
    _toggleViewState: function(ev) {
      ev.halt();

      this.get('container').hide();
      Y.one('#subapp-browser').show();

      this.fire('viewNavigate', {
        change: {
          viewmode: this.get('oldViewMode')
        }
      });
    },

    /**
     * Destroy the minimized view.
     *
     * @method destructor
     *
     */
    destructor: function() {
      this.get('container').setHTML('');
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     *
     */
    render: function() {
      var tpl = this.template(),
          tplNode = Y.Node.create(tpl);
      this.get('container').setHTML(tplNode);
      // Make sure the controls starts out setting the correct active state
      // based on the current viewmode for our View.
      this.controls = new Y.juju.widgets.ViewmodeControls({
        currentViewmode: this.get('oldViewMode')
      });
      this.controls.render();
      this._bindViewmodeControls();
    }

  }, {
    ATTRS: {
      container: {
        value: '#subapp-browser-min'
      },

      /**
       * The old viewmode tells us how to return to the last state that we
       * were in when we closed the Browser.
       *
       * @attribute oldViewMode
       * @default 'sidebar'
       * @type {String}
       *
       */
      oldViewMode: {
        value: 'sidebar'
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'juju-templates',
    'juju-views',
    'view',
    'viewmode-controls'
  ]
});
