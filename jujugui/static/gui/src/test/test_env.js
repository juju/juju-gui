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

(function() {

  describe('Base Environment', function() {
    var environments, juju;

    before(function(done) {
      YUI(GlobalConfig).use('juju-env-base', function(Y) {
        juju = Y.namespace('juju');
        environments = juju.environments;
        done();
      });
    });

    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store['name'] = val; },
          getItem: function(name) { return this.store['name'] || null; }
        };
      };
    };

    it('calls "open" on connection if available.', function() {
      const userClass = new window.jujugui.User({storage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      const conn= {
        open: sinon.stub(),
        close: sinon.stub()
      };
      const env = new environments.BaseEnvironment({
        conn: conn, user: userClass});
      env.connect();
      assert.equal(conn.open.callCount, 1);
      env.destroy();
    });

    it('calls "cleanup" when the connection is closed', function() {
      const userClass = new window.jujugui.User({storage: getMockStorage()});
      userClass.controller = {user: 'who', password: 'tardis'};
      const conn = {
        open: sinon.stub(),
        close: sinon.stub()
      };
      const env = new environments.BaseEnvironment({
        conn: conn, user: userClass});
      env.connect();
      // Simulate the connection is authenticated.
      env.userIsAuthenticated = true;
      let called = false;
      env.cleanup = function(done) {
        called = true;
        // The connection is still open.
        assert.strictEqual(
          conn.close.callCount, 0, 'connection unexpectedly closed');
        // Close the connection.
        done();
        // The underlaying WebSocket connection has been closed as well, and
        // login data has been properly cleaned up.
        assert.strictEqual(conn.close.callCount, 1, 'connection not closed');
        assert.strictEqual(env.userIsAuthenticated, false);
        assert.strictEqual(env.get('user').controller.areAvailable, false);
      };
      env.close();
      // The cleanup method has been called.
      assert.strictEqual(called, true, 'cleanup not called');
      env.destroy();
    });

    it('sets connecting when it is attempting a connection', function() {
      const userClass = new window.jujugui.User({storage: getMockStorage()});
      userClass.controller = {user: 'user', password: 'password'};
      const env = new environments.BaseEnvironment({user: userClass});
      env.set('socket_url', 'ws://sandbox');
      env.connect();
      assert.equal(env.get('connecting'), true);
      env.close();
      env.destroy();
    });

    describe('attribute resetter', () => {
      let baseModel;

      beforeEach(() => {
        const userClass = new window.jujugui.User({storage: getMockStorage()});
        userClass.controller = {user: 'user', password: 'password'};
        const conn = {
          open: sinon.stub(),
          close: sinon.stub()
        };
        baseModel = new environments.BaseEnvironment({
          conn: conn, user: userClass});
      });

      it('sets attributes', () => {
        baseModel.setConnectedAttr('myattr', 42);
        assert.strictEqual(baseModel.get('myattr'), 42);
      });

      it('sets and resets non-existing attributes', () => {
        baseModel.setConnectedAttr('myattr', 'bannakaffalatta');
        assert.strictEqual(baseModel.get('myattr'), 'bannakaffalatta');
        baseModel.resetConnectedAttrs();
        assert.strictEqual(baseModel.get('myattr'), null);
      });

      it('sets and resets existing attributes', () => {
        baseModel.set('existing', 42);
        baseModel.setConnectedAttr('existing', 47);
        assert.strictEqual(baseModel.get('existing'), 47);
        baseModel.resetConnectedAttrs();
        assert.strictEqual(baseModel.get('existing'), 42);
      });

      it('sets and resets attributes multiple times', () => {
        baseModel.set('existing', '');
        baseModel.setConnectedAttr('existing', 1);
        baseModel.setConnectedAttr('existing', 2);
        baseModel.setConnectedAttr('existing', 3);
        assert.strictEqual(baseModel.get('existing'), 3);
        baseModel.resetConnectedAttrs();
        assert.strictEqual(baseModel.get('existing'), '');
      });

      it('sets and resets multiple attributes', () => {
        baseModel.set('attr1', 'initial');
        baseModel.setConnectedAttr('attr1', 'changed');
        baseModel.setConnectedAttr('attr2', 'non-empty');
        baseModel.setConnectedAttr('attr3', undefined);
        assert.strictEqual(baseModel.get('attr1'), 'changed');
        assert.strictEqual(baseModel.get('attr2'), 'non-empty');
        assert.strictEqual(baseModel.get('attr3'), undefined);
        baseModel.resetConnectedAttrs();
        assert.strictEqual(baseModel.get('attr1'), 'initial');
        assert.strictEqual(baseModel.get('attr2'), null);
        assert.strictEqual(baseModel.get('attr3'), null);
      });
    });

  });

  describe('tags management', function() {
    const requires = ['juju-env-base'];
    let tags;

    before(done => {
      YUI(GlobalConfig).use(requires, function(Y) {
        const module = Y.namespace('juju').environments;
        tags = module.tags;
        done();
      });
    });

    it('builds tags', () => {
      assert.strictEqual(tags.build(tags.USER, 'who'), 'user-who');
      assert.strictEqual(tags.build(tags.CLOUD, 'lxd'), 'cloud-lxd');
    });

    it('parses tags', () => {
      assert.strictEqual(tags.parse(tags.USER, 'user-dalek'), 'dalek');
      assert.strictEqual(tags.parse(tags.MODEL, 'model-default'), 'default');
    });

    it('raises an error when parsing invalid tags', () => {
      const func = () => {
        tags.parse(tags.CONTROLLER, 'user-dalek');
      };
      assert.throws(func, 'invalid tag of type controller: user-dalek');
    });
  });

})();
