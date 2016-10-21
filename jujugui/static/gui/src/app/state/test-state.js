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

  describe('State._parseUser()', () => {
    it('populates the user and store portions of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const userSections = [{
        parts: [],
        state: {},
        outputParts: []
      }, {
        parts: ['u', 'ant'],
        state: {
          user: 'ant'
        },
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'settings'],
        state: {
          user: 'frankban/settings'
        },
        outputParts: []
      }, {
        parts: ['u', 'hatch', 'staging', 'haproxy'],
        state: {
          user: 'hatch/staging'
        },
        outputParts: ['haproxy']
      }, {
        parts: ['u', 'frankban', 'production', 'ghost', 'xenial'],
        state: {
          user: 'frankban/production'
        },
        outputParts: ['ghost', 'xenial']
      }, {
        parts: ['u', 'hatch', 'staging', 'ghost', '42'],
        state: {
          user: 'hatch/staging'
        },
        outputParts: ['ghost', '42']
      }, {
        parts: ['u', 'hatch', 'mongodb', 'xenial'],
        state: {
          store: 'hatch/mongodb/xenial'
        },
        outputParts: []
      }, {
        parts: ['u', 'hatch', 'mongodb', '47'],
        state: {
          store: 'hatch/mongodb/47'
        },
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'django', 'bundle', '0'],
        state: {
          store: 'frankban/django/bundle/0'
        },
        outputParts: []
      }, {
      // Multi user delimiter handling.
        parts: ['u', 'hatch', 'staging', 'u', 'frankban', 'django'],
        state: {
          user: 'hatch/staging',
          store: 'frankban/django'
        },
        outputParts: []
      }, {
        parts: [
          'u', 'frankban', 'production', 'u', 'hatch', 'mongodb', 'xenial'],
        state: {
          user: 'frankban/production',
          store: 'hatch/mongodb/xenial'
        },
        outputParts: []
      }, {
        parts: [
          'u', 'hatch', 'staging', 'u', 'hatch', 'django', 'bundle', '0'],
        state: {
          user: 'hatch/staging',
          store: 'hatch/django/bundle/0'
        },
        outputParts: []
      }];

      userSections.forEach(section => {
        assert.deepEqual(
          state._parseUser(section.parts, {}),
          {state: section.state, parts: section.outputParts},
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

    it('builds proper state for the user urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/u/ant',
        state: { user: 'ant' }
      }, {
        path: 'http://abc.com:123/u/hatch/staging',
        state: { user: 'hatch/staging' }
      }, {
        path: 'http://abc.com:123/u/hatch/mongodb/xenial',
        state: { store: 'hatch/mongodb/xenial' }
      }, {
        path: 'http://abc.com:123/u/hatch/mongodb/47',
        state: { store: 'hatch/mongodb/47' }
      }, {
        path: 'http://abc.com:123/u/frankban/django/bundle/0',
        state: { store: 'frankban/django/bundle/0' }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds proper state for the store urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/haproxy',
        state: { store: 'haproxy' }
      }, {
        path: 'http://abc.com:123/haproxy/xenial',
        state: { store: 'haproxy/xenial' }
      }, {
        path: 'http://abc.com:123/haproxy/42',
        state: { store: 'haproxy/42' }
      }, {
        path: 'http://abc.com:123/django/bundle/47',
        state: { store: 'django/bundle/47' }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds proper state for model and store urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/u/hatch/staging/haproxy',
        state: { user: 'hatch/staging', store: 'haproxy' }
      }, {
        path: 'http://abc.com:123/u/frankban/production/ghost/xenial',
        state: { user: 'frankban/production', store: 'ghost/xenial' }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/ghost/42',
        state: { user: 'hatch/staging', store: 'ghost/42' }
      }, {
        path: 'http://abc.com:123/u/frankban/production/django/bundle/47',
        state: { user: 'frankban/production', store: 'django/bundle/47' }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/frankban/django',
        state: { user: 'hatch/staging', store: 'frankban/django' }
      }, {
        path: 'http://abc.com:123/u/frankban/production/u/hatch/mongodb/xenial',
        state: { user: 'frankban/production', store: 'hatch/mongodb/xenial' }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/hatch/mongodb/47',
        state: { user: 'hatch/staging', store: 'hatch/mongodb/47' }
      }, {
        path:
          'http://abc.com:123/u/frankban/production/u/frankban/django/bundle/0',
        state: {
          user: 'frankban/production', store: 'frankban/django/bundle/0' }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds proper state for model and gui urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/u/hatch/staging/i/inspector/haproxy/config',
        state: { user: 'hatch/staging', gui: { inspector: 'haproxy/config' } }
      }, {
        path: 'http://abc.com:123/u/frankban/production/i/machines',
        state: { user: 'frankban/production', gui: { machines: '' } }
      }, {
        path:
          'http://abc.com:123/u/hatch/staging/i/applications/inspector/ghost/',
        state: {
          user: 'hatch/staging', gui: { applications: '', inspector: 'ghost' } }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds proper state for store and gui urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/haproxy/i/inspector/haproxy/config',
        state: { store: 'haproxy', gui: { inspector: 'haproxy/config' } }
      }, {
        path: 'http://abc.com:123/ghost/xenial/i/machines',
        state: { store: 'ghost/xenial', gui: { machines: '' } }
      }, {
        path: 'http://abc.com:123/ghost/42/i/applications/inspector/ghost/',
        state: {
          store: 'ghost/42', gui: { applications: '', inspector: 'ghost' } }
      }, {
        path: 'http://abc.com:123/django/bundle/47/i/machines',
        state: { store: 'django/bundle/47', gui: { machines: '' } }
      }, {
        path: 'http://abc.com:123/u/hatch/mongodb/xenial/i/applications/inspector/ghost/', // eslint-disable-line max-len
        state: {
          store: 'hatch/mongodb/xenial',
          gui: { applications: '', inspector: 'ghost'} }
      }, {
        path: 'http://abc.com:123/u/frankban/django/bundle/0/i/machines',
        state: { store: 'frankban/django/bundle/0', gui: { machines: '' } }
      }];

      urls.forEach(test => {
        assert.deepEqual(
          state.buildState(test.path),
          test.state,
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });

    it('builds proper state for urls with all sections', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123'
      });

      const urls = [{
        path: 'http://abc.com:123/u/hatch/staging/haproxy/i/inspector/haproxy/config', // eslint-disable-line max-len
        state: {
          user: 'hatch/staging',
          store: 'haproxy',
          gui: { inspector: 'haproxy/config' }
        }
      }, {
        path: 'http://abc.com:123/u/frankban/production/ghost/xenial/i/inspector/haproxy/config', // eslint-disable-line max-len
        state: {
          user: 'frankban/production',
          store: 'ghost/xenial',
          gui: { inspector: 'haproxy/config' }
        }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/ghost/42/i/inspector/haproxy/config', // eslint-disable-line max-len
        state: {
          user: 'hatch/staging',
          store: 'ghost/42',
          gui: { inspector: 'haproxy/config' }
        }
      }, {
        path: 'http://abc.com:123/u/frankban/production/django/bundle/47/i/machines', // eslint-disable-line max-len
        state: {
          user: 'frankban/production',
          store: 'django/bundle/47',
          gui: { machines: '' }
        }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/frankban/django/i/applications/inspector/ghost/', // eslint-disable-line max-len
        state: {
          user: 'hatch/staging',
          store: 'frankban/django',
          gui: { applications: '', inspector: 'ghost' }
        }
      }, {
        path: 'http://abc.com:123/u/frankban/production/u/hatch/mongodb/xenial/i/machines', // eslint-disable-line max-len
        state: {
          user: 'frankban/production',
          store: 'hatch/mongodb/xenial',
          gui: { machines: '' }
        }
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/hatch/mongodb/47/i/applications/inspector/ghost/', // eslint-disable-line max-len
        state: {
          user: 'hatch/staging',
          store: 'hatch/mongodb/47',
          gui: { applications: '', inspector: 'ghost' }
        }
      }, {
        path: 'http://abc.com:123/u/frankban/production/u/frankban/django/bundle/0/i/applications', // eslint-disable-line max-len
        state: {
          user: 'frankban/production',
          store: 'frankban/django/bundle/0',
          gui: { applications: '' }
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
