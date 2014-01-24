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

YUI.add('local-charm-import-helpers', function(Y) {
  var ns = Y.namespace('juju');

  ns.localCharmHelpers = {

    deployLocalCharm: function(file, env, db) {
      // We will eventually be adding a dialogue of some
      // sort to allow the user to confiure this value.
      var series = env.get('defaultSeries'),
          notifications = db.notifications;

      env.uploadLocalCharm(
          file,
          series,
          function(e) {
            // progress callback
          },
          function(e) {
            if (e.type === 'error') {
              notifications.add({
                title: 'Import failed',
                message: 'Import from "' + file.name + '" failed.',
                level: 'error'
              });
              console.log('error', e);
            } else {
              notifications.add({
                title: 'Imported local charm file',
                message: 'Import from "' + file.name + '" successful.',
                level: 'important'
              });
            }
          });
    }

  };

}, '0.1.0', {
  requires: []
});
