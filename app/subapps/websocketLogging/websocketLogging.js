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
  SubApp that logs websocket traffic for debugging purposes.

  @module juju
  @submodule subapps
*/
YUI.add('subapp-websocket-logging', function(Y) {
  debugger;
  var ns = Y.namespace('juju.subapps');

  /**
    SubApp that logs websocket traffic for debugging purposes.

    @class Browser
    @extends {juju.SubApp}
  */
  ns.WebsocketLogging = Y.Base.create('subapp-websocket-logging', Y.juju.SubApp, [], {

    /**
      General app initializer

      @method initializer
      @param {Object} cfg general init config object.
    */
    initializer: function(cfg) {
      console.log('subapp-websocket-logging started');
      this.on('websocketSend', function(ev) {
        console.log('websocketSend', ev);
      });
      this.on('websocketReceived', function(ev) {
        console.log('websocketReceived', ev);
      });
    }

  });

}, '0.1.0', {
  requires: [
    'sub-app'
  ]
});
