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
 * Provide data models used for the charm browser.
 *
 * @module models
 * @submodule models.browser
 */
YUI.add('juju-browser-models', function(Y) {

  var ns = Y.namespace('juju.models.browser');

  /*
   * The filters are hard coded for now but will need to be updated. The
   * *right* place for them to live isn't obvious at the moment so they may
   * move. There are notes for an API call to provide a list, but we don't
   * want to make sure using that call is in an efficient way and that filters
   * aren't waiting to load and then another wait to get results.
   *
   */
  ns.FILTER_TYPES = {
    'approved': 'Reviewed Charms'
  };

  ns.FILTER_CATEGORIES = {
    'app-servers': 'App Servers',
    'applications': 'Applications',
    'cache-proxy': 'Cache/Proxy',
    'databases': 'Databases',
    'file-servers': 'File Servers',
    'misc': 'Miscellaneous'
  };

  ns.FILTER_SERIES = {
    'quantal': '12.10 Quantal Quetzal',
    'precise': '12.04 LTS Precise Pangolin',
    'raring': '13.04 Raring Ringtail'
  };

  ns.FILTER_PROVIDERS = {
    'aws': 'AWS/EC2',
    'openstack': 'HP Cloud',
    'lxc': 'LXC'
  };

  ns.registerHelpers = function() {
    /*
     * Provide a pretty version of a provider name given the data name.
     *
     * {{prettyProvider 'openstack'}}
     *
     */
    Y.Handlebars.registerHelper('prettyProvider', function(id, options) {
      // Map the names in one place here.
      if (id === 'ec2') {
        id = 'aws';
      } else if (id === 'local') {
        id = 'lxc';
      }
      return ns.FILTER_PROVIDERS[id];
    });
  };


}, '0.1.0', {
  requires: [
    'model',
    'querystring-stringify'
  ]
});
