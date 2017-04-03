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
    const user = new window.jujugui.User({storage: {}});
    assert.isObject(user);
  });

  describe('controller credentials', () => {
    const getMockStorage = function() {
      return new function() {
        return {
          store: {},
          setItem: function(name, val) { this.store[name] = val; },
          getItem: function(name) { return this.store[name] || null; }
        };
      };
    };

    it('can be set', () => {
      let storage = getMockStorage();
      const user = new window.jujugui.User({storage: storage});
      user.controller = {user: 'rose'};
      assert.deepEqual(JSON.parse(storage.store.credentials), {user: 'rose'});
    });

    it('can be retrieved', () => {
      let storage = getMockStorage();
      const user = new window.jujugui.User({storage: storage});
      user.controller = {password: 'bad wolf'};
      const creds = user.controller;
      assert.equal(creds.password, 'bad wolf');
    });

    it('normalizes user names', () => {
      let storage = getMockStorage();
      const user = new window.jujugui.User({storage: storage});
      user.controller = {user: 'rose'};
      let creds = user.controller;
      assert.equal(creds.user, 'rose@local');
      user.controller = {user: 'doctor@tardis'};
      creds = user.controller;
      assert.equal(creds.user, 'doctor@tardis');
    });

    it('determines if credentials are available', () => {
      let storage = getMockStorage();
      const user = new window.jujugui.User({storage: storage});
      let creds = user.controller;
      assert.equal(creds.areAvailable, false);
      user.controller = {macaroons: ['macaroons']};
      creds = user.controller;
      assert.equal(creds.areAvailable, true);
    });

    it('determines if creds are external', () => {
      let storage = getMockStorage();
      const user = new window.jujugui.User({storage: storage});
      user.controller = {
        user: 'doctor@tardis',
        password: 'bad wolf',
        external: 'foo'
      };
      const creds = user.controller;
      assert.equal(creds.areExternal, true);
    });
  });
});
