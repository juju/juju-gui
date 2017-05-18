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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;


describe('user auth class', () => {
  it('exists', () => {
    const user = new window.jujugui.User();
    assert.isObject(user);
  });

  const getMockStorage = function() {
    return new function() {
      return {
        store: {},
        setItem: function(name, val) { this.store[name] = val; },
        getItem: function(name) { return this.store[name] || null; },
        removeItem: function(name) { delete this.store[name]; }
      };
    };
  };

  describe('controller credentials', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new window.jujugui.User({sessionStorage: storage});
    });

    beforeEach(() => {
      storage = getMockStorage();
      user = new window.jujugui.User({sessionStorage: storage});
    });

    it('can be set', () => {
      user.controller = {user: 'rose'};
      assert.deepEqual(
        JSON.parse(storage.store.controllerCredentials), {user: 'rose'});
    });

    it('can be retrieved', () => {
      user.controller = {user: 'rose', password: 'bad wolf'};
      const creds = user.controller;
      assert.equal(creds.password, 'bad wolf');
    });

    it('normalizes user names', () => {
      user.controller = {user: 'rose', password: 'bad wolf'};
      let creds = user.controller;
      assert.equal(creds.user, 'rose@local');
      user.controller = {user: 'doctor@tardis', password: 'tenant'};
      creds = user.controller;
      assert.equal(creds.user, 'doctor@tardis');
    });

    it('determines if credentials are available', () => {
      let creds = user.controller;
      assert.equal(creds.areAvailable, false);
      user.controller = {macaroons: ['macaroons']};
      creds = user.controller;
      assert.equal(creds.areAvailable, true);
    });

    it('determines if creds are external', () => {
      user.controller = {
        user: 'doctor@tardis',
        password: 'bad wolf',
      };
      user.externalAuth = 'foo';
      const creds = user.controller;
      assert.equal(creds.areExternal, true);
    });
  });

  describe('model credentials', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new window.jujugui.User({sessionStorage: storage});
    });

    it('can be set', () => {
      user.model = {user: 'rose'};
      assert.deepEqual(
        JSON.parse(storage.store.modelCredentials), {user: 'rose'});
    });

    it('can be retrieved', () => {
      user.model = {user: 'rose', password: 'bad wolf'};
      const creds = user.model;
      assert.equal(creds.password, 'bad wolf');
    });

    it('normalizes user names', () => {
      user.model = {user: 'rose', password: 'bad wolf'};
      let creds = user.model;
      assert.equal(creds.user, 'rose@local');
      user.model = {user: 'doctor@tardis', password: 'tenant'};
      creds = user.model;
      assert.equal(creds.user, 'doctor@tardis');
    });

    it('determines if credentials are available', () => {
      let creds = user.model;
      assert.equal(creds.areAvailable, false);
      user.model = {macaroons: ['macaroons']};
      creds = user.model;
      assert.equal(creds.areAvailable, true);
    });

    it('determines if creds are external', () => {
      user.model = {
        user: 'doctor@tardis',
        password: 'bad wolf',
      };
      user.externalAuth = 'foo';
      const creds = user.model;
      assert.equal(creds.areExternal, true);
    });
  });

  describe('macaroons', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new window.jujugui.User({localStorage: storage});
    });

    it('can set a macaroon', () => {
      user.setMacaroon('test', 'foo-bar');
      assert.equal(storage.getItem('test'), 'foo-bar');
    });

    it('can get a macaroon', () => {
      storage.setItem('test', 'foo-bar');
      assert.equal(user.getMacaroon('test'), 'foo-bar');
    });

    it('can clear a macaroon', () => {
      user.setMacaroon('test', 'foo-bar');
      user.clearMacaroon('test');
      assert.deepEqual(storage.getItem('test'), null);
    });
  });

  describe('usernames', () =>{
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new window.jujugui.User({localStorage: storage});
      user.controller = {user: 'dalek'};
    });

    it('uses the controller username', () => {
      assert.equal(user.username, 'dalek@local');
    });

    it('can provide just the displayname', () => {
      assert.equal(user.displayName, 'dalek');
    });

    it('defaults to externalAuth if available', () => {
      user.externalAuth = {user: {name: 'foo'}};
      assert.equal(user.username, 'foo');
      assert.equal(user.displayName, 'foo');
    });
  });
});
