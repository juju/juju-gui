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

var juju_config = { // eslint-disable-line no-unused-vars
  // These are blacklisted config items not passed into subapps mounted into
  // the main App.
  serverRouting: false,
  html5: true,
  container: '#main',
  viewContainer: '#main',
  // BaseUrl is used if the gui is not living at root. Must include leading
  // slash and must not include following slash.
  baseUrl: '',
  // FIXME: turn off transitions until they are fixed.
  transitions: false,
  // If cachedFonts is false, we get the fonts from the Google CDN (faster).
  // If it is true, we use the local, cached fonts instead (better for closed
  // network).
  cachedFonts: true,
  // These are the main application config items used and passed down into all
  // SubApps.
  consoleEnabled: true,
  // superseded by charmstoreURL
  charmworldURL: 'https://manage.jujucharms.com/',
  // Path to the charmstore. This property supersedes the charmworldURL
  // property above.
  charmstoreURL: 'https://api.jujucharms.com/charmstore/',
  apiPath: 'v4',
  socket_protocol: 'ws',
  sandboxSocketURL: 'wss://demo.jujucharms.com/ws',
  user: 'admin',
  password: 'admin',
  sandbox: true,
  // When in sandbox mode should we can create events to simulate a live env.
  // You can also use the :flags:/simulateEvents feature flag.
  // There is also a hotkey to toggle the simulator.
  simulateEvents: false,
  readOnly: false,
  // Set the GA_key to enable Google Analytics usage and calls. Also implies
  // using cookies. For the debug configuration, the GA_key should be blank to
  // prevent muddying the gathered statistics.
  GA_key: '',
  login_help: 'For this demonstration, use the password "admin" to connect.',
  isJujucharms: false,
  // Shows the user dropdown view which contains the login button and hides
  // the get started link.
  hideLoginButton: false,
  // Set a juju-core version so the GUI can adapt its available features.
  jujuCoreVersion: ''
};
