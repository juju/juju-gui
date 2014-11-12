/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2014 Canonical Ltd.

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
  Separate browser event handling into its own extension for cleaner
  code and testing.

  @module juju.browser
*/

YUI.add('subapp-browser-events', function(Y) {
  var browser = Y.namespace('juju.browser');

  /**
    Event handling for the browser subapp.

    @method BrowserEventsExtension
  */
  function BrowserEventsExtension() {}

  BrowserEventsExtension.prototype = {
    /**
      Handle changes in state, typically navigation requests.

      @method _onChangeState
      @param {Object} e The event facade.
    */
    _onChangeState: function(e) {
      // Cancel the inspectorRetryTimer, if there is one.
      // The user may be navigating away from the inspector, but first
      // triggered the inspector's retry mechanism. This makes sure the timer
      // won't suddenly have the inspector show up after the user navigates
      // away.
      var timer = this.get('inspectorRetryTimer');
      if (timer) {
        timer.cancel();
        this.set('inspectorRetries', 0);
      }
      this.state.set('allowInspector', true);
      var state = e.details[0];
      var url = this.state.generateUrl(state);
      this.navigate(url);
    },

    /**
      Handle service deploys by opening up the appropriate inspector.

      @method _onServiceDeployed
      @param {Object} e The event facade.
    */
    _onServiceDeployed: function(e) {
      var activeInspector = this._inspector;
      if (activeInspector && !activeInspector.get('destroyed')) {
        var activeClientId = activeInspector.get('model')
          .get('clientId');
        // Because multiple services can be deployed at once we only want to
        // switch to a deployed inspector if there is currently one open.
        // And we only want to switch to that specific inspector.
        if (activeClientId === e.clientId) {
          this.fire('changeState', {
            sectionA: {
              component: 'inspector',
              metadata: { id: e.serviceName }
            }});
        }
      }
    }
  };

  browser.BrowserEventsExtension = BrowserEventsExtension;

});
