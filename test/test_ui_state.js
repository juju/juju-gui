
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
  var Y, ns, state, request;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-app-state',
        'querystring',
        function(Y) {
          ns = Y.namespace('juju.models');

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

  it('detects changed fields appropriately', function() {
    state._setPrevious('charmID', 'bar');
    state._setCurrent('charmID', 'foo');
    assert.equal(state.hasChanged('charmID'), true,
                 'Did not detect changed field');
    state._setPrevious('querystring', 'foo');
    state._setCurrent('querystring', 'foo');
    assert.equal(state.hasChanged('querystring'), false,
                 'False positive on an unchanged field');
  });

  it('saves the current state back to the old state', function() {
    var expected = {
      charmID: 'scooby',
      querystring: 'shaggy',
      hash: 'velma',
      search: 'daphne',
      viewmode: 'fred'
    };
    state._current = expected;
    state.save();
    assert.deepEqual(state._previous, expected);
  });

  it('does not add sidebar to urls that do not require it', function() {
    // sidebar is the default viewmode and is not required on urls that have
    // a charm id in them or the root url. Leave out the viewmode in these
    // cases.
    var url = state.getUrl({
      viewmode: 'sidebar',
      charmID: 'precise/mysql-10',
      search: undefined,
      filter: undefined
    });
    assert.equal(url, 'precise/mysql-10');

    url = state.getUrl({
      viewmode: 'sidebar',
      charmID: undefined,
      search: undefined,
      filter: undefined
    });
    assert.equal(url, '');

    // The viewmode is required for search related routes though.
    url = state.getUrl({
      viewmode: 'sidebar',
      charmID: undefined,
      search: true,
      filter: undefined
    });
    assert.equal(url, 'sidebar/search');
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
      'minimized': '',
      'fullscreen/precise/mysql-38': 'precise/mysql-38',
      'sidebar/precise/mysql-38': 'precise/mysql-38',
      'minimized/precise/mysql-38': 'precise/mysql-38'
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

  describe('url part parsing', function() {
    describe('_parseInspectorUrl', function() {
      var parts = {
        'inspector': undefined,
        'inspector/service123': {
          id: 'service123' },
        'inspector/service123/charm': {
          id: 'service123',
          charm: true },
        'inspector/service123/unit/13': {
          id: 'service123',
          unit: '13' }
      };
      it('can parse the inspector url parts', function() {
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
      '/minimized/': { sectionA: {}, sectionB: {} },
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
      '/bundle/~jorge/mediawiki/6/single': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'bundle/~jorge/mediawiki/6/single' }
        }, sectionB: {}
      },
      '/bundle/~jorge/mediawiki/single': {
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
      '/minimized/bundle/~charmers/mediawiki/6/single/': {
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
      '/minimized/precise/mysql-38/': {
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
        }, sectionB: {}
      },
      '/sidebar/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }, sectionB: {}
      },
      '/minimized/~prismakov/trusty/cf-dea-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: '~prismakov/trusty/cf-dea-1' }
        }, sectionB: {}
      },
      // Search urls.
      // search is an old route path so ignore it if there isn't a query param.
      '/search/': { sectionA: {}, sectionB: {} },
      '/search/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { search: 'apache' }
        }, sectionB: {}
      },
      // Charm search urls.
      '/search/precise/cassandra-1/': {
        sectionA: {
          component: 'charmbrowser',
          metadata: { id: 'precise/cassandra-1' }
        }, sectionB: {}
      },
      '/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: 'apache' }
        }, sectionB: {}
      },
      '/fullscreen/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: 'apache' }
        }, sectionB: {}
      },
      '/sidebar/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: 'apache' }
        }, sectionB: {}
      },
      '/minimized/search/precise/apache2-19/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-19',
            search: 'apache' }
        }, sectionB: {}
      },
      // Bundle search urls.
      '/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: 'apache' }
        }, sectionB: {}
      },
      '/fullscreen/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: 'apache' }
        }, sectionB: {}
      },
      '/sidebar/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: 'apache' }
        }, sectionB: {}
      },
      '/minimized/search/bundle/~charmers/mediawiki/6/single/?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'bundle/~charmers/mediawiki/6/single',
            search: 'apache' }
        }, sectionB: {}
      },
      // New search url syntax.
      '/precise/apache2-13?text=apache': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-13',
            search: 'apache'
          }
        }, sectionB: {}
      },
      '/precise/apache2-13?text=apache#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            id: 'precise/apache2-13',
            search: 'apache',
            hash: 'readme'
          }
        }, sectionB: {}
      },
      '/bundle/hadoop/3/demo?text=hadoop': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: 'hadoop',
            id: 'bundle/hadoop/3/demo'
          }
        }, sectionB: {}
      },
      '/bundle/hadoop/3/demo?text=hadoop#readme': {
        sectionA: {
          component: 'charmbrowser',
          metadata: {
            search: 'hadoop',
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
          component: 'charmbrowser',
          metadata: {
            search: 'hadoop'
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
          component: 'charmbrowser',
          metadata: {
            search: 'hadoop'
          }
        }, sectionB: {}
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
      Object.keys(urls).forEach(function(key) {
        var req = buildRequest(key),
            hash, oldHash;
        if (req.hash) {
          hash = req.hash;
          delete req.hash;
        }
        assert.deepEqual(
            state.loadRequest(req, hash),
            urls[key],
            key + ' did not parse correctly');
      });
    });

  });
});
