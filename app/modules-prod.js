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
/* jshint -W079 */
// Tell jshint to ignore the global redefinition
var GlobalConfig = {
  debug: false,
  // YUI will not download the modules. They are supposed to be already loaded.
  ignoreRegistered: true,
  base: '/juju-ui/assets/',

  // Don't load YUI CSS from YUI servers.
  fetchCSS: false,

  // Please use this object only for defining new aliases.
  // You can add the fullpath to the libraries in "modules-debug.js".
  groups: {
    juju: {
      modules: {
        'juju-views': {
          use: [
            'd3-components',
            'juju-templates',
            'juju-notifications',
            'juju-topology',
            'juju-view-utils',
            'juju-view-environment',
            'juju-view-login'
          ]
        },

        // 'juju-controllers' is just an alias for the modules defined by
        // 'use'. If we use "requires: ['juju-controllers']" that means
        // requiring all the modules below.
        'juju-controllers': {
          use: [
            'juju-env',
            'juju-env-base',
            'juju-env-go',
            'juju-env-python',
            'juju-charm-store',
            'juju-notification-controller',
            'juju-endpoints-controller'
          ]
        }
      }
    }
  }
};
