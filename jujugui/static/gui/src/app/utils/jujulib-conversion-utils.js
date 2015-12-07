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
  Provides utility methods for interacting with data from jujulib.

  @module juju
*/
YUI.add('jujulib-utils', function(Y) {

  var juju = Y.namespace('juju');

  /** 
    Munge jujulib style entity data into juju GUI models.

    @function processEntityData
    @param {Object} entity Entity data from e.g. jujulib.
    @returns {Object} A charm or Bundle juju GUI model.
   */
  juju.makeEntityModel = function(entity) {
    if (entity.entityType === 'charm') {
      return new Y.juju.models.Charm(entity);
    } else {
      return new Y.juju.models.Bundle(entity);
    }
  };

}, '', {
  requires: [
    'juju-charm-models',
    'juju-bundle-models',
  ]
});
