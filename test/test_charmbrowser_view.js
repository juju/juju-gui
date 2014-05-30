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

describe('charmbrowser view', function() {
  var Y, charmBrowser, CharmBrowser, cleanIconHelper,
      utils, views;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'browser-search-widget',
        'array-extras', // Why this is necessary?? Nobody knows!
        'base', // Why this is necessary?? Nobody knows!
        'view', // Why this is necessary?? Nobody knows!
        'browser-tabview', // Why this is necessary?? Nobody knows!
        'juju-tests-utils',
        'juju-charmbrowser',
        'event-tracker',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          views = Y.namespace('juju.browser.views');
          CharmBrowser = views.CharmBrowser;
          cleanIconHelper = utils.stubCharmIconPath();
          done();
        });
  });

  beforeEach(function() {
    charmBrowser = new CharmBrowser({
      parentContainer: utils.makeContainer(this),
      store: {
        cancelInFlightRequest: utils.makeStubFunction()
      }
    });
  });

  afterEach(function(done) {
    if (charmBrowser) {
      charmBrowser.after('destroy', function() { done(); });
      charmBrowser.destroy();
    }
  });

  describe('render', function() {
    var shouldRender, renderSearch, indicator, cleanup;

    beforeEach(function() {
      shouldRender = utils.makeStubMethod(charmBrowser, '_shouldRender', true);
      this._cleanups.push(shouldRender.reset);
      renderSearch = utils.makeStubMethod(charmBrowser, '_renderSearchWidget');
      this._cleanups.push(renderSearch.reset);
      indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);
      cleanup = utils.makeStubMethod(charmBrowser, '_cleanUp');
      this._cleanups.push(cleanup.reset);
    });

    it('checks that it should render before rendering', function() {
      shouldRender.reset();
      shouldRender = utils.makeStubMethod(charmBrowser, '_shouldRender', false);
      this._cleanups.push(shouldRender.reset);
      charmBrowser.render('foo', 'bar');
      assert.equal(shouldRender.calledOnce(), true);
      var shouldArgs = shouldRender.lastArguments();
      assert.equal(shouldArgs[0], 'foo');
      assert.equal(shouldArgs[1], 'bar');
    });

    it('appends the template to the container', function() {
      charmBrowser.render();
      var cbContainer = charmBrowser.get('container');
      assert.equal(cleanup.calledOnce(), true);
      assert.notEqual(cbContainer.one('.search-widget'), null);
      assert.notEqual(cbContainer.one('.charm-list'), null);
    });

    it('calls to clean up any old content', function() {
      charmBrowser.render();
      assert.equal(cleanup.calledOnce(), true);
    });

    it('appends itself to the provided parent container', function() {
      charmBrowser.render();
      var container = charmBrowser.get('container');
      assert.notEqual(container.one('.search-widget'), null);
      assert.notEqual(container.one('.charm-list'), null);
    });

    it('calls to render the search widget on render', function() {
      charmBrowser.render();
      assert.equal(renderSearch.calledOnce(), true);
    });

    it('shows the loading indicator on render', function() {
      charmBrowser.render();
      assert.equal(indicator.calledOnce(), true);
      assert.notEqual(indicator.lastArguments()[0], null);
    });

    it('calls to render the search results when requested', function() {
      var searchResults = utils.makeStubMethod(
          charmBrowser, '_loadSearchResults');
      this._cleanups.push(searchResults.reset);
      var curated = utils.makeStubMethod(charmBrowser, '_loadCurated');
      this._cleanups.push(curated.reset);
      charmBrowser.set('renderType', 'search');
      assert.equal(charmBrowser.get('withHome'), undefined);
      charmBrowser.render();
      // Make sure we don't also render the curated list.
      assert.equal(curated.callCount(), 0);
      assert.equal(searchResults.calledOnce(), true);
      assert.equal(charmBrowser.get('withHome'), true);
    });

    it('calls to render the curated list on render when requested', function() {
      var searchResults = utils.makeStubMethod(
          charmBrowser, '_loadSearchResults');
      this._cleanups.push(searchResults.reset);
      var curated = utils.makeStubMethod(charmBrowser, '_loadCurated');
      this._cleanups.push(curated.reset);
      charmBrowser.set('renderType', 'curated');
      assert.equal(charmBrowser.get('withHome'), undefined);
      charmBrowser.render('curated');
      assert.equal(curated.calledOnce(), true);
      // Make sure we don't also render the search result list.
      assert.equal(searchResults.callCount(), 0);
      assert.equal(charmBrowser.get('withHome'), false);
    });

    it('unsets any potentially active tokens', function() {
      var updateActive = utils.makeStubMethod(charmBrowser, 'updateActive');
      charmBrowser.render();
      assert.equal(updateActive.calledOnce(), true);
    });
  });

  describe('_shouldRender', function() {
    it('should render with a new search value', function() {
      assert.equal(charmBrowser._shouldRender({}, true), true);
    });

    it('sets the renderType to the default', function() {
      charmBrowser._shouldRender();
      assert.equal(charmBrowser.get('renderType'), 'curated');
    });

    it('sets the renderType to search', function() {
      charmBrowser._shouldRender({
        search: 'foo'
      });
      assert.equal(charmBrowser.get('renderType'), 'search');
    });

    it('should render with a new view type', function() {
      assert.equal(charmBrowser.get('renderType'), undefined);
      assert.equal(charmBrowser._shouldRender({}, false), true);
    });

    it('should skip rendering if there are no changes', function() {
      charmBrowser.set('renderType', 'curated');
      assert.equal(charmBrowser._shouldRender({}, false), false);
      assert.equal(charmBrowser.get('renderType'), 'curated');
    });
  });

  describe('search-widget-mgmt-extension', function() {
    beforeEach(function() {
      charmBrowser.set('store', {
        cancelInFlightRequest: utils.makeStubFunction(),
        autocomplete: utils.makeStubFunction(),
        transformResults: utils.makeStubFunction(),
        buildCategoryIconPath: utils.makeStubFunction(),
        iconpath: utils.makeStubFunction()
      });
      charmBrowser.set('filters', { text: 'apache' });
      charmBrowser.get('container')
                  .append('<div class="search-widget"></div>');
    });

    describe('_renderSearchWidget', function() {
      var searchEvents;
      beforeEach(function() {
        searchEvents = utils.makeStubMethod(
            charmBrowser, '_bindSearchWidgetEvents');
        this._cleanups.push(searchEvents.reset);
      });

      it('instantiates the search widget properly', function() {
        charmBrowser._renderSearchWidget();
        var search = charmBrowser.searchWidget,
            store = charmBrowser.get('store');
        search.get('autocompleteSource')();
        assert.equal(store.autocomplete.calledOnce(), true);
        search.get('autocompleteDataFormatter')();
        assert.equal(store.transformResults.calledOnce(), true);
        search.get('categoryIconGenerator')();
        assert.equal(store.buildCategoryIconPath.calledOnce(), true);
        assert.deepEqual(search.get('filters'), charmBrowser.get('filters'));
      });

      it('renders the search widget', function() {
        charmBrowser._renderSearchWidget();
        assert.notEqual(
            charmBrowser.get('container').one('.browser-nav'), null);
      });

      it('calls to bind the search widget events', function() {
        charmBrowser._renderSearchWidget();
        assert.equal(searchEvents.calledOnce(), true);
      });
    });

    describe('_bindSearchWidgetEvents', function() {
      // window.flags.il
      beforeEach(function() {
        window.flags = { il: true };
      });

      afterEach(function() {
        window.flags = {};
      });

      it('fires a changeState event when going home', function(done) {
        assert.equal(charmBrowser.get('withHome'), undefined);
        charmBrowser._renderSearchWidget();
        charmBrowser.on('changeState', function(e) {
          assert.deepEqual(e.details[0], {
            sectionA: {
              metadata: null,
              component: null
            }
          });
          assert.equal(charmBrowser.get('withHome'), false);
          done();
        });
        var searchWidget = charmBrowser.searchWidget;
        searchWidget.fire(searchWidget.EVT_SEARCH_GOHOME);
      });

      it('fires a changeState event when the search changes', function(done) {
        var change = {
          filter: 'foo',
          charmID: 'bar'
        };
        charmBrowser._renderSearchWidget();
        charmBrowser.on('changeState', function(e) {
          assert.deepEqual(e.details[0], {
            sectionA: {
              component: 'charmbrowser',
              metadata: {
                search: change.filter,
                id: change.charmID
              }}});
          done();
        });
        var searchWidget = charmBrowser.searchWidget;
        searchWidget.fire(searchWidget.EVT_SEARCH_CHANGED, {
          change: change
        });
      });

      it('calls to deploy charm when the deploy button is clicked', function() {
        var deploy = utils.makeStubMethod(charmBrowser, '_deployEntity');
        this._cleanups.push(deploy.reset);
        charmBrowser._renderSearchWidget();
        var searchWidget = charmBrowser.searchWidget;
        searchWidget.fire(searchWidget.EVT_DEPLOY);
        assert.equal(deploy.calledOnce(), true);
      });
    });

    describe('_deployEntity', function() {
      beforeEach(function() {
        charmBrowser.setAttrs({
          deployBundle: utils.makeStubFunction(),
          deployService: utils.makeStubFunction()
        });
      });

      it('calls to deploy a bundle', function() {
        var data = {
          entityType: 'bundle',
          data: { foo: 'bar' },
          id: 'bundle-123' };
        charmBrowser._deployEntity(Y.clone(data));
        assert.equal(charmBrowser.get('deployBundle').calledOnce(), true);
        assert.equal(charmBrowser.get('deployService').callCount(), false);
      });

      it('calls to deploy a charm', function() {
        var data = {
          entityType: 'charm',
          data: { id: 'cs:precise/mysql-44' },
          id: 'cs:precise/mysql-44' };
        charmBrowser._deployEntity(Y.clone(data));
        assert.equal(charmBrowser.get('deployBundle').calledOnce(), false);
        assert.equal(charmBrowser.get('deployService').callCount(), true);
        assert.equal(charmBrowser.get('store').iconpath.calledOnce(), true);
      });
    });
  });

  describe('_loadSearchResults', function() {
    var failure, render, search, searchArgs, transform;
    beforeEach(function() {
      failure = utils.makeStubMethod(charmBrowser, 'apiFailure');
      this._cleanups.push(failure.reset);
      render = utils.makeStubMethod(charmBrowser, '_renderCharmTokens');
      this._cleanups.push(render.reset);
      charmBrowser.set('store', {
        search: utils.makeStubFunction(),
        transformResults: utils.makeStubFunction([]),
        cancelInFlightRequest: utils.makeStubFunction()
      });
      charmBrowser.set('filters', 'filterObj');
      charmBrowser._loadSearchResults();
      search = charmBrowser.get('store').search;
      transform = charmBrowser.get('store').transformResults;
      searchArgs = search.lastArguments();
    });

    it('requests the store for curated results', function() {
      assert.equal(searchArgs[0], 'filterObj');
      assert.deepEqual(Object.keys(searchArgs[1]), ['success', 'failure']);
      assert.deepEqual(searchArgs[2], charmBrowser);
    });

    it('passes the api failure call off properly', function() {
      searchArgs[1].failure();
      assert.equal(failure.calledOnce(), true);
      assert.equal(failure.lastArguments()[0], 'search');
    });

    it('calls to render the search results', function() {
      var data = {
        recommended: [],
        other: [] };
      searchArgs[1].success.call(charmBrowser, data);
      assert.equal(transform.callCount(), 1);
      assert.equal(render.calledOnce(), true);
      var renderArgs = render.lastArguments();
      assert.deepEqual(renderArgs[0], data);
      assert.deepEqual(renderArgs[1], ['recommended', 'other']);
      assert.equal(renderArgs[2], 'searchResultTemplate');
    });
  });

  describe('_loadCurated', function() {
    var interesting, intArgs, failure, render, transform;
    beforeEach(function() {
      failure = utils.makeStubMethod(charmBrowser, 'apiFailure');
      this._cleanups.push(failure.reset);
      render = utils.makeStubMethod(charmBrowser, '_renderCharmTokens');
      this._cleanups.push(render.reset);
      charmBrowser.set('store', {
        interesting: utils.makeStubFunction(),
        transformResults: utils.makeStubFunction({}),
        cancelInFlightRequest: utils.makeStubFunction()
      });
      charmBrowser._loadCurated();
      interesting = charmBrowser.get('store').interesting;
      transform = charmBrowser.get('store').transformResults;
      intArgs = interesting.lastArguments();
    });

    it('requests the store for curated results', function() {
      assert.deepEqual(Object.keys(intArgs[0]), ['success', 'failure']);
      assert.deepEqual(intArgs[1], charmBrowser);
    });

    it('passes the api failure call off properly', function() {
      intArgs[0].failure();
      assert.equal(failure.calledOnce(), true);
      assert.equal(failure.lastArguments()[0], 'curated');
    });

    it('calls to render the results', function() {
      var data = {
        result: {
          featured: {},
          popular: {},
          'new': {} }};
      intArgs[0].success.call(charmBrowser, data);
      assert.equal(transform.callCount(), 3);
      assert.equal(render.calledOnce(), true);
      var renderArgs = render.lastArguments();
      assert.deepEqual(renderArgs[0], data.result);
      assert.deepEqual(renderArgs[1], ['featured', 'popular', 'new']);
      assert.equal(renderArgs[2], 'curatedTemplate');
    });
  });

  describe('_renderCharmTokens', function() {
    var hideIndicator, updateActive, sticky, shouldRender;

    beforeEach(function() {
      charmBrowser.set('activeID', '12');
      shouldRender = utils.makeStubMethod(charmBrowser, '_shouldRender', true);
      this._cleanups.push(shouldRender.reset);
      hideIndicator = utils.makeStubMethod(charmBrowser, 'hideIndicator');
      this._cleanups.push(hideIndicator.reset);
      updateActive = utils.makeStubMethod(charmBrowser, 'updateActive');
      this._cleanups.push(updateActive.reset);
      sticky = utils.makeStubMethod(charmBrowser, '_makeStickyHeaders');
      this._cleanups.push(sticky.reset);
      // Type is intentionally left off so that it doesn't load the curated
      // results.
      charmBrowser.render();
    });

    it('renders a loaded curated list', function() {
      // Contains bundles and charms so this tests that both render orrectly.
      var results = {
        featured: [{
          getAttrs: utils.makeStubFunction({
            id: '~bac/wiki/3/wiki',
            name: 'wiki',
            basket_name: 'mediawiki',
            basket_revision: 3,
            branch_deleted: false
          })
        }],
        popular: [{
          getAttrs: utils.makeStubFunction({
            id: 'precise/bar-2',
            name: 'foo',
            description: 'some charm named bar',
            files: [],
            is_approved: true
          })
        }],
        'new': []
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['featured', 'popular', 'new'],
          'curatedTemplate');
      var container = charmBrowser.get('container');
      assert.notEqual(container.one('.featured'), null);
      assert.notEqual(container.one('.popular'), null);
      assert.notEqual(container.one('.new'), null);
      assert.equal(container.all('.yui3-token').size(), 2);
    });

    it('renders a loaded search result list', function() {
      var results = {
        recommended: [{
          getAttrs: utils.makeStubFunction({
            id: '~bac/wiki/3/wiki',
            name: 'wiki',
            basket_name: 'mediawiki',
            basket_revision: 3,
            branch_deleted: false
          })
        }],
        other: [{
          getAttrs: utils.makeStubFunction({
            id: 'precise/bar-2',
            name: 'foo',
            description: 'some charm named bar',
            files: [],
            is_approved: true
          })
        }]
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['recommended', 'other'],
          'searchResultTemplate');
      var container = charmBrowser.get('container');
      assert.notEqual(container.one('.recommended'), null);
      assert.notEqual(container.one('.other'), null);
      assert.equal(container.all('.yui3-token').size(), 2);
    });

    it('hides the loading indicator on rendering the charm tokens', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['featured', 'popular', 'new'],
          'curatedTemplate');
      assert.equal(hideIndicator.calledOnce(), true);
    });

    it('calls to mark the selected charm in the charm list', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['featured', 'popular', 'new'],
          'curatedTemplate');
      // It's called once in the initial render call.
      assert.equal(updateActive.callCount(), 2);
      assert.equal(updateActive.lastArguments()[0], null);
    });

    it('calls to make the headers sticky', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['featured', 'popular', 'new'],
          'curatedTemplate');
      assert.equal(sticky.callCount(), 1);
    });
  });

  describe('_makeStickyHeaders', function() {
    it('makes the charm list section headers sticky', function() {
      var shouldRender = utils.makeStubMethod(
          charmBrowser, '_shouldRender', true);
      this._cleanups.push(shouldRender.reset);
      var hideIndicator = utils.makeStubMethod(charmBrowser, 'hideIndicator');
      this._cleanups.push(hideIndicator.reset);
      charmBrowser.render();
      var results = {
        featured: [{
          getAttrs: utils.makeStubFunction({
            id: '~bac/wiki/3/wiki',
            name: 'wiki',
            basket_name: 'mediawiki',
            basket_revision: 3,
            branch_deleted: false
          })
        }],
        popular: [{
          getAttrs: utils.makeStubFunction({
            id: 'precise/bar-2',
            name: 'foo',
            description: 'some charm named bar',
            files: [],
            is_approved: true
          })
        }],
        'new': []
      };
      charmBrowser._renderCharmTokens.call(
          charmBrowser,
          results,
          ['featured', 'popular', 'new'],
          'curatedTemplate');
      var stickys = charmBrowser.get('container').all('.stickable');
      assert.equal(stickys.size(), 3);
      // The first header needs to be stuck to start with (see code comments).
      assert.notEqual(stickys.item(0).hasClass('stickky'), null);
    });
  });

  describe('updateActive', function() {
    it('marks the selected charm in the charm list', function() {
      var token1 = '<div class="yui3-token.active"></div>';
      var token2 = Y.Node.create(
          '<div class="yui3-token"><div class="click"></div></div>');
      var container = charmBrowser.get('container');
      container.append(token1);
      container.append(token2);
      charmBrowser.updateActive(token2.one('.click'));
      assert.equal(token2.hasClass('active'), true);
      assert.equal(container.all('.yui3-token.active').size(), 1);
    });
  });

  describe('_cleanUp', function() {
    it('destroys rendered tokens', function() {
      charmBrowser.tokenContainers = [
        { destroy: utils.makeStubFunction() }
      ];
      charmBrowser._cleanUp();
      assert.equal(charmBrowser.tokenContainers[0].destroy.calledOnce(), true);
    });

    it('detaches the sticky header event', function() {
      charmBrowser._stickyEvent = { detach: utils.makeStubFunction() };
      charmBrowser._cleanUp();
      assert.equal(charmBrowser._stickyEvent.detach.calledOnce(), true);
    });

    it('calls to hide the indicator', function() {
      charmBrowser.get('container').append('<div class="charm-list"></div>');
      var hide = utils.makeStubMethod(charmBrowser, 'hideIndicator');
      this._cleanups.push(hide.reset);
      charmBrowser._cleanUp();
      assert.equal(hide.calledOnce(), true);
    });

    it('calls to destroy the search widget', function() {
      charmBrowser.searchWidget = { destroy: utils.makeStubFunction() };
      charmBrowser._cleanUp();
      assert.equal(charmBrowser.searchWidget.destroy.calledOnce(), true);
    });
  });

  describe('destroy', function() {
    var shouldRender, renderSearch, indicator, cleanup;

    beforeEach(function() {
      shouldRender = utils.makeStubMethod(charmBrowser, '_shouldRender', true);
      this._cleanups.push(shouldRender.reset);
      renderSearch = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(renderSearch.reset);
      indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);
      cleanup = utils.makeStubMethod(charmBrowser, '_cleanUp');
      this._cleanups.push(cleanup.reset);
    });

    it('calls the cleanup method', function() {
      charmBrowser.destroy();
      assert.equal(cleanup.calledOnce(), true);
    });

    it('removes the container from the DOM', function() {
      window.flags = {};
      window.flags.il = true;
      charmBrowser.render();
      charmBrowser.destroy();
      assert.equal(charmBrowser.get('container').getDOMNode(), null);
      window.flags = null;
    });

    it('calls to abort any in flight store requests', function() {
      charmBrowser.activeRequestId = 42;
      charmBrowser.destroy();
      var cancel = charmBrowser.get('store').cancelInFlightRequest;
      assert.equal(cancel.calledOnce(), true);
      assert.equal(cancel.lastArguments()[0], charmBrowser.activeRequestId);
    });
  });

  describe('_bindEvents', function() {
    it('navigates correctly when a charm is selected', function() {
      var updateActive = utils.makeStubMethod(charmBrowser, 'updateActive');
      this._cleanups.push(updateActive.reset);
      charmBrowser.set('activeID', 'foo');
      assert.equal(updateActive.calledOnce(), true);
      assert.equal(updateActive.lastArguments()[0], null);
    });
  });

  describe('apiFailure', function() {
    it('passes api failures to the utils method', function() {
      var failure = utils.makeStubMethod(charmBrowser, '_apiFailure');
      this._cleanups.push(failure.push);
      charmBrowser.apiFailure();
      assert.equal(failure.calledOnce(), true);
    });
  });

});
