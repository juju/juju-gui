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
  const makeACL = (controllerAccess, controllerAccessOnModel, modelAccess) => {
    const controllerAPI = {
      get: sinon.stub().withArgs('controllerAccess').returns(controllerAccess)
    };
    const modelAPI = {
      get: name => {
        return {
          controllerAccess: controllerAccessOnModel,
          modelAccess: modelAccess
        }[name];
      }
    };
    return Y.juju.generateAcl(controllerAPI, modelAPI);
  };

  // Create and return a legacy Juju ACL instance.
  const makeLegacyACL = (controllerAccess, modelAccess) => {
    const modelAPI = {
      get: name => {
        return {
          controllerAccess: controllerAccess,
          modelAccess: modelAccess
        }[name];
      }
    };
    return Y.juju.generateAcl(null, modelAPI);
  };

  it('isReadOnly', () => {
    let acl = makeACL('', '', 'read');
    assert.strictEqual(acl.isReadOnly(), true);
    acl = makeACL('', '', 'write');
    assert.strictEqual(acl.isReadOnly(), false);
    acl = makeACL('', '', 'admin');
    assert.strictEqual(acl.isReadOnly(), false);
    acl = makeACL('', '', '');
    assert.strictEqual(acl.isReadOnly(), false);
  });

  it('canAddModels', () => {
    let acl = makeACL('superuser', 'superuser', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL('superuser', '', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL('add-model', 'add-model', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL('', 'add-model', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeACL('login', 'login', '');
    assert.strictEqual(acl.canAddModels(), false);
    acl = makeACL('login', '', '');
    assert.strictEqual(acl.canAddModels(), false);
    acl = makeACL('', '', '');
    assert.strictEqual(acl.canAddModels(), false);
  });

  it('canAddModels (legacy Juju)', () => {
    let acl = makeLegacyACL('superuser', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeLegacyACL('', '');
    assert.strictEqual(acl.canAddModels(), false);
    acl = makeLegacyACL('add-model', '');
    assert.strictEqual(acl.canAddModels(), true);
    acl = makeLegacyACL('login', '');
    assert.strictEqual(acl.canAddModels(), false);
  });

  it('canShareModel', () => {
    let acl = makeACL('', '', 'read');
    assert.strictEqual(acl.canShareModel(), false);
    acl = makeACL('', '', 'write');
    assert.strictEqual(acl.canShareModel(), false);
    acl = makeACL('', '', 'admin');
    assert.strictEqual(acl.canShareModel(), true);
    acl = makeACL('', '', '');
    assert.strictEqual(acl.canShareModel(), false);
  });

  it('canRemoveModel', () => {
    let acl = makeACL('', '', 'read');
    assert.strictEqual(acl.canRemoveModel(), false);
    acl = makeACL('', '', 'write');
    assert.strictEqual(acl.canRemoveModel(), false);
    acl = makeACL('', '', 'admin');
    assert.strictEqual(acl.canRemoveModel(), true);
    acl = makeACL('', '', '');
    assert.strictEqual(acl.canRemoveModel(), false);
  });
});
