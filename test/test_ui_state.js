
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
  var Y, ns, state, request, testUtils;

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
    // Setup an empty request mock
    request = {
      path: '',
      params: {},
      query: ''
    };
  });

  afterEach(function(done) {
    state.after('destroy', function() { done(); });
    state.destroy();
  });

  describe('Filter for State object', function() {
    var Y, ns, state;

    before(function(done) {
      Y = YUI(GlobalConfig).use(
          'juju-app-state',
          function(Y) {
            ns = Y.namespace('juju.models');
            done();
          });
    });

    beforeEach(function() {
      state = new ns.State();
    });

    afterEach(function(done) {
      state.after('destroy', function() { done(); });
      state.destroy();
    });

    it('resets filters when navigating away from search', function() {
      state._setCurrent('search', true);
      state.filter.set('text', 'foo');
      // Set the state before changing up.
      state.save();
      state.getUrl({search: false});
      assert.equal('', state.filter.get('text'));
    });

    it('permits a filter clear command', function() {
      var url = state.getUrl({
        'search': true,
        'filter': {
          text: 'apache'
        }
      });

      // We have a good valid search.
      assert.equal(url, '/search?text=apache');

      // Now let's clear it and make sure it's emptied.
      url = state.getUrl({
        'filter': {
          clear: true
        }
      });
      assert.equal(url, '/search');
    });

    it('permits a filter replace command', function() {
      var url = state.getUrl({
        'search': true,
        'filter': {
          text: 'apache',
          categories: ['app-servers']
        }
      });
      // We have a good valid search.
      assert.equal(
          url,
          '/search?categories=app-servers&text=apache');

      // Now let's update it and force all the rest to go away.
      url = state.getUrl({
        'filter': {
          replace: true,
          text: 'mysql'
        }
      });
      assert.equal(url, '/search?text=mysql');
    });
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
      state.saveState(newState);
      assert.deepEqual(state.get('previous'), {});
      assert.deepEqual(state.get('current'), newState);
      assert.equal(dispatchStub.calledOnce(), true);
      assert.deepEqual(dispatchStub.lastArguments()[0], newState);
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
        assert.equal(emptyStub.callCount(), 0);
        assert.equal(dispatchSectionStub.callCount(), 2);
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
        assert.equal(emptyStub.callCount(), 0);
        assert.equal(dispatchSectionStub.callCount(), 2);
      });
    });

    describe('dispatchers', function() {
      var dispatchers;

      beforeEach(function() {
        dispatchers = {
          sectionA: {
            charmbrowser: testUtils.makeStubFunction(),
            empty: testUtils.makeStubFunction()
          },
          sectionB: {
            machine: testUtils.makeStubFunction(),
            empty: testUtils.makeStubFunction()
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
        assert.equal(charmbrowser.calledOnce(), true);
        assert.equal(charmbrowser.lastArguments()[0], newState.metadata);
      });

      it('clears its flash storage after dispatch', function() {
        var newState = { sectionA: {}, sectionB: {} };
        state.set('flash', {foo: 'bar'});
        state.dispatch(newState);
        assert.deepEqual({}, state.get('flash'));
      });

      it('_dispatchSection: calls registered sectionB dispatcher', function() {
        var newState = {
          component: 'machine',
          metadata: 'foo'
        };
        state._dispatchSection('sectionB', newState);
        var machine = dispatchers.sectionB.machine;
        assert.equal(machine.calledOnce(), true);
        assert.equal(machine.lastArguments()[0], newState.metadata);
      });

      it('_emptySection: calls registered empty dispatcher', function() {
        state._emptySection('sectionA');
        assert.equal(dispatchers.sectionA.empty.calledOnce(), true);
        state._emptySection('sectionB');
        assert.equal(dispatchers.sectionB.empty.calledOnce(), true);
      });

    });
  });

  describe('url part parsing', function() {

    describe('_parseInspectorUrl', function() {
      var parts = {
        'inspector': undefined,
        'inspector/service123': {
          id: 'service123'
        },
        'inspector/service123/charm': {
          id: 'service123',
          charm: true
        },
        'inspector/service123/unit/13': {
          id: 'service123',
          unit: '13'
        },
        'inspector/local/new': {
          localType: 'new',
          flash: {
            file: 'foo',
            services: ['bar', 'baz']
          }
        },
        'inspector/local/upgrade': {
          localType: 'upgrade',
          flash: {
            file: 'foo',
            services: ['bar', 'baz']
          }
        }
      };

      it('can parse the inspector url parts', function() {
        state.set('flash', {
          file: 'foo',
          services: ['bar', 'baz']
        });
        Object.keys(parts).forEach(function(key) {
          assert.deepEqual(
              state._parseInspectorUrl(key),
              parts[key],
              key + ' did not parse correctly');
        });
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

      it('removes bws_ from the hash from legacy urls', function() {
        assert.deepEqual(
            state._parseCharmUrl('precise/mysql-38', 'bws_foo'),
            {
              id: 'precise/mysql-38',
              hash: 'foo' });
      });
    });
  });

  describe('parseRequest', function() {
    var urls = {
      // Old viewmode urls.
      '/sidebar/': { sectionA: {}, sectionB: {} },
      '/fullscreen/': { sectionA: {}, sectionB: {} },
      // Bundle urls.
      '/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }, sectionB: {}
      },
      '/bundle/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/mediawiki/6/single' }
        }, sectionB: {}
      },
      '/bundle/mediawiki/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/mediawiki/single' }
        }, sectionB: {}
      },
      '/bundle/~jorge/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/6/single' }
        }, sectionB: {}
      },
      '/bundle/~jorge/mediawiki/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/single' }
        }, sectionB: {}
      },
      '/fullscreen/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }, sectionB: {}
      },
      '/sidebar/bundle/~charmers/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        }, sectionB: {}
      },
      // Charm urls.
      '/precise/mysql-38/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }, sectionB: {}
      },
      '/precise/mysql': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql' }
        }, sectionB: {}
      },
      '/fullscreen/precise/mysql-38/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }, sectionB: {}
      },
      '/sidebar/precise/mysql-38/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        }, sectionB: {}
      },
      // Non promoted charm urls.
      '/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }, sectionB: {}
      },
      '/~prismakov/trusty/cf-dea/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea' }
        }, sectionB: {}
      },
      '/fullscreen/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        },
        sectionB: {}
      },
      '/sidebar/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        },
        sectionB: {}
      },
      // Search urls.
      // search is an old route path so ignore it if there isn't a query param.
      '/search/': { sectionA: {}, sectionB: {} },
      '/search/?text=apache': {
        sectionA: {
          metadata: { search: { text: 'apache' }}
        },
        sectionB: {}
      },
      '/search/?text=apache&categories=app-servers': {
        sectionA: {
          metadata: {
            search: {
              text: 'apache',
              categories: 'app-servers'
            }
          }
        },
        sectionB: {}
      },
      // Charm search urls.
      '/search/precise/cassandra-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/cassandra-1' }
        },
        sectionB: {}
      },
      '/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: { text: 'apache' }}
        },
        sectionB: {}
      },
      '/search/precise/apache2-19/?text=apache&categories=app-servers': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: {
              text: 'apache',
              categories: 'app-servers'
            }
          }
        },
        sectionB: {}
      },
      '/fullscreen/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: { text: 'apache' }}
        },
        sectionB: {}
      },
      '/sidebar/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: { text: 'apache' }}
        },
        sectionB: {}
      },
      // Bundle search urls.
      '/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: { text: 'apache' }}
        },
        sectionB: {}
      },
      '/fullscreen/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: { text: 'apache' }}
        }, sectionB: {}
      },
      '/sidebar/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: { text: 'apache' }}
        }, sectionB: {}
      },
      // New search url syntax.
      '/precise/apache2-13?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-13',
            search: { text: 'apache'}
          }
        }, sectionB: {}
      },
      '/precise/apache2-13?text=apache#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-13',
            search: { text: 'apache'},
            hash: 'readme'
          }
        }, sectionB: {}
      },
      '/bundle/hadoop/3/demo?text=hadoop': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'hadoop'},
            id: 'bundle/hadoop/3/demo'
          }
        }, sectionB: {}
      },
      '/bundle/hadoop/3/demo?text=hadoop#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'hadoop'},
            id: 'bundle/hadoop/3/demo',
            hash: 'readme'
          }
        }, sectionB: {}
      },
      // Inspector urls.
      '/inspector/service123': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123'
          }
        }, sectionB: {}
      },
      '/inspector/service123/charm': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            charm: true
          }
        }, sectionB: {}
      },
      '/inspector/service123/unit/13': {
        sectionA: {
          component: 'inspector',
          metadata: {
            id: 'service123',
            unit: '13'
          }
        }, sectionB: {}
      },
      // Machine view urls.
      '/machine/': {
        sectionA: {},
        sectionB: {
          component: 'machine'
        }
      },
      '/machine/3/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }
      },
      '/machine/3/lxc-0/': {
        sectionA: {},
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3',
            container: 'lxc-0'
          }
        }
      },
      '/machine/3/?text=hadoop': {
        sectionA: {
          metadata: {
            search: { text: 'hadoop'}
          }
        },
        sectionB: {
          component: 'machine',
          metadata: {
            id: '3'
          }
        }
      },
      // Multi section urls.
      '/inspector/apache2/machine/3/lxc-0': {
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
      },
      '/machine/3/lxc-0/inspector/apache2': {
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
      },
      // Invalid urls with overriding components
      '/inspector?text=hadoop': {
        sectionA: {
          component: 'inspector',
          metadata: {
            search: { text: 'hadoop'}
          }
        },
        sectionB: {}
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
      req.path = url.substr(0, hashTo || length);
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
            hash, oldHash;
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
            saveStub.callCount(),
            loopcount,
            'saveState was not called on every request');

      });
    });

    it('ignores inspector URLs if so instructed', function() {
      var req = buildRequest('/inspector/mysql');
      var saveStub = testUtils.makeStubMethod(state, 'saveState');
      this._cleanups.push(saveStub.reset);
      state.set('allowInspector', false);
      assert.deepEqual(
          state.loadRequest(req),
          { sectionA: {}, sectionB: {} },
          'inspector was added to state anyway');
      assert.isTrue(saveStub.calledOnce(),
          'saveState was still called');
      assert.isTrue(state.get('allowInspector'),
          'allowInspector was not reset');
    });
  });

  describe('generateUrl', function() {
    var defaultState = { sectionA: {}, sectionB: {} };
    var stateObj = {};
    var states = [{
      '/': {
        sectionA: {},
        sectionB: {}
      }
    }, {
      '/bundle/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~charmers/mediawiki/6/single' }
        },
        sectionB: {}
      }
    }, {
      '/bundle/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/mediawiki/6/single' }
        },
        sectionB: {}
      }
    }, {
      '/bundle/~jorge/mediawiki/6/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/6/single' }
        },
        sectionB: {}
      }
    }, {
      '/bundle/~jorge/mediawiki/single/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/single' }
        },
        sectionB: {}
      }
    }, {
      '/precise/mysql-38/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/mysql-38' }
        },
        sectionB: {}
      }
    }, {
      '/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        },
        sectionB: {}
      }
    }, {
      '?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'apache' }
          }
        },
        sectionB: {}
      }
    }, {
      '/precise/apache2-19?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: { text: 'apache' }
          }
        },
        sectionB: {}
      }
    }, {
      '/precise/apache2-13?text=apache#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-13',
            search: { text: 'apache'},
            hash: 'readme'
          }
        },
        sectionB: {}
      }
    }, {
      '/bundle/hadoop/3/demo?text=hadoop': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'hadoop'},
            id: 'bundle/hadoop/3/demo'
          }
        },
        sectionB: {}
      }
    }, {
      '/bundle/hadoop/3/demo?text=hadoop#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'hadoop'},
            id: 'bundle/hadoop/3/demo',
            hash: 'readme'
          }
        },
        sectionB: {}
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
            id: 'service123',
            unit: '13'
          }
        },
        sectionB: {}
      }
    },

    // inspector/local urls get data from the state's flash object, as well as
    // the url. The flash attr on metadata is from this state flash object.
    {
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
      '/machine/3?text=hadoop': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: { text: 'hadoop'}
          }
        },
        sectionB: {
          component: 'machine',
          metadata: { id: '3' }
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

    it('can generate proper urls from non default state objects', function() {
      var defaultState = {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2',
            search: { text: 'apache2'}
          }
        }, sectionB: {}};
      var changeState = {
        sectionA: {
          metadata: {
            id: 'foo' }}};
      state.set('current', Y.clone(defaultState));
      assert.equal(
          state.generateUrl(changeState),
          '/foo?text=apache2',
          'The object ' + JSON.stringify(changeState) +
              ' did not generate the proper url');
    });

    it('can reset metadata', function() {
      var defaultState = {
        sectionA: {
          metadata: {
            search: { text: 'apache2' }}
        }, sectionB: {}};
      var changeState = {
        sectionA: { metadata: null }
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
