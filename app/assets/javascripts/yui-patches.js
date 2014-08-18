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
 * Provides a consistant place to put any monkey patches to YUI modules.
 */
YUI.add('yui-patches', function(Y) {

  /**
    Lazy Model List maintains a _idMap property with id's of all of the models
    and is only updated on add & delete so if you modify the id of a model it
    will not be able to be found using the getById() method.

    @method updateModelId
    @param {Object} model Reference to the model object to update.
    @param {String} newId The new id you'd like to set on the model.
    @param {Boolean} revive Whether or not the model should be revived before
      the id is set to trigger attribute change events.
    @return {Object} The model object with the updated id. Or Throws if the
      requested id is already in the id map.
  */
  Y.LazyModelList.prototype.updateModelId = function(model, newId, revive) {
    if (this._idMap[newId] !== undefined) {
      throw ('Requested model id already exists in id map');
    }
    if (this._idMap[model.id] === undefined) {
      throw ('Supplied model does not exist in the id map');
    }
    // Copy the current model to the new id key.
    this._idMap[newId] = this._idMap[model.id];
    // Delete the old record;
    delete this._idMap[model.id];
    // Update the models id field.
    if (revive === true) {
      var revivedModel = this.revive(this.item(newId));
      revivedModel.set('id', newId);
      this.free(revivedModel);
    } else {
      this._idMap[newId].id = newId;
    }
    return this._idMap[newId];
  };

}, '', {
  requires: [
    'lazy-model-list'
  ]
});
