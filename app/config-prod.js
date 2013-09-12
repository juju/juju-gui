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

var juju_config = {
  // These are blacklisted config items not passed into subapps mounted into
  // the main App.
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,

  // These are the main application config items used and passed down into all
  // SubApps.
  consoleEnabled: false,
  charmworldURL: 'https://manage.jujucharms.com/',
  // The config has three socket settings.  socket_port and socket_protocol
  // modify the current application url to determine the websocket url (always
  // adding "/ws" as the final path).  socket_url sets the entire websocket
  // url.  For backwards compatibility in the GUI charm, if you provide the
  // socket port and/or protocol *and* the socket_url, the socket_url will be
  // ignored (the port/protocol behavior overrides socket_url).
  socket_protocol: 'ws',
  socket_port: 8081,
  user: undefined,
  password: undefined,
  apiBackend: 'go', // Value can be 'python' or 'go'.
  sandbox: false,
  // When in sandbox mode should we create events to simulate a live env.
  // You can also use the :flags:/simulateEvents feature flag.
  simulateEvents: false,
  readOnly: false,
  // Set the GA_key to enable Google Analytics usage and calls. Also implies using cookies.
  GA_key: 'UA-41463568-2',
  login_help: (
      'The password is the admin-secret from the Juju environment.  This can ' +
      'often be found by looking in ~/.juju/environments.yaml.'),
  isJujucharms: false,
  defaultViewmode: 'sidebar',
  // Switches the logout button to a 'Get Juju' button
  showGetJujuButton: false
};
