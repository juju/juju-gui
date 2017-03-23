/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('acl', function(Y) {

  const juju = Y.namespace('juju');

  /**
    Implement the ACL object interface that can be used to check permissions
    and the ability to manipulate the connected Juju model and controller.

    Note that the controller access is described by the following values:
    - "login": users can log into the controller and only list the models they
      own;
    - "add-model": users can add models;
    - "superuser": users can do everything they want with the controller,
      including listing/removing all models owned by any users.
    The model access holds the following values:
    - "read": users can only access the model in read-only mode;
    - "write": users can modify the model but not delete or share it;
    - "admin": users can modify the model, including deleting and sharing it
      with someone else.

    @function generateAcl
    @param controllerAPI {Object} The controller API connection instance.
    @param modelAPI {Object} The model API connection instance.
    @return {Object} A namespace providing access to ACLs checkers (see below).
  */
  juju.generateAcl = function (controllerAPI, modelAPI) {
    const acl = {
      /**
        Report whether the model interaction is read-only, in which case it is
        not possible to interact with the model, just watch it.

        @function isReadOnly
        @return {Boolean} Whether the user has read-only access.
      */
      isReadOnly: () => modelAPI.get('modelAccess') === 'read',

      /**
        Report whether the current user can create models.

        @function canAddModels
        @return {Boolean} Whether the user can add models.
      */
      canAddModels: () => {
        const access = (
          modelAPI.get('controllerAccess') ||
          controllerAPI.get('controllerAccess')
        );
        return access === 'add-model' || access === 'superuser';
      },

      /**
        Report whether the user can share the current model.

        @function canShareModel
        @return {Boolean} Whether the user can share the current model.
      */
      canShareModel: () => modelAPI.get('modelAccess') === 'admin',

      /**
        Report whether the user can destroy the current model.

        @function canRemoveModel
        @return {Boolean} Whether the user can destroy the current model.
      */
      canRemoveModel: () => modelAPI.get('modelAccess') === 'admin'
    };
    return acl;
  };

}, '0.1.0', {
  requires: []
});
