
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

describe('State object', function() {
  var Y, ns, state, request;

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

  it('parses viewmode out of the request properly', function() {
    var viewmode = 'foo';
    request.params.viewmode = viewmode;
    state.loadRequest(request);
    assert.equal(state.getCurrent('viewmode'), viewmode);
  });

  it('parses hash out of the request properly', function() {
    var hash = 'foo';
    window.location.hash = hash;
    state.loadRequest(request);
    assert.equal(state.getCurrent('hash'), '#' + hash);
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
});
