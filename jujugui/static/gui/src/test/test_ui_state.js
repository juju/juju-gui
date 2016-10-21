/**
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

describe('UI State object', function() {
  var Y, ns, state, testUtils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-tests-utils',
        'juju-app-state',
        'querystring',
        function(Y) {
          ns = Y.namespace('juju.models');
          testUtils = Y['juju-tests'].utils;
          done();
        });
  });

  beforeEach(function() {
    state = new ns.UIState();
  });

  afterEach(function() {
    state.destroy();
  });

  describe('_stripViewmode', function() {
    var paths = {
      'sidebar': '',
      'fullscreen': '',
      'fullscreen/precise/mysql-38': 'precise/mysql-38',
      'sidebar/precise/mysql-38': 'precise/mysql-38'
    };
    it('strips the viewmode from requested urls', function() {
      Object.keys(paths).forEach(function(key) {
        assert.equal(
            state._stripViewmode(key),
            paths[key],
            key + ' did not have it\'s viewmode properly stripped');
      });
    });
  });

  describe('_splitIntoComponents', function() {
    var urls = {
      'inspector/service123/charm': ['inspector/service123/charm'],
      'machine/3/lxc-0/inspector/apache2': [
        'machine/3/lxc-0', 'inspector/apache2'],
      'inspector/apache2/machine/3/lxc-0': [
        'inspector/apache2', 'machine/3/lxc-0'],
      'bundle/hadoop/3/demo': ['bundle/hadoop/3/demo'],
      'precise/apache2-13': ['precise/apache2-13'],
      'precise/apache2-13/machine/3/lxc-0': [
        'precise/apache2-13', 'machine/3/lxc-0'],
      'precise/apache2-13/machine/3/lxc-0/deploy/summary': [
        'precise/apache2-13', 'machine/3/lxc-0', 'deploy/summary'],
      'precise/apache2-13/machine/3/lxc-0/inspector/service123/charm': [
        'precise/apache2-13', 'machine/3/lxc-0', 'inspector/service123/charm']
    };
    it('splits the url into the required sections', function() {
      Object.keys(urls).forEach(function(key) {
        assert.deepEqual(
            state._splitIntoComponents(key),
            urls[key],
            key + ' did not split correctly');
      });
    });
  });

  describe('saveState', function() {
    it('moves the current state to the previous state', function() {
      var newState = { sectionA: {}, sectionB: {} };
      assert.deepEqual(state.get('previous'), {});
      assert.deepEqual(state.get('current'), {});
      var dispatchStub = testUtils.makeStubMethod(state, 'dispatch');
      this._cleanups.push(dispatchStub.reset);
      state.saveState(newState, true);
      assert.deepEqual(state.get('previous'), {});
      assert.deepEqual(state.get('current'), newState);
      assert.equal(dispatchStub.calledOnce, true);
      assert.deepEqual(dispatchStub.lastCall.args[0], newState);
    });
  });

  describe('dispatching', function() {
    describe('dispatch', function() {

      it('empties sections when components change', function() {
        var newState = {
          sectionA: {
            component: 'charmbrowser'
          }, sectionB: {}
        };
        // Make sure that the defaults are set properly.
        assert.deepEqual(state.get('previous'), {});
        assert.deepEqual(state.get('current'), {});
        // Fake out that the current state changed.
        state.set('current', newState);
        var emptyStub = testUtils.makeStubMethod(state, '_emptySection');
        this._cleanups.push(emptyStub.reset);
        var dispatchSectionStub = testUtils.makeStubMethod(
            state, '_dispatchSection');
        this._cleanups.push(dispatchSectionStub.reset);
        // Also calls hasChanged() internally but not stubbing to make it a
        // bit of an integration test.
        state.dispatch(newState);
        // It shouldn't empty the section if the component didn't change.
        assert.equal(emptyStub.callCount, 0);
        assert.equal(dispatchSectionStub.callCount, 2);
      });

      it('leaves sections when components don\'t change', function() {
        var newState = { sectionA: {}, sectionB: {} };
        // Make sure that the defaults are set properly.
        assert.deepEqual(state.get('previous'), {});
        assert.deepEqual(state.get('current'), {});
        var emptyStub = testUtils.makeStubMethod(state, '_emptySection');
        this._cleanups.push(emptyStub.reset);
        var dispatchSectionStub = testUtils.makeStubMethod(
            state, '_dispatchSection');
        this._cleanups.push(dispatchSectionStub.reset);
        // Also calls hasChanged() internally but not stubbing to make it a
        // bit of an integration test.
        state.dispatch(newState);
        assert.equal(emptyStub.callCount, 0);
        assert.equal(dispatchSectionStub.callCount, 2);
      });
    });

    describe('dispatchers', function() {
      var dispatchers;

      beforeEach(function() {
        dispatchers = {
          app: {
            deployTarget: sinon.stub()
          },
          sectionA: {
            charmbrowser: sinon.stub(),
            empty: sinon.stub()
          },
          sectionB: {
            machine: sinon.stub(),
            empty: sinon.stub()
          }
        };
        state.set('dispatchers', dispatchers);
      });

      it('_dispatchSection: calls registered sectionA dispatcher', function() {
        var newState = {
          component: 'charmbrowser',
          metadata: 'foo'
        };
        state._dispatchSection('sectionA', newState);
        var charmbrowser = dispatchers.sectionA.charmbrowser;
        assert.equal(charmbrowser.calledOnce, true);
        assert.equal(charmbrowser.lastCall.args[0], newState.metadata);
      });

      it('clears its flash storage after dispatch', function() {
        var newState = {
          sectionA: {
            component: 'charmbrowser',
            metadata: {}
          },
          sectionB: {},
          sectionC: {}
        };
        state.set('flash', {foo: 'bar'});
        state.dispatch(newState);
        assert.deepEqual(undefined, state.get('flash'));
      });

      it('_dispatchSection: calls registered sectionB dispatcher', function() {
        var newState = {
          component: 'machine',
          metadata: 'foo'
        };
        state._dispatchSection('sectionB', newState);
        var machine = dispatchers.sectionB.machine;
        assert.equal(machine.calledOnce, true);
        assert.equal(machine.lastCall.args[0], newState.metadata);
      });

      it('_dispatchSection: calls registered app dispatchers', function() {
        var newState = {
          deployTarget: 'bundle:foo/4/bar'
        };
        state._dispatchSection('app', newState);
        var deployTarget = dispatchers.app.deployTarget;
        assert.equal(deployTarget.callCount, 1);
        assert.equal(deployTarget.lastCall.args[0], 'bundle:foo/4/bar');
      });

      it('_emptySection: calls registered empty dispatcher', function() {
        state._emptySection('sectionA');
        assert.equal(dispatchers.sectionA.empty.calledOnce, true);
        state._emptySection('sectionB');
        assert.equal(dispatchers.sectionB.empty.calledOnce, true);
      });

    });
  });

  describe('url part parsing', function() {
    describe('_parseInspectorUrl', function() {
      var flash = {
        file: 'foo',
        services: ['bar', 'baz']
      };

      var parts = {
        'inspector': undefined,
        'inspector/service123': {
          id: 'service123',
          flash: flash
        },
        'inspector/service123/charm': {
          activeComponent: 'charm',
          id: 'service123',
          charm: true,
          flash: flash
        },
        'inspector/service123/unit/13': {
          activeComponent: 'unit',
          id: 'service123',
          unit: '13',
          flash: flash
        },
        'inspector/local/new': {
          localType: 'new',
          flash: flash
        },
        'inspector/local/upgrade': {
          localType: 'upgrade',
          flash: flash
        },
        'inspector/service123/relation/0': {
          activeComponent: 'relation',
          id: 'service123',
          relation: '0',
          flash: flash
        },
        'inspector/service123/relations': {
          activeComponent: 'relations',
          id: 'service123',
          relations: true,
          flash: flash
        },
        'inspector/service123/relate-to': {
          activeComponent: 'relate-to',
          'relate-to': true,
          id: 'service123',
          flash: flash
        },
        'inspector/service123/relate-to/serviceabc': {
          activeComponent: 'relate-to',
          'relate-to': 'serviceabc',
          id: 'service123',
          flash: flash
        }
      };

      it('can parse the inspector url parts', function() {
        state.set('flash', flash);
        Object.keys(parts).forEach(function(key) {
          assert.deepEqual(
              state._parseInspectorUrl(key),
              parts[key],
              key + ' did not parse correctly');
        });
      });

      it('handle hashes for charm details', function() {
        var data = state._parseInspectorUrl(
            'inspector/service123/charm', '#code');
        assert.deepEqual(
            data,
            { id: 'service123', charm: true, hash: '#code',
              activeComponent: 'charm', flash: {} });
      });
    });

    describe('_parseMachineUrl', function() {
      var parts = {
        'machine': { },
        'machine/3': {
          id: '3' },
        'machine/3/lxc-0': {
          id: '3',
          container: 'lxc-0' }
      };

      it('can parse the machine url parts', function() {
        Object.keys(parts).forEach(function(key) {
          assert.deepEqual(
              state._parseMachineUrl(key),
              parts[key],
              key + ' did not parse correctly');
        });
      });
    });
    describe('_parseDeployUrl', function() {
      var parts = {
        'deploy': { },
        'deploy/summary': {
          activeComponent: 'summary' }
      };

      it('can parse the deploy url parts', function() {
        Object.keys(parts).forEach(function(key) {
          assert.deepEqual(
              state._parseDeployUrl(key),
              parts[key],
              key + ' did not parse correctly');
        });
      });
    });

    describe('_parseCharmUrl', function() {
      var parts = {
        'precise/mysql-38': {
          id: 'precise/mysql-38' },
        'bundle/~charmers/mediawiki/6/single': {
          id: 'bundle/~charmers/mediawiki/6/single' }
      };

      it('can parse the charm url parts', function() {
        Object.keys(parts).forEach(function(key) {
          assert.deepEqual(
              state._parseCharmUrl(key),
              parts[key],
              key + ' did not parse correctly');
        });
      });

      it('adds the hash to the state if provided', function() {
        assert.deepEqual(
          state._parseCharmUrl('precise/mysql-38', 'foo'),
          {
            id: 'precise/mysql-38',
            hash: 'foo' });
      });

      it('does not parse "login" or "logout" as charms', function() {
        var result;
        result = state._parseCharmUrl('login');
        assert.deepEqual(result, {});

        result = state._parseCharmUrl('logout');
        assert.deepEqual(result, {});
      });
    });
  });

  describe('parseRequest', function() {
    var urls = {
      // Old viewmode urls.
      '/sidebar/': { sectionA: {}, sectionB: {}, sectionC: {} },
      '/fullscreen/': { sectionA: {}, sectionB: {}, sectionC: {} },
      // Bundle urls.
      '/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }
      },
      '/bundle/mediawiki/6/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/mediawiki/6/single' }
        }
      },
      '/bundle/mediawiki/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/mediawiki/single' }
        }
      },
      '/bundle/~jorge/mediawiki/6/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/6/single' }
        }
      },
      '/bundle/~jorge/mediawiki/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/single' }
        }
      },
      '/fullscreen/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }
      },
      '/sidebar/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }
      },
      // Charm urls.
      '/precise/mysql-38/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }
      },
      '/precise/mysql': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql' }
        }
      },
      '/fullscreen/precise/mysql-38/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }
      },
      '/sidebar/precise/mysql-38/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }
      },
      // Non promoted charm urls.
      '/~prismakov/trusty/cf-dea-1/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }
      },
      '/~prismakov/trusty/cf-dea/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea' }
        }
      },
      '/fullscreen/~prismakov/trusty/cf-dea-1/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }
      },
      '/sidebar/~prismakov/trusty/cf-dea-1/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }
      },
      // Search urls.
      // search is an old route path so ignore it if there isn't a query param.
      '/search/': { sectionA: {}, sectionB: {}, sectionC: {} },
      '?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache'
          }
        }
      },
      // Deploy Target urls.
      '/?deploy-target=bundle:foo/5/bar': {
        app: {
          deployTarget: 'bundle:foo/5/bar'
        },
        sectionA: {}, sectionB: {}, sectionC: {}
      },
      '/?search=apache&deploy-target=bundle:foo/5/bar': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache'
          }
        },
        app: {
          deployTarget: 'bundle:foo/5/bar'
        }
      },
      '/machine/?deploy-target=bundle:foo/5/bar': {
        app: {
          deployTarget: 'bundle:foo/5/bar'
        },
        sectionA: {},
        sectionB: {
          component: 'machine'
        }, sectionC: {}
      },
      // Charm search urls.
      '/search/precise/cassandra-1/': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/cassandra-1' }
        }
      },
      '/search/precise/apache2-19/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache'
          }
        }
      },
      '/fullscreen/search/precise/apache2-19/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache'
          }
        }
      },
      '/sidebar/search/precise/apache2-19/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache' }
        }
      },
      // Bundle search urls.
      '/search/bundle/~charmers/mediawiki/6/single/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache' }
        }
      },
      '/fullscreen/search/bundle/~charmers/mediawiki/6/single/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache' }
        }
      },
      '/sidebar/search/bundle/~charmers/mediawiki/6/single/?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache' }
        }
      },
      // Inspector urls.
      '/inspector/service123': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            flash: {}
          }
        }, sectionB: {}, sectionC: {}
      },
      '/inspector/service123/charm': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            activeComponent: 'charm',
            charm: true,
            flash: {}
          }
        }, sectionB: {}, sectionC: {}
      },
      '/inspector/service123/unit/13': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            activeComponent: 'unit',
            unit: '13',
            flash: {}
          }
        }, sectionB: {}, sectionC: {}
      },
      // Machine view urls.
      '/machine/': {
        sectionA: {},
        sectionB: {
          component: 'machine'
        }, sectionC: {}
      },
      '/machine/3/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {}
      },
      '/machine/3/lxc-0/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        }, sectionC: {}
      },
      '/machine/3/?search=hadoop': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop'
          }
        }
      },
      '/machine/3/?search=hadoop&tags=misc': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            tags: 'misc'
          }
        }
      },
      '/machine/3/?search&tags=misc': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            tags: 'misc'
          }
        }
      },
      '/machine/3/?search=hadoop&type=bundle': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            type: 'bundle'
          }
        }
      },
      '/machine/3/?search&type=charm': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            type: 'charm'
          }
        }
      },
      '/machine/3/?search=hadoop&sort=-name': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            sort: '-name'
          }
        }
      },
      '/machine/3/?search&sort=-name': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            sort: '-name'
          }
        }
      },
      '/machine/3/?search=hadoop&series=wily': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            series: 'wily'
          }
        }
      },
      '/machine/3/?search&series=wily': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            series: 'wily'
          }
        }
      },
      '/machine/3/?search=hadoop&provides=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            provides: 'http'
          }
        }
      },
      '/machine/3/?search&provides=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            provides: 'http'
          }
        }
      },
      '/machine/3/?search=hadoop&requires=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            requires: 'http'
          }
        }
      },
      '/machine/3/?search&requires=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            requires: 'http'
          }
        }
      },
      '/machine/3/?search=hadoop&owner=charmers': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            owner: 'charmers'
          }
        }
      },
      '/machine/3/?search&owner=charmers': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }, sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: '',
            owner: 'charmers'
          }
        }
      },
      // Deployment flow urls.
      '/deploy/': {
        sectionA: {},
        sectionB: {},
        sectionC: {
          component: 'deploy'
        },
      },
      '/deploy/summary/': {
        sectionA: {},
        sectionB: {},
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'summary'
          }
        },
      },
      // Multi section urls.
      '/inspector/apache2/machine/3/lxc-0/deploy/foo': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'apache2',
            flash: {}
          }
        },
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        },
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'foo'
          }
        }
      },
      '/inspector/apache2/machine/3/lxc-0/deploy/foo/?search=spinach': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'apache2',
            flash: {}
          }
        },
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'spinach'
          }
        }
      },
      '/machine/3/lxc-0/inspector/apache2': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'apache2',
            flash: {}
          }
        },
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        }, sectionC: {}
      },
      '/profile': {
        sectionA: {},
        sectionB: {
          component: 'profile'
        },
        sectionC: {}
      },
      '/machine/profile': {
        sectionA: {},
        sectionB: {
          component: 'profile'
        },
        sectionC: {}
      },
      '/inspector/profile': {
        sectionA: {
          component: 'inspector'
        },
        sectionB: {
          component: 'profile'
        },
        sectionC: {}
      },
      '/inspector/apache2/machine/profile': {
        sectionA: {
          component: 'inspector',
          metadata: {
            flash: {},
            id: 'apache2'
          }
        },
        sectionB: {
          component: 'profile'
        },
        sectionC: {}
      },
      '/applications/machine/profile': {
        sectionA: {
          component: 'applications'
        },
        sectionB: {
          component: 'profile'
        },
        sectionC: {}
      },
      '/account': {
        sectionA: {},
        sectionB: {
          component: 'account'
        },
        sectionC: {}
      },
      '/machine/account': {
        sectionA: {},
        sectionB: {
          component: 'account'
        },
        sectionC: {}
      },
      '/inspector/account': {
        sectionA: {
          component: 'inspector'
        },
        sectionB: {
          component: 'account'
        },
        sectionC: {}
      },
      '/inspector/apache2/machine/account': {
        sectionA: {
          component: 'inspector',
          metadata: {
            flash: {},
            id: 'apache2'
          }
        },
        sectionB: {
          component: 'account'
        },
        sectionC: {}
      },
      '/applications/machine/account': {
        sectionA: {
          component: 'applications'
        },
        sectionB: {
          component: 'account'
        },
        sectionC: {}
      },
      'login': {
        app: {
          component: 'login'
        },
        sectionA: {},
        sectionB: {},
        sectionC: {}
      },
      // Invalid urls with overriding components
      '/inspector?search=hadoop': {
        sectionA: {
          component: 'inspector'
        },
        sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop'
          }
        }
      }
    };

    // parseRequest expects a Y.Router request object. Instead of hacking an
    // instance of Y.Router which would rely on private methods that could
    // change on a whim this function simply splits the url up into the
    // two required components. It is tested below separately.
    function buildRequest(url) {
      var queryIndex = url.indexOf('?'),
          hashIndex = url.indexOf('#'),
          length = url.length;
      var queryTo, hashTo, req = {};
      if (hashIndex > -1) {
        queryTo = hashIndex - queryIndex - 1;
        req.hash = url.substr(hashIndex + 1, length);
      } else {
        queryTo = length;
      }
      if (queryIndex > -1) {
        hashTo = queryIndex;
        req.query = Y.QueryString.parse(
            url.substr(queryIndex + 1, queryTo || length));
      } else if (hashIndex > -1) {
        hashTo = hashIndex;
      }
      req.pathname = url.substr(0, hashTo || length);
      return req;
    }

    it('can build a simulated Y.Router request object', function() {
      var urls = {
        '/bundle/hadoop/3/demo?text=hadoop#readme': {
          hash: 'readme',
          path: '/bundle/hadoop/3/demo',
          query: { text: 'hadoop' }
        },
        '/machine/3/?text=hadoop': {
          path: '/machine/3/',
          query: { text: 'hadoop' }
        },
        '/machine/3/?text=hadoop&foo=bar': {
          path: '/machine/3/',
          query: { foo: 'bar', text: 'hadoop' }
        },
        '/inspector/service123/charm#relations': {
          hash: 'relations',
          path: '/inspector/service123/charm'
        },
        '/machine/3/lxc-0/inspector/apache2': {
          path: '/machine/3/lxc-0/inspector/apache2'
        }
      };
      Object.keys(urls).forEach(function(key) {
        assert.deepEqual(
            buildRequest(key),
            urls[key],
            key + ' did not parse into a req object correctly');
      });
    });

    it('parses all of the urls properly', function() {
      var loopcount = 0;
      var saveStub = testUtils.makeStubMethod(state, 'saveState');
      this._cleanups.push(saveStub.reset);
      Object.keys(urls).forEach(function(key) {
        var req = buildRequest(key),
            hash;
        if (req.hash) {
          hash = req.hash;
          delete req.hash;
        }
        loopcount += 1;
        assert.deepEqual(
            state.loadRequest(req, hash),
            urls[key],
            key + ' did not parse correctly');
        assert.equal(
            saveStub.callCount,
            loopcount,
            'saveState was not called on every request');
      });
    });

    it('parses urls with a baseUrl', function() {
      var saveStub = testUtils.makeStubMethod(state, 'saveState');
      this._cleanups.push(saveStub.reset);
      state.set('baseUrl', '/foo');
      var req = buildRequest('/foo/precise/mysql-38/');
      var expected = {
        sectionA: {},
        sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }
      };
      var result = state.loadRequest(req);
      assert.deepEqual(result, expected);
    });

    it('sanitizes the hash', function() {
      var hash = 'bws_foo';
      assert.equal(state._sanitizeHash(hash), 'foo');
    });

  });

  describe('generateUrl', function() {
    var defaultState = { sectionA: {}, sectionB: {}, sectionC: {} };
    var stateObj = {};
    var states = [{
      '/': {
        sectionA: {},
        sectionB: {},
        sectionC: {}
      }
    }, {
      '?store': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'store'
          }
        }
      }
    }, {
      '?store=bundle/mediawiki/6/single': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: 'bundle/~charmers/mediawiki/6/single'
          }
        }
      }
    }, {
      '?store=bundle/mediawiki/6/single': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: 'bundle/mediawiki/6/single'
          }
        }
      }
    }, {
      '?store=bundle/~jorge/mediawiki/6/single': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: 'bundle/~jorge/mediawiki/6/single'
          }
        }
      }
    }, {
      '?store=bundle/~jorge/mediawiki/single': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: 'bundle/~jorge/mediawiki/single'
          }
        }
      }
    }, {
      '?store=precise/mysql-38': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: 'precise/mysql-38'
          }
        }
      }
    }, {
      '?store=~prismakov/trusty/cf-dea-1': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: '~prismakov/trusty/cf-dea-1'
          }
        }
      }
    }, {
      '?search=apache': {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache'
          }
        }
      }
    }, {
      '/inspector/service123/': {
        sectionA: {
          component: 'inspector',
          metadata: { id: 'service123' }
        },
        sectionB: {}
      }
    }, {
      '/inspector/service123/charm/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            charm: true
          }
        },
        sectionB: {}
      }
    }, {
      '/inspector/service123/unit/13/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            activeComponent: 'unit',
            id: 'service123',
            unit: '13'
          }
        },
        sectionB: {}
      }
    }, {
      '/inspector/service123/units/uncommitted/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            activeComponent: 'units',
            id: 'service123',
            unitStatus: 'uncommitted'
          }
        },
        sectionB: {}
      }
    }, {
      '/inspector/service123/units/uncommitted/5/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            activeComponent: 'units',
            id: 'service123',
            unitStatus: 'uncommitted',
            unit: 5
          }
        },
        sectionB: {}
      }
    }, {
      // inspector/local urls get data from the state's flash object, as well as
      // the url. The flash attr on metadata is from this state flash object.
      '/inspector/local/new/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            localType: 'new',
            flash: {
              file: 'foo'
            }
          }
        }
      }
    }, {
      '/inspector/local/upgrade/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            localType: 'upgrade',
            flash: {
              file: 'foo',
              services: ['bar', 'baz']
            }
          }
        }
      }
    }, {
      '/machine/': {
        sectionA: {},
        sectionB: {
          component: 'machine'
        }
      }
    }, {
      '/machine/3/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        }
      }
    }, {
      '/machine/3/lxc-0/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&tags=misc': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            tags: 'misc'
          }
        }
      }
    }, {
      '/machine/3?search&tags=misc': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            tags: 'misc'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&type=bundle': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            type: 'bundle'
          }
        }
      }
    }, {
      '/machine/3?search&type=charm': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            type: 'charm'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&sort=-name': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            sort: '-name'
          }
        }
      }
    }, {
      '/machine/3?search&sort=-name': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            sort: '-name'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&series=wily': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            series: 'wily'
          }
        }
      }
    }, {
      '/machine/3?search&series=wily': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            series: 'wily'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&provides=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            provides: 'http'
          }
        }
      }
    }, {
      '/machine/3?search&provides=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            provides: 'http'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&requires=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            requires: 'http'
          }
        }
      }
    }, {
      '/machine/3?search&requires=http': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            requires: 'http'
          }
        }
      }
    }, {
      '/machine/3?search=hadoop&owner=charmers': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'hadoop',
            owner: 'charmers'
          }
        }
      }
    }, {
      '/machine/3?search&owner=charmers': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
        },
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: null,
            owner: 'charmers'
          }
        }
      }
    }, {
      '/inspector/apache2/machine/3/lxc-0/': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'apache2'
          }
        },
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        }
      }
    }];

    it('can generate proper urls from the state object', function() {
      states.forEach(function(record) {
        state.set('current', Y.clone(defaultState));
        Object.keys(record).forEach(function(url) {
          stateObj = record[url];
          assert.equal(
              state.generateUrl(stateObj),
              url,
              'The object ' + JSON.stringify(stateObj) +
                  ' did not generate the proper url');
        });
      });
    });

    it('can generate proper urls with a baseUrl', function() {
      state.set('baseUrl', '/foo');
      var defaultState = {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'precise/apache2'
          }
        }, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache2'
          }
        }};
      var changeState = {
        sectionA: {
          metadata: {
            id: 'precise/juju-gui' }}};
      state.set('current', Y.clone(defaultState));
      assert.equal(
          state.generateUrl(changeState),
          '/foo/inspector/precise/juju-gui?search=apache2',
          'The object ' + JSON.stringify(changeState) +
              ' did not generate the proper url with base url.');
    });

    it('can generate proper urls from non default state objects', function() {
      var defaultState = {
        sectionA: {}, sectionB: {},
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: 'apache2'
          }
        }};
      var changeState = {
        sectionA: {
          component: 'foo'}};
      state.set('current', Y.clone(defaultState));
      assert.equal(
          state.generateUrl(changeState),
          '/foo?search=apache2',
          'The object ' + JSON.stringify(changeState) +
              ' did not generate the proper url');
    });

    it('can reset metadata', function() {
      var defaultState = {
        sectionA: {}, sectionB: {},
        sectionC: {
          metadata: {
            search: 'apache2' }
        }};
      var changeState = {
        sectionC: { metadata: null }
      };
      state.set('current', Y.clone(defaultState));
      assert.equal(
          state.generateUrl(changeState), '/',
          'The object ' + JSON.stringify(changeState) +
              ' did not generate the proper url');
    });

    it('can set flash from metadata', function() {
      var defaultState = {
        sectionA: {
          metadata: {
            search: {
              text: 'apache2'
            }
          }
        },
        sectionB: {}
      };
      var changeState = {
        sectionA: {
          metadata: {
            flash: {
              foo: 'bar'
            }
          }
        }
      };
      state.set('current', Y.clone(defaultState));
      state.generateUrl(changeState);
      assert.deepEqual(state.get('flash'), {foo: 'bar'});
    });
  });
});
