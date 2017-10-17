/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const aclModule = require('./acl');

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('ACL', function() {
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
    return aclModule.generateAcl(controllerAPI, modelAPI);
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
      'who@local': 'admin',
      'dalek@local': 'admin',
      'rose@local': 'write',
      'cyberman@local': 'read'
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
    acl = makeACL({user: 'who@local'});
    assert.strictEqual(acl.canRemoveModel(model), true);
    const model1 = makeModel('who@external', {'who@external': 'admin'});
    acl = makeACL({user: 'who@external'});
    assert.strictEqual(acl.canRemoveModel(model1), true);
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
