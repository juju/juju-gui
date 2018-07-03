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

/* eslint-disable */
const ECS = require('./environment-change-set');
const testUtils = require('./testing-utils');
const User = require('../user/user');
const utils = require('./utils');
/* eslint-enable */

describe('Environment Change Set', function() {
  var Y, ecs, envObj, dbObj, models, _cleanups;

  beforeAll(function(done) {
    Y = YUI(GlobalConfig).use([], function(Y) {
      window.yui = Y;
      require('../yui-modules');
      window.yui.use(window.MODULES, function() {
        models = window.yui.namespace('juju.models');
        done();
      });
    });
  });

  beforeEach(function() {
    _cleanups = [];
    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };
    const userClass = new User({sessionStorage: getMockStorage()});
    userClass.controller = {user: 'user', password: 'password'};
    dbObj = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
    dbObj.fireEvent = sinon.stub();
    ecs = new ECS({
      db: dbObj
    });
    envObj = new Y.juju.environments.GoEnvironment({
      connection: new testUtils.SocketStub(),
      user: userClass,
      ecs: ecs
    });
    sinon.stub(envObj, '_addCharm');
    sinon.stub(envObj, '_deploy');
    sinon.stub(envObj, '_set_config');
    sinon.stub(envObj, '_add_relation');
    sinon.stub(envObj, '_addMachines');
  });

  afterEach(function() {
    _cleanups.forEach(cleanup => cleanup && cleanup());
    dbObj.reset();
    dbObj.destroy();
    envObj.destroy();
  });

  describe('ECS methods', function() {
    it('is instantiable', function() {
      assert.equal(ecs instanceof ECS, true);
      // this object is created on instantiation
      assert.isObject(ecs.changeSet);
    });

    describe('_translateKeysToIds', function() {
      it('calls keyToId when available', function() {
        ecs.changeSet = {
          'foo-1': {
            parents: ['bar-1'],
            command: {
              onParentResults: sinon.stub()
            }
          }
        };
        ecs._updateChangesetFromResults({key: 'bar-1'}, null);

        assert.isTrue(
          ecs.changeSet['foo-1'].command.onParentResults.calledOnce);
      });
    });
  });
});
