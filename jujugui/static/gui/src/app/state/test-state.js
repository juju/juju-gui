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

  const userStateTests = [{
    path: 'http://abc.com:123/u/ant',
    state: { profile: 'ant' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging',
    state: { user: 'hatch/staging' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/mongodb/xenial',
    state: { store: 'u/hatch/mongodb/xenial' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/mongodb/47',
    state: { store: 'u/hatch/mongodb/47' },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/django/bundle/0',
    state: { store: 'u/frankban/django/bundle/0' },
    error: null
  }];

  const rootStateTests = [{
    path: 'http://abc.com:123/new',
    state: { root: 'new' },
    error: null
  },{
    path: 'http://abc.com:123/store',
    state: { root: 'store' },
    error: null
  },{
    path: 'http://abc.com:123/about',
    state: { root: 'about' },
    error: null
  },{
    path: 'http://abc.com:123/docs',
    state: { root: 'docs' },
    error: null
  },{
    path: 'http://abc.com:123/login',
    state: { root: 'login' },
    error: null
  }];

  const searchStateTests = [{
    path: 'http://abc.com:123/q/haproxy',
    state: { search: 'haproxy' },
    error: null
  }, {
    path: 'http://abc.com:123/q/k8s/core',
    state: { search: 'k8s/core' },
    error: null
  }];

  const guiStateTests = [{
    path: 'http://abc.com:123/i/inspector/haproxy/config',
    state: { gui: { inspector: 'haproxy/config' }},
    error: null
  }, {
    path: 'http://abc.com:123/i/machines',
    state: { gui: { machines: '' }},
    error: null
  }, {
    path: 'http://abc.com:123/i/applications/inspector/ghost',
    state: { gui: { applications: '', inspector: 'ghost' }},
    error: null
  }, {
    path:
      'http://abc.com:123/i/inspector/apache2/machines/3/lxc-0/deploy/foo',
    state: {
      gui: { inspector: 'apache2', machines: '3/lxc-0', deploy: 'foo'}
    },
    error: null
  }];

  const storeStateTests = [{
    path: 'http://abc.com:123/haproxy',
    state: { store: 'haproxy' },
    error: null
  }, {
    path: 'http://abc.com:123/haproxy/xenial',
    state: { store: 'haproxy/xenial' },
    error: null
  }, {
    path: 'http://abc.com:123/haproxy/42',
    state: { store: 'haproxy/42' },
    error: null
  }, {
    path: 'http://abc.com:123/django/bundle/47',
    state: { store: 'django/bundle/47' },
    error: null
  }];

  const modelStoreStateTests = [{
    path: 'http://abc.com:123/u/hatch/staging/haproxy',
    state: { user: 'hatch/staging', store: 'haproxy' },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/ghost/xenial',
    state: { user: 'frankban/production', store: 'ghost/xenial' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/ghost/42',
    state: { user: 'hatch/staging', store: 'ghost/42' },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/django/bundle/47',
    state: { user: 'frankban/production', store: 'django/bundle/47' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/u/frankban/django',
    state: { user: 'hatch/staging', store: 'u/frankban/django' },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/u/hatch/mongodb/xenial',
    state: { user: 'frankban/production', store: 'u/hatch/mongodb/xenial' },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/u/hatch/mongodb/47',
    state: { user: 'hatch/staging', store: 'u/hatch/mongodb/47' },
    error: null
  }, {
    path:
      'http://abc.com:123/u/frankban/production/u/frankban/django/bundle/0',
    state: {
      user: 'frankban/production', store: 'u/frankban/django/bundle/0' },
    error: null
  }];

  const modelGuiStateTests = [{
    path: 'http://abc.com:123/u/hatch/staging/i/inspector/haproxy/config',
    state: { user: 'hatch/staging', gui: { inspector: 'haproxy/config' } },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/i/machines',
    state: { user: 'frankban/production', gui: { machines: '' } },
    error: null
  }, {
    path:
      'http://abc.com:123/u/hatch/staging/i/applications/inspector/ghost',
    state: {
      user: 'hatch/staging', gui: {applications: '', inspector: 'ghost' }},
    error: null
  }];

  const storeGuiStateTests = [{
    path: 'http://abc.com:123/haproxy/i/inspector/haproxy/config',
    state: { store: 'haproxy', gui: { inspector: 'haproxy/config' } },
    error: null
  }, {
    path: 'http://abc.com:123/ghost/xenial/i/machines',
    state: { store: 'ghost/xenial', gui: { machines: '' } },
    error: null
  }, {
    path: 'http://abc.com:123/ghost/42/i/applications/inspector/ghost',
    state: {
      store: 'ghost/42', gui: { applications: '', inspector: 'ghost' } },
    error: null
  }, {
    path: 'http://abc.com:123/django/bundle/47/i/machines',
    state: { store: 'django/bundle/47', gui: { machines: '' } },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/mongodb/xenial/i/applications/inspector/ghost', // eslint-disable-line max-len
    state: {
      store: 'u/hatch/mongodb/xenial',
      gui: { applications: '', inspector: 'ghost'} },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/django/bundle/0/i/machines',
    state: { store: 'u/frankban/django/bundle/0', gui: { machines: '' } },
    error: null
  }];

  const allStateTests = [{
    path: 'http://abc.com:123/u/hatch/staging/haproxy/i/inspector/haproxy/config', // eslint-disable-line max-len
    state: {
      user: 'hatch/staging',
      store: 'haproxy',
      gui: { inspector: 'haproxy/config' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/ghost/xenial/i/inspector/haproxy/config', // eslint-disable-line max-len
    state: {
      user: 'frankban/production',
      store: 'ghost/xenial',
      gui: { inspector: 'haproxy/config' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/ghost/42/i/inspector/haproxy/config', // eslint-disable-line max-len
    state: {
      user: 'hatch/staging',
      store: 'ghost/42',
      gui: { inspector: 'haproxy/config' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/django/bundle/47/i/machines', // eslint-disable-line max-len
    state: {
      user: 'frankban/production',
      store: 'django/bundle/47',
      gui: { machines: '' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/u/frankban/django/i/applications/inspector/ghost', // eslint-disable-line max-len
    state: {
      user: 'hatch/staging',
      store: 'u/frankban/django',
      gui: { applications: '', inspector: 'ghost' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/u/hatch/mongodb/xenial/i/machines', // eslint-disable-line max-len
    state: {
      user: 'frankban/production',
      store: 'u/hatch/mongodb/xenial',
      gui: { machines: '' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/u/hatch/mongodb/47/i/applications/inspector/ghost', // eslint-disable-line max-len
    state: {
      user: 'hatch/staging',
      store: 'u/hatch/mongodb/47',
      gui: { applications: '', inspector: 'ghost' }
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/u/frankban/django/bundle/0/i/applications', // eslint-disable-line max-len
    state: {
      user: 'frankban/production',
      store: 'u/frankban/django/bundle/0',
      gui: { applications: '' }
    },
    error: null
  }];

  it('can be instantiated', () => {
    const state = new window.jujugui.State({
      baseURL: 'http://abc.com:123',
      seriesList:  ['precise', 'trusty', 'xenial']
    });
    assert.equal(state instanceof window.jujugui.State, true);
  });

  it('throws if no baseURL is provided', () => {
    assert.throws(function() {
      new window.jujugui.State({});
    });
  });

  it('can receive a location value for testing', () => {
    const state = new window.jujugui.State({
      baseURL: 'http://abc.com:123',
      seriesList: ['trusty']
    });
    state.location = {origin: 'foo'};
    assert.equal(state.location.origin, 'foo');
  });

  it('can be instantiated with a location value', () => {
    const state = new window.jujugui.State({
      baseURL: 'http://abc.com:123',
      seriesList: ['trusty'],
      location: {origin: 'foo'}
    });
    assert.equal(state.location.origin, 'foo');
  });

  it('uses the window.location if none is provided', () => {
    const state = new window.jujugui.State({
      baseURL: 'http://abc.com:123',
      seriesList: ['trusty']
    });
    assert.equal(state.location.origin, window.location.origin);
  });

  describe('steriesList', () => {
    it('adds \'bundle\' to the series list', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['trusty']
      });
      assert.deepEqual(state.seriesList, ['trusty', 'bundle']);
    });

    it('throws if the seriesList value is not an array', () => {
      assert.throws(function() {
        new window.jujugui.State({
          baseURL: 'http://abc.com:123',
          seriesList: 'notanarray'
        });
      });
    });

    it('throws no seriesList is provided', () => {
      assert.throws(function() {
        new window.jujugui.State({
          baseURL: 'http://abc.com:123'
        });
      });
    });
  });

  describe('_appStateHistory', () => {
    it('is instantiated with an empty array', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['trusty']
      });
      assert.deepEqual(state._appStateHistory, []);
    });

    it('returns the last record in the history', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['trusty']
      });
      state._appStateHistory.push('step1');
      state._appStateHistory.push('step2');
      state._appStateHistory.push('step3');
      state._appStateHistory.push('step2');
      assert.equal(state.appState, 'step2');
    });
  });

  describe('State._getCleanPath()', () => {
    it('can clean the url', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });
      assert.equal(
        state._getCleanPath('http://abc.com:123/a/b/c/d/'),
        'a/b/c/d');
      assert.equal(
        state._getCleanPath('http://abc.com:123///a/b/c/d/'),
        'a/b/c/d');
      assert.equal(
        state._getCleanPath('http://abc.com:123/a/b/c/d///'),
        'a/b/c/d');
    });
  });

  describe('State._parseRoot()', () => {
    it('populates the root portion of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
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
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
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
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });

      const guiSections = [{
        parts: [],
        state: {},
        error: 'invalid GUI path.'
      }, {
        parts: ['inspector', 'haproxy', 'config'],
        state: { gui: { inspector: 'haproxy/config' } },
        error: null
      }, {
        parts: ['machines'],
        state: { gui: { machines: '' } },
        error: null
      }, {
        parts: ['applications', 'inspector', 'ghost'],
        state: { gui: { applications: '', inspector: 'ghost' } },
        error: null
      }, {
        parts: ['inspector', 'service123', 'relate-to', 'serviceabc'],
        state: { gui: { inspector: 'service123/relate-to/serviceabc' } },
        error: null
      }, {
        parts: [
          'inspector', 'apache2', 'machines', '3', 'lxc-0', 'deploy', 'foo'],
        state: {
          gui: { inspector: 'apache2', machines: '3/lxc-0', deploy: 'foo' }
        },
        error: null
      }];

      guiSections.forEach(section => {
        assert.deepEqual(
          state._parseGUI(section.parts, {}),
          {error: section.error, state: section.state},
          `${section.path} did not properly generate the state object: ` +
          JSON.stringify(section.state));
      });
    });
  });

  describe('State._parseUser()', () => {
    it('populates the user and store portions of the state object', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });

      const userSections = [{
        parts: [],
        state: {},
        error: null,
        outputParts: []
      }, {
        parts: ['u'],
        state: {},
        error: 'invalid user path.',
        outputParts: []
      }, {
        parts: ['ghost', 'u', 'hatch'],
        state: {},
        error: 'invalid user path.',
        outputParts: ['ghost', 'u', 'hatch']
      }, {
        parts: ['u', 'hatch', 'staging', 'foo', 'u', 'hatch', 'ghost'],
        state: {},
        error: 'invalid user path.',
        outputParts: ['u', 'hatch', 'ghost']
      }, {
        parts: ['u', 'hatch', 'staging', 'u', 'hatch'],
        state: {
          user: 'hatch/staging'
        },
        error: 'invalid user store path.',
        outputParts: []
      }, {
        parts: ['u', 'ant'],
        state: { profile: 'ant' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'settings'],
        state: { profile: 'frankban/settings' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'charms'],
        state: { profile: 'frankban/charms' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'issues'],
        state: { profile: 'frankban/issues' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'revenue'],
        state: { profile: 'frankban/revenue' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'hatch', 'staging', 'haproxy'],
        state: { user: 'hatch/staging' },
        error: null,
        outputParts: ['haproxy']
      }, {
        parts: ['u', 'frankban', 'production', 'ghost', 'xenial'],
        state: { user: 'frankban/production' },
        error: null,
        outputParts: ['ghost', 'xenial']
      }, {
        parts: ['u', 'hatch', 'charms', 'ghost', 'xenial'],
        state: { profile: 'hatch/charms' },
        error: null,
        outputParts: ['ghost', 'xenial']
      }, {
        parts: ['u', 'hatch', 'staging', 'ghost', '42'],
        state: { user: 'hatch/staging' },
        error: null,
        outputParts: ['ghost', '42']
      }, {
        parts: ['u', 'hatch', 'mongodb', 'xenial'],
        state: { store: 'u/hatch/mongodb/xenial' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'hatch', 'mongodb', '47'],
        state: { store: 'u/hatch/mongodb/47' },
        error: null,
        outputParts: []
      }, {
        parts: ['u', 'frankban', 'django', 'bundle', '0'],
        state: { store: 'u/frankban/django/bundle/0' },
        error: null,
        outputParts: []
      }, {
      // Multi user delimiter handling.
        parts: ['u', 'hatch', 'staging', 'u', 'frankban', 'django'],
        state: {
          user: 'hatch/staging',
          store: 'u/frankban/django'
        },
        error: null,
        outputParts: []
      }, {
        parts: [
          'u', 'frankban', 'production', 'u', 'hatch', 'mongodb', 'xenial'],
        state: {
          user: 'frankban/production',
          store: 'u/hatch/mongodb/xenial'
        },
        error: null,
        outputParts: []
      }, {
        parts: [
          'u', 'hatch', 'staging', 'u', 'hatch', 'django', 'bundle', '0'],
        state: {
          user: 'hatch/staging',
          store: 'u/hatch/django/bundle/0'
        },
        error: null,
        outputParts: []
      }, {
        parts: [
          'u', 'hatch', 'charms', 'u', 'hatch', 'mongodb', 'xenial'],
        state: {
          profile: 'hatch/charms',
          store: 'u/hatch/mongodb/xenial'
        },
        error: null,
        outputParts: []
      }];

      userSections.forEach(test => {
        assert.deepEqual(
          state._parseUser(test.parts, {}),
          {state: test.state, parts: test.outputParts, error: test.error},
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });
  });

  describe('State.generateState()', () => {
    // Generate all of the test cases for the various states.
    [{
      title: 'builds the proper state for the reserved urls',
      test: rootStateTests
    }, {
      title: 'builds proper state for the user urls',
      test: userStateTests
    }, {
      title: 'builds the proper state for the search urls',
      test: searchStateTests
    }, {
      title: 'builds the proper state for the gui urls',
      test: guiStateTests
    }, {
      title: 'builds proper state for the store urls',
      test: storeStateTests
    }, {
      title: 'builds proper state for model and store urls',
      test: modelStoreStateTests
    }, {
      title: 'builds proper state for model and gui urls',
      test: modelGuiStateTests
    }, {
      title: 'builds proper state for store and gui urls',
      test: storeGuiStateTests
    }, {
      title: 'builds proper state for urls with all sections',
      test: allStateTests
    }].forEach(test => {
      it(test.title, () => {
        const baseURL = 'http://abc.com:123';
        const state = new window.jujugui.State({
          baseURL: baseURL,
          seriesList:  ['precise', 'trusty', 'xenial']
        });
        test.test.forEach(test => {
          assert.deepEqual(
            state.generateState(test.path),
            {error: test.error, state: test.state},
            `${test.path} did not properly generate the state object: ` +
            JSON.stringify(test.state));
        });
      });
    });

    it('correctly returns with an error for invalid urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });

      const badURLS = [{
        path: 'http://abc.com:123/u',
        state: {},
        error: 'cannot parse the User path: invalid user path.'
      }, {
        path: 'http://abc.com:123/u/frankban/u',
        state: {
          profile: 'frankban'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/u/frankban/u/haproxy',
        state: {
          profile: 'frankban'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u',
        state: {
          user: 'hatch/staging'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/hatch',
        state: {
          user: 'hatch/staging'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/u/hatch/staging/u/hatch/ghost/trusty/42/wat',
        state: {
          user: 'hatch/staging'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/u/hatch/staging/hatch/u/wat',
        state: {},
        error: 'cannot parse the User path: invalid user path.'
      }, {
        path:
          'http://abc.com:123/u/frankban/production/u/frankban/i/applications',
        state: {
          gui: {
            applications: ''
          },
          user: 'frankban/production'
        },
        error: 'cannot parse the User path: invalid user store path.'
      }, {
        path: 'http://abc.com:123/about/wat',
        state: {
          root: 'about'
        },
        error: 'invalid root path.'
      }, {
        path: 'http://abc.com:123/no-such/i',
        state: {},
        error: 'cannot parse the GUI path: invalid GUI path.'
      }, {
        path: 'http://abc.com:123/django/bundle/42/wat',
        state: {},
        error: 'invalid store path.'
      }, {
        path: 'http://abc.com:123/ghost/u/frankban/ghost',
        state: {},
        error: 'cannot parse the User path: invalid user path.'
      }];

      badURLS.forEach(test => {
        assert.deepEqual(
          state.generateState(test.path),
          {error: test.error, state: test.state},
          `${test.path} did not properly generate the state object: ` +
          JSON.stringify(test.state));
      });
    });
  });

  describe('State.register()', () => {
    it('stores the supplied dispatchers', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });
      const stub1 = sinon.stub();
      const stub2 = sinon.stub();
      state.register([['*', stub1], ['store', stub2]]);
      assert.deepEqual(state._dispatchers, {
        '*': [stub1],
        store: [stub2]
      });
    });
  });

  describe('State.dispatch()', () => {
    it('passes the current location to generateState', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/hatch/ghost'}
      });
      const stub = sinon.stub(
        state, 'generateState', () => ({ error: null, state: {}}));
      state.dispatch();
      assert.equal(stub.callCount, 1);
      assert.deepEqual(stub.args[0], ['/hatch/ghost']);
    });

    it('updates the _appStateHistory with the new state', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'hatch/ghost'}
      });
      sinon.stub(state,
        'generateState', () => ({ error: null, state: {new: 'state'}}));
      state.dispatch();
      assert.deepEqual(state._appStateHistory, [{new: 'state'}]);
    });

    it('dispatches registered dispatchers in proper order', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'ghost/trusty'}
      });
      let counter = 0;
      let increment = () => counter += 1;
      let execution = {};
      const stub = function(state, next) {
        execution.stub = increment();
        next();
      };
      const stub2 = function(state, next) {
        execution.stub2 = increment();
        next();
      };
      const stub3 = function(state, next) {
        execution.stub3 = increment();
        next();
      };
      state.register([['*', stub], ['store', stub2],['*', stub3]]);
      state.dispatch();
      assert.deepEqual(execution, { stub: 1, stub2: 3, stub3: 2 });
    });
  });

  describe('State.generatePath()', () => {
    // Generate all of the test cases for the various states.
    [{
      title: 'generates proper root paths from state',
      test: rootStateTests
    }, {
      title: 'generates proper user paths from state',
      test: userStateTests
    }, {
      title: 'generates proper search paths from state',
      test: searchStateTests
    }, {
      title: 'generates proper gui paths from state',
      test: guiStateTests
    }, {
      title: 'generates proper store paths from state',
      test: storeStateTests
    }, {
      title: 'generates proper model and store paths from state',
      test: modelStoreStateTests
    }, {
      title: 'generates proper model and gui paths from state',
      test: modelGuiStateTests
    }, {
      title: 'generates proper store and gui paths from state',
      test: storeGuiStateTests
    }, {
      title: 'generates proper all paths from state',
      test: allStateTests
    }].forEach(test => {
      it(test.title, () => {
        const baseURL = 'http://abc.com:123';
        const state = new window.jujugui.State({
          baseURL: baseURL,
          seriesList:  ['precise', 'trusty', 'xenial']
        });
        test.test.forEach(test => {
          state._appStateHistory.push(test.state);
          assert.equal(
            state.generatePath(),
            // Remove baseURL as generatePath method only generates the path.
            test.path.replace(baseURL, ''));
        });
      });
    });
  });

});
