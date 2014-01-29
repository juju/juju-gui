/*
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


describe('browser search widget', function() {
  var Y, cleanIconHelper, container, search, Search, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-search-widget',
                               'juju-charm-store',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Search = Y.juju.widgets.browser.Search;
      utils = Y.namespace('juju-tests.utils');
      // Need the handlebars helper for the token to render.
      Y.Handlebars.registerHelper(
          'charmFilePath',
          function(charmID, file) {
            return '/path/to/charm/' + file;
          });
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer('container');
    search = new Search();
    search.render(container);
    cleanIconHelper = utils.stubCharmIconPath();
  });

  afterEach(function() {
    if (search) {
      search.destroy();
    }
    container.remove(true);
    cleanIconHelper();
  });

  after(function() {
    Y.Handlebars.helpers.charmFilePath = undefined;
  });

  it('needs to render from the template', function() {
    search = new Search();
    search.render(container);
    assert.isObject(container.one('.bws-searchbox'));
    // The nav is hidden by default.
    assert.isTrue(container.one('.browser-nav').hasClass('hidden'));
  });

  it('shows the home links when withHome is set', function() {
    // Skip the default beforeEach Search and create our own.
    search.destroy();
    container.remove(true);
    container = utils.makeContainer('container');
    search = new Search({
      withHome: true
    });
    search.render(container);
    assert.isFalse(container.one('.browser-nav').hasClass('hidden'));
  });

  it('shows the home on command', function() {
    search.showHome();
    assert.isFalse(container.one('.browser-nav').hasClass('hidden'));
  });

  it('hides the home on command', function() {
    search.destroy();
    search = new Search({
      withHome: true
    });
    search.render(container);
    search.hideHome();
    assert.isTrue(container.one('.browser-nav').hasClass('hidden'));
  });

  it('should support setting search string', function() {
    search.updateSearch('test');
    container.one('input').get('value').should.eql('test');
  });

  it('adds the search text to the suggestions api call', function(done) {
    search = new Search({
      autocompleteSource: function(filters, callbacks, scope) {
        assert.equal(filters.text, 'test');
        done();
      },
      filters: {}
    });

    search._fetchSuggestions('test', function() {});
  });

  it('routes to a search with charm when selected', function(done) {
    // We're testing against the internal interface here to avoid going
    // through the event forcing loops to verify we get the right change
    // events for navigation.
    search.on(search.EVT_SEARCH_CHANGED, function(ev) {
      assert.equal(ev.newVal, 'Ceph');
      assert.equal(ev.change.charmID, 'precise/ceph-10');
      assert.equal(ev.change.filter.replace, true);
      assert.equal(ev.change.filter.categories.length, 0);
      assert.equal(ev.change.filter.text, 'Ceph');
      done();
    });

    search._suggestionSelected({
      halt: function() {},
      result: {
        raw: {charm: {id: 'precise/ceph-10'}},
        text: 'Ceph'
      }
    });
  });

  it('generates a proper change event for category selection', function(done) {
    search.on(search.EVT_SEARCH_CHANGED, function(ev) {
      // The search term is empty because we selected a category, not a
      // specific charm to search for.
      assert.equal(ev.newVal, '');
      // There's no charm id selected, we want search results to display.
      assert.equal(ev.change.charmID, null);
      assert.equal(ev.change.search, true);
      assert.equal(ev.change.filter.categories[0], 'app-servers');
      done();
    });

    search._suggestionSelected({
      halt: function() {},
      result: {
        raw: {charm: {id: 'cat:~gui/cat/app-servers-10'}},
        text: 'App Servers'
      }
    });
  });

  it('generates a bundle change event when bundle selected', function(done) {
    search.on(search.EVT_SEARCH_CHANGED, function(ev) {
      assert.equal(ev.newVal, 'TestBundle');
      // The bundle id gets prefixed with the /bundle to help routing.
      assert.equal(ev.change.charmID, '/bundle/~hatch/wiki/7/TestBundle');
      assert.equal(ev.change.filter.categories.length, 0);
      done();
    });

    search._suggestionSelected({
      halt: function() {},
      result: {
        raw: {bundle: {id: '~hatch/wiki/7/TestBundle'}},
        text: 'TestBundle'
      }
    });
  });

  it('supports an onHome event', function(done) {
    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });

    container.one('i.home').simulate('click');
  });

  it('clicking on the home link also works', function(done) {
    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });

    container.one('a.home').simulate('click');
  });

});


describe('search widget autocomplete', function() {
  var Y, cleanIconHelper, container, data, fakeStore, search, Search, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-search-widget',
                               'juju-charm-store',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Search = Y.juju.widgets.browser.Search;
      utils = Y.namespace('juju-tests.utils');
      data = utils.loadFixture('data/autocomplete.json');

      cleanIconHelper = utils.stubCharmIconPath();

      // Need the handlebars helper for the token to render.
      Y.Handlebars.registerHelper(
          'charmFilePath',
          function(charmID, file) {
            return '/path/to/charm/' + file;
          });
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer('container');
    cleanIconHelper = utils.stubCharmIconPath();

    // We need a valid store instance to send back the data.
    fakeStore = new Y.juju.charmworld.APIv3({});
    fakeStore.set('datasource', {
      sendRequest: function(params) {
        // Stubbing the server callback value
        params.callback.success({
          response: {
            results: [{
              responseText: data
            }]
          }
        });
      }
    });

    search = new Search({
      autocompleteSource: Y.bind(
          fakeStore.autocomplete,
          fakeStore
      ),
      autocompleteDataFormatter: fakeStore.transformResults,
      categoryIconGenerator:
          Y.bind(fakeStore.buildCategoryIconPath, fakeStore),
      filters: {}
    });
    search.render(container);
    search.ac.queryDelay = 0;
  });

  afterEach(function() {
    cleanIconHelper();
    search.destroy();
    fakeStore.destroy();
    container.remove(true);
  });

  after(function() {
    Y.Handlebars.helpers.charmFilePath = undefined;
  });

  it('sets the positioning for autocomplete as absolute', function() {
    // We need to ensure that the boundingBox is always in position: absolute.
    // In IE10 it can be set to position: relative, causing rendering problems
    // in the header.
    var bb = search.ac.get('boundingBox');
    assert.equal(bb.getStyle('position'), 'absolute');
  });

  it('defaults to listening to suggestions state', function() {
    // The widget can ignore any future results for completion suggestions
    // that are in flight.
    assert.equal(search.ignoreInFlight, false);
  });

  it('ignore in flight suggestion calls during form submission', function() {
    search.get('boundingBox').one('form').simulate('submit');
    assert.equal(search.ignoreInFlight, true);
  });

  it('reset back to accepting suggest requests on focus', function() {
    // If the widget is ignoring in flight suggestion calls, focusing on the
    // input should turn it back on for responding to results.
    search.get('boundingBox').one('form').simulate('submit');
    assert.equal(search.ignoreInFlight, true);
    search.get('boundingBox').one('input').simulate('focus');
    // IE does not trigger a focus event through simulate so we call the
    // function directly.
    if (Y.UA.ie) {
      search._handleInputFocus();
    }
    assert.equal(search.ignoreInFlight, false);
  });

  it('supports autocompletion while entering text', function(done) {
    // Create our own search instance.
    search.destroy();
    container.remove(true);
    container = utils.makeContainer('container');

    search.ac.on('results', function(ev) {
      // The results should be displaying now. Check for token nodes.
      assert.equal(ev.results.length, 21);
      assert.isTrue(ev.results[0].display.hasClass('yui3-token'));

      // There are two category results now for 'a'. They appear at the start
      // of the list of completion options.
      assert.equal(ev.results[0].text, 'App Servers');
      assert.equal(ev.results[1].text, 'Applications');
      done();
    });

    // hack into the ac widget to simulate the valueChange event
    search.ac._afterValueChange({
      newVal: 'a',
      src: 'ui'
    });
  });

  it('properly identifies categories in the html results', function(done) {
    search.ac.on('results', function(ev) {
      // The first two results should be category
      assert.isTrue(
          ev.results[0].display.one('.token').hasClass('category'));
      assert.isTrue(
          ev.results[1].display.one('.token').hasClass('category'));

      // The second category is the last category and is labeled as such.
      assert.isTrue(ev.results[1].display.hasClass('last-category'));
      done();
    });

    // hack into the ac widget to simulate the valueChange event
    search.ac._afterValueChange({
      newVal: 'a',
      src: 'ui'
    });
  });

  it('shows categories when search text is empty', function(done) {
    search._fetchSuggestions('', function(data) {
      assert.equal(data.result.length, 6);
      // Each of these is a category and should have an id that starts with
      // cat: to help us ID them.
      data.result.forEach(function(suggestion) {
        assert.equal(suggestion.charm.id.substr(0, 4), 'cat:');
      });
      done();
    });
  });

  it('fires deploy event when the deploy button is selected', function(done) {
    // This is heading into the private, non-publicized events of the AC
    // widget in an effort to hit the html on render after results come
    // back.
    search.ac.after('resultsChange', function(ev) {
      //Find one of the deployable results and trigger click event.
      var chosenOne = container.one('.search_add_to_canvas');
      chosenOne.simulate('click');
    });

    search.on(search.EVT_DEPLOY, function(ev) {
      // Verify that the event was called with the correct payload to deploy.
      assert.equal(ev.entityType, 'charm');
      assert.equal(ev.id, 'precise/apache2-passenger-3');
      assert.equal(ev.data.url, 'cs:precise/apache2-passenger-3');
      done();
    });

    // hack into the ac widget to simulate the valueChange event
    search.ac._afterValueChange({
      newVal: 'a',
      src: 'ui'
    });

  });

});
