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

  const specialStateTests = [{
    path: 'http://abc.com:123/?deploy-target=cs:ghost-4',
    state: {special: {deployTarget: 'cs:ghost-4'}},
    error: null
  }, {
    path: 'http://abc.com:123/?deploy-target=cs:trusty/kibana-15',
    state: {special: {deployTarget: 'cs:trusty/kibana-15'}},
    error: null
  }];

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
    path: 'http://abc.com:123/',
    state: {},
    error: null
  }, {
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
    state: {
      search: {
        text: 'haproxy'
      }
    },
    error: null
  }, {
    path: 'http://abc.com:123/q/k8s/core',
    state: {
      search: {
        text: 'k8s/core'
      }
    },
    error: null
  }, {
    path: 'http://abc.com:123/q/haproxy/?tags=ops,db&series=yakkety',
    state: {
      search: {
        tags: ['ops', 'db'],
        text: 'haproxy',
        series: 'yakkety'
      }
    },
    error: null
  }, {
    path: 'http://abc.com:123/q/?series=yakkety',
    state: {
      search: {
        series: 'yakkety'
      }
    },
    error: null
  }];

  const guiStateTests = [{
    path: 'http://abc.com:123/i/inspector/haproxy/config',
    state: {
      gui: {
        inspector: {id:'haproxy', activeComponent: 'config', config: true}
      }},
    error: null
  }, {
    path: 'http://abc.com:123/i/machines',
    state: {gui: {machines: '' }},
    error: null
  }, {
    path: 'http://abc.com:123/i/applications/inspector/ghost',
    state: {gui: {applications: '', inspector: {id:'ghost'}}},
    error: null
  }, {
    path:
      'http://abc.com:123/i/inspector/apache2/machines/3/lxc-0/deploy/foo',
    state: {
      gui: { inspector: {id: 'apache2'}, machines: '3/lxc-0', deploy: 'foo'}
    },
    error: null
  }, {
    path: 'http://abc.com:123/i/inspector/kibana/unit/0',
    state: {
      gui: {inspector: {id: 'kibana', activeComponent: 'unit', 'unit': '0'}}
    },
    error: null
  }, {
    path: 'http://abc.com:123/i/inspector/local/new',
    state: {
      gui: {inspector: {localType: 'new'}}
    },
    error: null
  }, {
    path: 'http://abc.com:123/i/inspector/local/update',
    state: {
      gui: {inspector: {localType: 'update'}}
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
    state: {
      user: 'hatch/staging',
      gui: {
        inspector: {id: 'haproxy', activeComponent: 'config', config: true }
      }},
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/i/machines',
    state: { user: 'frankban/production', gui: { machines: '' } },
    error: null
  }, {
    path:
      'http://abc.com:123/u/hatch/staging/i/applications/inspector/ghost',
    state: {
      user: 'hatch/staging', gui: {applications: '', inspector: {id:'ghost' }}},
    error: null
  }];

  const storeGuiStateTests = [{
    path: 'http://abc.com:123/haproxy/i/inspector/haproxy/config',
    state: {
      store: 'haproxy',
      gui: {
        inspector: {id: 'haproxy', activeComponent: 'config', config: true }
      }},
    error: null
  }, {
    path: 'http://abc.com:123/ghost/xenial/i/machines',
    state: { store: 'ghost/xenial', gui: { machines: '' } },
    error: null
  }, {
    path: 'http://abc.com:123/ghost/42/i/applications/inspector/ghost',
    state: {
      store: 'ghost/42', gui: {applications: '', inspector: {id: 'ghost'}}},
    error: null
  }, {
    path: 'http://abc.com:123/django/bundle/47/i/machines',
    state: { store: 'django/bundle/47', gui: { machines: '' } },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/mongodb/xenial/i/applications/inspector/ghost', // eslint-disable-line max-len
    state: {
      store: 'u/hatch/mongodb/xenial',
      gui: {applications: '', inspector: {id: 'ghost'}}},
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
      gui: {inspector: {id: 'haproxy', activeComponent: 'config', config: true}}
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/frankban/production/ghost/xenial/i/inspector/haproxy/config', // eslint-disable-line max-len
    state: {
      user: 'frankban/production',
      store: 'ghost/xenial',
      gui: {inspector: {id: 'haproxy', activeComponent: 'config', config: true}}
    },
    error: null
  }, {
    path: 'http://abc.com:123/u/hatch/staging/ghost/42/i/inspector/haproxy/config', // eslint-disable-line max-len
    state: {
      user: 'hatch/staging',
      store: 'ghost/42',
      gui: {inspector: {id: 'haproxy', activeComponent: 'config', config: true}}
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
      gui: {applications: '', inspector: {id: 'ghost'}}
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
      gui: {applications: '', inspector: {id: 'ghost'}}
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
      assert.equal(state.current, 'step2');
    });

    it('returns the previous record in the history', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['trusty']
      });
      state._appStateHistory.push('step1');
      state._appStateHistory.push('step2');
      state._appStateHistory.push('step3');
      state._appStateHistory.push('step2');
      assert.equal(state.previous, 'step3');
    });

    it('has a public accessor', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['trusty']
      });
      state._appStateHistory.push('step1');
      state._appStateHistory.push('step2');
      assert.deepEqual(state.history, ['step1', 'step2']);
    });
  });

  describe('State._processURL()', () => {
    it('correctly processes urls', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });
      assert.deepEqual(
        state._processURL('http://abc.com:123/a/b/c/d/'),
        {parts: ['a', 'b', 'c', 'd']});
      assert.deepEqual(
        state._processURL('http://abc.com:123///a/b/c/d/'),
        {parts: ['a', 'b', 'c', 'd']});
      assert.deepEqual(
        state._processURL('http://abc.com:123/a/b/c/d///'),
        {parts: ['a', 'b', 'c', 'd']});
      assert.deepEqual(
        state._processURL('http://abc.com:123/?deploy-target=cs:ceph45'),
        {query: {'deploy-target': 'cs:ceph45'}});
      assert.deepEqual(
        state._processURL('http://abc.com:123/?deploy-target=cs:trusty/ceph45'),
        {query: {'deploy-target': 'cs:trusty/ceph45'}});
      assert.deepEqual(
        state._processURL(
          'http://abc.com:123/a/b/c/?deploy-target=cs:trusty/ceph45'),
        {parts: ['a', 'b', 'c'], query: {'deploy-target': 'cs:trusty/ceph45'}});
    });
  });

  describe('State._parseSpecial()', () => {
    it('extracts the deploy-target from the query string', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['precise', 'trusty', 'xenial']
      });
      const pushStub = sinon.stub(state, '_pushState');
      const st = state._parseSpecial({'deploy-target': 'cs:ghost-4'}, {});
      assert.deepEqual(st, {special: {deployTarget: 'cs:ghost-4'}});
      assert.strictEqual(pushStub.callCount, 1);
    });

    it('does not pushState if allowStateModifications is false', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['precise', 'trusty', 'xenial']
      });
      const pushStub = sinon.stub(state, '_pushState');
      const st = state._parseSpecial({
        'deploy-target': 'cs:ghost-4'}, {}, false);
      assert.deepEqual(st, {special: {deployTarget: 'cs:ghost-4'}});
      assert.strictEqual(pushStub.callCount, 0);
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
      assert.deepEqual(state._parseSearch([], {}, {}), {});
      assert.deepEqual(
        state._parseSearch(['k8s', 'core'], {}, {}), {
          search: {
            text: 'k8s/core'
          }
        });
    });

    it('handles query parameters', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });
      assert.deepEqual(state._parseSearch([], {}, {}),{});
      assert.deepEqual(
        state._parseSearch(
          ['k8s', 'core'], {tags: 'ops,db', series: 'yakkety'}, {}), {
            search: {
              series: 'yakkety',
              tags: ['ops', 'db'],
              text: 'k8s/core'
            }
          });
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
        state: {
          gui: {
            inspector: {id: 'haproxy', activeComponent: 'config', config: true}
          }},
        error: null
      }, {
        parts: ['machines'],
        state: {gui: {machines: ''}},
        error: null
      }, {
        parts: ['applications', 'inspector', 'ghost'],
        state: {gui: {applications: '', inspector: {id: 'ghost'}}},
        error: null
      }, {
        parts: ['inspector', 'service123', 'relate-to', 'serviceabc'],
        state: {
          gui: {
            inspector: {
              id: 'service123',
              activeComponent: 'relate-to',
              'relate-to': 'serviceabc'
            }}},
        error: null
      }, {
        parts: [
          'inspector', 'apache2', 'machines', '3', 'lxc-0', 'deploy', 'foo'],
        state: {
          gui: {
            inspector: {id: 'apache2'}, machines: '3/lxc-0', deploy: 'foo'
          }
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
      title: 'builds proper state for the special urls',
      test: specialStateTests
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
        sinon.stub(state, '_pushState');
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

    it('works with store as the root, but not other ROOT_RESERVED', () => {
      const ROOT_RESERVED = [
        'about', 'bigdata', 'docs', 'juju', 'login', 'logout', 'new', 'store'];

      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });

      const tests = ROOT_RESERVED.map(root => {
        return {
          path: `http://abc.com:123/${root}/u/lukewh/cheese`,
          state: {
            root: root
          },
          error: root === 'store' ? null : 'invalid root path.'
        };
      });

      tests.forEach(test => {
        assert.deepEqual(
          state.generateState(test.path),
          {error: test.error, state: test.state}
        );
      });
    });

    it('can disable state modifications for parse special', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial']
      });
      state._parseSpecial = sinon.stub().returns({});
      state.generateState(
        'http://abc.com:123/new?deploy-target=cs:trusty/kibana-15', false);
      assert.deepEqual(state._parseSpecial.args[0], [{
        'deploy-target': 'cs:trusty/kibana-15'
      }, {}, false]);
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
      const stub3 = sinon.stub();
      const stub4 = sinon.stub();
      const stub5 = sinon.stub();
      state.register([
        ['*', stub1],
        ['*', stub5],
        ['store', stub2],
        // dispatchers with cleanup argument.
        ['machine', stub3, stub4]
      ]);
      assert.deepEqual(state._dispatchers, {
        '*': [[stub1, undefined], [stub5, undefined]],
        store: [[stub2, undefined]],
        machine: [[stub3, stub4]]
      });
    });
  });

  describe('State.bootstrap()', () => {
    it('calls dispatch with the proper values', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['precise', 'trusty', 'xenial'],
        location: {href: '/hatch/ghost'}
      });
      const dispatch = sinon.stub(state, 'dispatch');
      state.bootstrap();
      assert.equal(dispatch.callCount, 1);
      assert.deepEqual(dispatch.args[0], [[], true, false, true]);
    });
  });

  describe('State.dispatch()', () => {
    it('dispatches from the current state not the url by default', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList: ['precise', 'trusty', 'xenial'],
        location: {href: '/hatch/ghost'}
      });
      // Set the state to something different than the location to prove where
      // we're dispatching from. In the real case this should never happen
      // because every time state is updated the URL is as well, even if we
      // no longer read from it all the time.
      state._appStateHistory.push({
        gui: {inspector: {id: 'haproxy'}}
      });
      const generateState = sinon.stub(state, 'generateState');
      const dispatchStub = sinon.stub(state, '_dispatch');
      state.dispatch();
      assert.equal(generateState.callCount, 0);
      assert.equal(dispatchStub.callCount, 2);
      assert.equal(dispatchStub.args[1][1], 'gui.inspector.id');
    });

    it('passes the current location to generateState', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/hatch/ghost'}
      });
      const stub = sinon.stub(
        state, 'generateState', () => ({ error: null, state: {}}));
      state.dispatch([], true, false, true);
      assert.equal(stub.callCount, 1);
      assert.deepEqual(stub.args[0], ['/hatch/ghost', true]);
    });

    it('updates the _appStateHistory with the new state', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'hatch/ghost'}
      });
      sinon.stub(state,
        'generateState', () => ({ error: null, state: {new: 'state'}}));
      state.dispatch([], true, false, true);
      assert.deepEqual(state._appStateHistory, [{new: 'state'}]);
    });

    it('properly extracts complex states', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'hatch/ghost'}
      });
      const currentState = {
        gui: {
          deploy: '',
          inspector: { id: '$foo'}}};
      sinon.stub(state,
        'generateState', () => ({
          error: null,
          state: currentState}));
      const dispatch = sinon.stub(state, '_dispatch');
      state.dispatch([], true, false, true);
      assert.deepEqual(dispatch.args[1], [currentState, 'gui.deploy', []]);
      assert.deepEqual(
        dispatch.args[2], [currentState, 'gui.inspector.id', []]);
    });

    it('dispatches registered dispatchers in proper order', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'ghost/trusty/i/machines'}
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
      const stub4 = function(state, next) {
        execution.stub4 = increment();
        next();
      };
      state.register([
        ['*', stub],
        ['store', stub2],
        ['*', stub3],
        ['gui.machines', stub4]
      ]);
      state.dispatch([], true, false, true);
      assert.deepEqual(execution, {stub: 1, stub2: 4, stub3: 2, stub4: 3});
    });

    it('dispatches registered cleanup dispatchers in proper order', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: 'ghost/trusty/i/machines'}
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
      const stub4 = function(state, next) {
        execution.stub4 = increment();
        next();
      };
      const stub5 = function(state, next) {
        execution.stub5 = increment();
        next();
      };
      const stub6 = function(state, next) {
        execution.stub6 = increment();
        next();
      };
      state.register([
        ['*', stub],
        ['store', stub2, stub5],
        ['*', stub3],
        ['gui.machines', stub4, stub6]
      ]);
      state.dispatch(['store', 'gui.machines'], true, false, true);
      assert.deepEqual(execution, {
        stub5: 1, stub6: 2, stub: 3, stub3: 4, stub4: 5, stub2: 6});
    });

    it('finds and executes parent dispatchers', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/i/inspector/apache/unit/0'}
      });
      const stub1 = sinon.stub();
      state.register([
        ['*', sinon.stub()],
        ['gui.inspector', stub1]
      ]);
      state.dispatch([], true, false, true);
      assert.equal(stub1.callCount, 1);
    });

    it('can handle dispatching when back is called', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/i/machines'}
      });
      const storeCleanup = sinon.stub();
      const machinesCleanup = sinon.stub();
      state.register([
        ['store', sinon.stub(), storeCleanup],
        ['gui.machines', sinon.stub(), machinesCleanup]
      ]);
      // The initial dispatch will be to the machine view.
      state.dispatch([], true, false, true);
      // Now simulate viewing a charm.
      state.location.href = '/apache2';
      state.dispatch([], true, false, true);
      // Dispatch again, but this time simulate going back to machines.
      state.location.href = '/i/machines';
      state.dispatch([], true, true, true);
      // The history appends the new state, even though in the browser we went
      // back.
      assert.deepEqual(state._appStateHistory, [
        {gui: {machines: ''}}, {store: 'apache2'}, {gui: {machines: ''}}]);
      // The store should have been cleaned up as it was not required when we
      // went back to the machine view.
      assert.equal(storeCleanup.callCount, 1);
      assert.equal(machinesCleanup.callCount, 0);
    });
  });

  describe('State.changeState()', () => {
    it('can update state', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/u/hatch/staging/i/applications/inspector/ghost'}
      });
      const pushStub = sinon.stub(state, '_pushState');
      state.dispatch([], true, false, true);
      assert.deepEqual(
        state.current, {
          user: 'hatch/staging',
          gui: {applications: '', inspector: {id: 'ghost' }}
        },
        'generateState() did not parse location properly');
      const dispatchStub = sinon.stub(state, 'dispatch').returns({error: null});
      state.changeState({
        gui: {
          applications: 'foo'
        }
      });
      assert.deepEqual(state._appStateHistory, [{
        user: 'hatch/staging',
        gui: {applications: '', inspector: {id: 'ghost' }}
      }, {
        user: 'hatch/staging',
        gui: {applications: 'foo', inspector: {id: 'ghost' }}
      }]);
      assert.equal(pushStub.callCount, 1);
      assert.equal(dispatchStub.callCount, 1);
    });

    it('prunes null values when removing states', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/u/hatch/staging/i/applications/inspector/ghost'}
      });
      const pushStub = sinon.stub(state, '_pushState');
      state.dispatch([], true, false, true);
      assert.deepEqual(
        state.current, {
          user: 'hatch/staging',
          gui: {applications: '', inspector: {id: 'ghost' }}
        },
        'generateState() did not parse location properly');
      const dispatchStub = sinon.stub(state, 'dispatch').returns({error: null});
      state.changeState({
        gui: {
          applications: null
        }
      });
      assert.deepEqual(state._appStateHistory, [{
        user: 'hatch/staging',
        gui: {applications: '', inspector: {id: 'ghost'}}
      }, {
        user: 'hatch/staging',
        gui: {inspector: {id: 'ghost'}}
      }]);
      assert.equal(pushStub.callCount, 1);
      assert.equal(dispatchStub.callCount, 1);
    });

    it('calls dispatch with the key paths that were pruned', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/u/hatch/staging/i/applications/inspector/ghost'}
      });
      const pushStub = sinon.stub(state, '_pushState');
      state.dispatch();
      const dispatchStub = sinon.stub(state, 'dispatch').returns({error: null});
      state.changeState({
        gui: {
          inspector: null,
          applications: null
        }
      });
      assert.equal(pushStub.callCount, 1);
      assert.equal(dispatchStub.callCount, 1);
      assert.deepEqual(dispatchStub.args[0],
        [['gui.inspector', 'gui.applications'], false]);
    });

    it('calls dispatch with the key paths that were pruned #2', () => {
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/i/machines'}
      });
      const pushStub = sinon.stub(state, '_pushState');
      state.dispatch();
      const dispatchStub = sinon.stub(state, 'dispatch').returns({error: null});
      state.changeState({
        root: 'store',
        gui: {
          machines: null
        }
      });
      assert.equal(pushStub.callCount, 1);
      assert.equal(dispatchStub.callCount, 1);
      assert.deepEqual(dispatchStub.args[0], [['gui.machines'], false]);
    });
  });

  describe('State.pushState()', () => {
    it('pushes state to history', () => {
      const historyStub = {
        pushState: sinon.stub()
      };
      const state = new window.jujugui.State({
        baseURL: 'http://abc.com:123',
        seriesList:  ['precise', 'trusty', 'xenial'],
        location: {href: '/u/hatch/staging'},
        browserHistory: historyStub
      });
      state.dispatch([], true, false, true);
      state._pushState();
      assert.deepEqual(historyStub.pushState.args[0], [
        {}, 'Juju GUI', 'http://abc.com:123/u/hatch/staging']);
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
          assert.equal(state.generatePath(), test.path);
        });
      });
    });
  });

});
