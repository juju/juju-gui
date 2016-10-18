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

describe('State', () => {

  it('can be instantiated', () => {
    const state = new window.jujugui.State({});
    assert.equal(state instanceof window.jujugui.State, true);
  });

  describe('State._sanitizeURL()', () => {

    it('can sanitize the url', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });
      assert.equal(
        state._sanitizeURL('http://abc.com:123/a/b/c/d/'),
        'a/b/c/d');
    });

  });

});
