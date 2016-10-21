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

  it('has static ROOT_RESERVED', () => {
    assert.deepEqual(
      window.jujugui.State.ROOT_RESERVED,
      ['about', 'bigdata', 'docs', 'juju', 'login', 'logout', 'new', 'store']);
  });

  it('has static PROFILE_RESERVED', () => {
    assert.deepEqual(
      window.jujugui.State.PROFILE_RESERVED,
      ['charms', 'issues', 'revenue', 'settings']);
  });

  it('has static properties for the necessary prefixes', () => {
    const State = window.jujugui.State;
    assert.equal(State.PATH_DELIMETERS.get('search'), 'q');
    assert.equal(State.PATH_DELIMETERS.get('user'), 'u');
    assert.equal(State.PATH_DELIMETERS.get('gui'), 'i');
    assert.equal(State.PATH_DELIMETERS.size, 3);
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

  describe('State._parseRoot()', () => {
    it('populates the root portion of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });
      assert.deepEqual(state._parseRoot([], {}), {});
      assert.deepEqual(
        state._parseRoot(['login'], {}),
        {root: 'login'});
    });
  });

  describe('State._parseSearch()', () => {
    it('populates the search portion of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });
      assert.deepEqual(state._parseSearch([], {}),{});
      assert.deepEqual(
        state._parseSearch(['k8s', 'core'], {}),
        {search: 'k8s/core'});
    });
  });

  describe('State._parseGUI', () => {
    it('populates the gui portion of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const guiSections = [{
        parts: [],
        state: {}
      }, {
        parts: ['inspector', 'haproxy', 'config'],
        state: { gui: { inspector: 'haproxy/config' } }
      }, {
        parts: ['machines'],
        state: { gui: { machines: '' } }
      }, {
        parts: ['applications', 'inspector', 'ghost'],
        state: { gui: { applications: '', inspector: 'ghost' } }
      }, {
        parts: ['inspector', 'service123', 'relate-to', 'serviceabc'],
        state: { gui: { inspector: 'service123/relate-to/serviceabc' } }
      }, {
        parts: [
          'inspector', 'apache2', 'machines', '3', 'lxc-0', 'deploy', 'foo'],
        state: {
          gui: { inspector: 'apache2', machines: '3/lxc-0', deploy: 'foo' }
        }
      }];

      guiSections.forEach(section => {
        assert.deepEqual(
          state._parseGUI(section.parts, {}),
          section.state,
          `${section.path} did not properly generate the state object: ` +
          JSON.stringify(section.state));
      });
    });
  });

  describe('State.buildState()', () => {
    it('builds the proper state for the reserved urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/new',
        state: { root: 'new' }
      },{
        path: 'http://abc.com:123/store',
        state: { root: 'store' }
      },{
        path: 'http://abc.com:123/about',
        state: { root: 'about' }
      },{
        path: 'http://abc.com:123/docs',
        state: { root: 'docs' }
      },{
        path: 'http://abc.com:123/login',
        state: { root: 'login' }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds the proper state for the search urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/q/haproxy',
        state: { search: 'haproxy' }
      }, {
        path: 'http://abc.com:123/q/k8s/core',
        state: { search: 'k8s/core' }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds the proper state for the gui urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/i/inspector/haproxy/config',
        state: { gui: { inspector: 'haproxy/config' }}
      }, {
        path: 'http://abc.com:123/i/machines',
        state: { gui: { machines: '' }}
      }, {
        path: 'http://abc.com:123/i/applications/inspector/ghost',
        state: { gui: { applications: '', inspector: 'ghost' }}
      }, {
        path:
          'http://abc.com:123/i/inspector/apache2/machines/3/lxc-0/deploy/foo',
        state: {
          gui: { inspector: 'apache2', machines: '3/lxc-0', deploy: 'foo'}
        }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });
  });

});
