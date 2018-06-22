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

const User = require('./user');

describe('user auth class', () => {
  it('exists', () => {
    const user = new User();
    assert.isObject(user);
  });

  const getMockStorage = function() {
    return new function() {
      return {
        _names: {},
        setItem: function(name, val) {
          this[name] = val;
          this._names[name] = true;
        },
        getItem: function(name) {
          return this[name] || null;
        },
        removeItem: function(name) {
          delete this[name];
          delete this._names[name];
        },
        clear: function() {
          Object.keys(this._names).forEach(name => {
            this.removeItem(name);
          });
        }
      };
    };
  };

  describe('controller credentials', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new User({sessionStorage: storage});
    });

    beforeEach(() => {
      storage = getMockStorage();
      user = new User({sessionStorage: storage});
    });

    it('can be set', () => {
      user.controller = {user: 'rose'};
      assert.deepEqual(
        JSON.parse(storage.controllerCredentials), {user: 'rose'});
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
        password: 'bad wolf'
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
      user = new User({sessionStorage: storage});
    });

    it('can be set', () => {
      user.model = {user: 'rose'};
      assert.deepEqual(
        JSON.parse(storage.modelCredentials), {user: 'rose'});
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
        password: 'bad wolf'
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
      user = new User({localStorage: storage});
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

  describe('identityURL', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new User({localStorage: storage});
      storage.setItem('charmstore', '<charmstore macaroon>');
      storage.setItem('identity', '<identity token>');
      storage.setItem('terms', '<terms macaroon>');
      storage.setItem('https://1.2.3.4/identity', '<identity token>');
      storage.setItem('https://1.2.3.4/omni', '<omni macaroon>');
      storage.setItem('https://1.2.3.4/null', null);
    });

    it('returns the identity URL', () => {
      assert.strictEqual(user.identityURL(), 'https://1.2.3.4/identity');
    });

    it('returns null if an URL with the identity token is not set', () => {
      storage.removeItem('https://1.2.3.4/identity');
      assert.strictEqual(user.identityURL(), null);
    });

    it('returns null if the token is not set', () => {
      storage.removeItem('identity');
      assert.strictEqual(user.identityURL(), null);
    });
  });

  describe('usernames', () =>{
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new User({localStorage: storage});
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

  describe('expiration', () => {
    let storage, user;

    beforeEach(() => {
      storage = getMockStorage();
      user = new User({sessionStorage: storage});
    });

    it('can set an expiration time', () => {
      const expiration = new Date();
      const cfg = {
        sessionStorage: storage,
        expirationDatetime: expiration
      };
      user = new User(cfg);
      assert.deepEqual(
        new Date(user.expirationDatetime).getTime(),
        expiration.getTime());
    });

    it('sets an expiration time in the future if one is not provided', () => {
      assert.isAbove(new Date(user.expirationDatetime), new Date());
    });

    it('does nothing prior to expiration time', () => {
      storage.setItem('foo', 'bar');
      user._purgeIfExpired();
      assert.equal(storage.getItem('foo'), 'bar');
    });

    it('clears the storage when expiration time is reached', () => {
      let expiration = new Date();
      expiration.setHours(expiration.getHours() - 1); // expired an hour ago
      const cfg = {
        sessionStorage: storage,
        expirationDatetime: expiration
      };
      user = new User(cfg);
      storage.setItem('foo', 'bar');
      user._purgeIfExpired();
      assert.isNull(storage.getItem('foo'));
    });
  });
});
