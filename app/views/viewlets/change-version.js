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


YUI.add('change-version-view', function(Y) {
  var ns = Y.namespace('juju.viewlets'),
      views = Y.namespace('juju.views'),
      templates = Y.namespace('juju.views').Templates,
      plugins = Y.namespace('juju.plugins'),
      models = Y.namespace('juju.models'),
      utils = Y.namespace('juju.views.utils');

  var name = 'changeVersion';
  var extensions = [
    ns.ViewletBaseView
  ];

  ns.ChangeVersion = Y.Base.create(name, Y.View, extensions, {
    template: templates['version-list'],
    events: {
      '.upgrade-link': {click: 'upgradeService'}
    },
    // This viewlet has no databindings.
    bindings: {},

    /**
      Show the list of available upgrades and downgrades.

      @method show
    */
    show: function() {
      var container = this.get('container');
      var model = this.model;
      var charm = model.get('charm');
      var upgrades = [];
      // Find the latest version number - if we have an upgrade, it will be
      // that charm's version; otherwise it will be the current charm's
      // version.
      var currVersion = parseInt(charm.split('-').pop(), 10),
          maxVersion = model.get('upgrade_available') ?
              parseInt(model.get('upgrade_to').split('-').pop(), 10) :
              currVersion;
      // Remove the version number from the charm so that we can build a
      // list of downgrades.
      charm = charm.replace(/-\d+$/, '');
      // Build a list of available downgrades
      if (maxVersion > 1) {
        // XXX Use the list of available versions from Charmworld
        // Makyo - #1246928 - 2014-06-24
        for (var version = maxVersion - 1; version > 0; version -= 1) {
          if (version === currVersion) {
            continue;
          }
          var id = charm + '-' + version;
          upgrades.push({
            id: id,
            link: id.replace('cs:', '/')
          });
        }
      }
      container.setHTML(this.template({upgrades: upgrades}));
      container.show();
    },

    /**
      Upgrades a service to the one specified in the event target's upgradeto
      data attribute.

      @method upgradeService
      @param {Y.EventFacade} ev Click event object.
    */
    upgradeService: function(ev) {
      ev.halt();
      var viewletManager = this.viewletManager,
          db = viewletManager.get('db'),
          env = viewletManager.get('env'),
          store = viewletManager.get('store'),
          service = this.model,
          upgradeTo = ev.currentTarget.getData('upgradeto');
      if (!upgradeTo) {
        return;
      }
      if (!env.setCharm) {
        db.notifications.add(new db.models.Notification({
          title: 'Environment does not support setCharm',
          message: 'Your juju environment does not support setCharm/' +
              'upgrade-charm through the API; please try from the ' +
              'command line.',
          level: 'error'
        }));
        console.warn('Environment does not support setCharm.');
        return;
      }
      env.setCharm(service.get('id'), upgradeTo, false, function(result) {
        if (result.err) {
          db.notifications.create({
            title: 'Error setting charm.',
            message: result.err,
            level: 'error'
          });
          return;
        }
        env.get_charm(upgradeTo, function(data) {
          if (data.err) {
            db.notifications.create({
              title: 'Error retrieving charm.',
              message: data.err,
              level: 'error'
            });
          }
          // Set the charm on the service.
          service.set('charm', upgradeTo);

          // Force a check for any upgrades that may have happened in the
          // mean time next time the change version button is clicked.
          service.set('upgrade_loaded', false);
        });
      });
    }
  });

}, '0.0.1', {
  requires: [
    'juju-charm-models',
    'viewlet-base-view',
    'juju-view',
    'node'
  ]
});
