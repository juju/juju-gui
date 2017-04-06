/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('ACL', function() {
  let Y;

  beforeAll(done => {
    // By loading this file it has the ACL instance.
    YUI().use('acl', function(y) { Y = y; done(); });
  });

  // Create and return an ACL instance.
  // The given args include:
  // - controllerAccess as returned by the controller connection;
  // - user as returned by the controller connection;
  // - controllerAccessOnModel as returned by the model connection;
  // - modelAccess as returned by the model connection;
  // - modelOwner as returned by the model connection.
  const makeACL = args => {
    const controllerAPI = {
      get: name => {
        return {
          controllerAccess: args.controllerAccess || '',
          user: {controller: {user: args.user || null}}
        }[name];
      }
    };
    const modelAPI = {
      get: name => {
        return {
          controllerAccess: args.controllerAccessOnModel || '',
          modelAccess: args.modelAccess || '',
          modelOwner: args.modelOwner || ''
        }[name];
      }
    };
    return Y.juju.generateAcl(controllerAPI, modelAPI);
  };

  // Create and return a mock of the model object, with the given owner and
  // users. Users are defined as a map of user names to access levels.
  const makeModel = (owner, users) => {
    return {
      owner: owner,
      users: Object.keys(users).map(user => {
        return {name: user, access: users[user]};
      })
    };
  };

  it('isReadOnly', () => {
    let acl = makeACL({modelAccess: 'read'});
    assert.strictEqual(acl.isReadOnly(), true);
    acl = makeACL({modelAccess: 'write'});
    assert.strictEqual(acl.isReadOnly(), false);
    acl = makeACL({modelAccess: 'admin'});
    assert.strictEqual(acl.isReadOnly(), false);
    acl = makeACL({});
    assert.strictEqual(acl.isReadOnly(), false);
  });

  it('canAddModels', () => {
    let acl = makeACL({
      controllerAccess: 'superuser',
      controllerAccessOnModel: 'superuser'
    });
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL({controllerAccess: 'superuser'});
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL({
      controllerAccess: 'add-model',
      controllerAccessOnModel: 'add-model'
    });
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL({controllerAccessOnModel: 'add-model'});
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL({
      controllerAccess: 'login',
      controllerAccessOnModel: 'login'
    });
    assert.strictEqual(acl.canAddModels(), false);
    acl = makeACL({controllerAccess: 'login'});
    assert.strictEqual(acl.canAddModels(), false);
    acl = makeACL({});
    assert.strictEqual(acl.canAddModels(), false);
  });

  it('canShareModel', () => {
    let acl = makeACL({modelAccess: 'read'});
    assert.strictEqual(acl.canShareModel(), false);
    acl = makeACL({modelAccess: 'write'});
    assert.strictEqual(acl.canShareModel(), false);
    acl = makeACL({modelAccess: 'admin'});
    assert.strictEqual(acl.canShareModel(), true);
    acl = makeACL({});
    assert.strictEqual(acl.canShareModel(), false);
  });

  it('canRemoveModel', () => {
    const model = makeModel('who', {
      who: 'admin',
      dalek: 'admin',
      rose: 'write',
      cyberman: 'read'
    });
    let acl = makeACL({});
    assert.strictEqual(acl.canRemoveModel(model), false);
    acl = makeACL({user: 'no-such'});
    assert.strictEqual(acl.canRemoveModel(model), false);
    acl = makeACL({user: 'cyberman'});
    assert.strictEqual(acl.canRemoveModel(model), false);
    acl = makeACL({user: 'rose'});
    assert.strictEqual(acl.canRemoveModel(model), false);
    acl = makeACL({user: 'dalek'});
    assert.strictEqual(acl.canRemoveModel(model), false);
    acl = makeACL({user: 'who'});
    assert.strictEqual(acl.canRemoveModel(model), true);
    acl = makeACL({user: 'who'});
    const model2 = makeModel('who', {who: 'read'});
    assert.strictEqual(acl.canRemoveModel(model2), false);
  });

  it('canRemoveCurrentModel', () => {
    let acl = makeACL({modelAccess: 'read'});
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
    acl = makeACL({modelAccess: 'write'});
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
    acl = makeACL({modelAccess: 'admin'});
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
    acl = makeACL({modelAccess: 'read', modelOwner: 'who', user: 'who'});
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
    acl = makeACL({modelAccess: 'write', modelOwner: 'who', user: 'who'});
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
    acl = makeACL({modelAccess: 'admin', modelOwner: 'who', user: 'who'});
    assert.strictEqual(acl.canRemoveCurrentModel(), true);
    acl = makeACL('', '', '');
    assert.strictEqual(acl.canRemoveCurrentModel(), false);
  });
});
