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
  var Y, charmBrowser, CharmBrowser, container, sampleData, cleanIconHelper,
      utils, views;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-tests-utils',
        'juju-charmbrowser',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          views = Y.namespace('juju.browser.views');
          CharmBrowser = views.CharmBrowser;
          sampleData = utils.loadFixture('data/interesting.json');
          cleanIconHelper = utils.stubCharmIconPath();
          done();
        });
  });

  beforeEach(function() {
    charmBrowser = new CharmBrowser();
    container = utils.makeContainer(this);
  });

  afterEach(function(done) {
    if (charmBrowser) {
      charmBrowser.after('destroy', function() { done(); });
      charmBrowser.destroy();
    }
  });

  describe('render', function() {
    it('appends the template to the container', function() {
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);

      charmBrowser.render(container);
      var cbContainer = charmBrowser.get('container');
      assert.notEqual(cbContainer.one('.search-widget'), null);
      assert.notEqual(cbContainer.one('.charm-list'), null);
    });

    it('appends itself to the provided parent container', function() {
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);

      charmBrowser.render(container);
      assert.notEqual(container.one('.search-widget'), null);
      assert.notEqual(container.one('.charm-list'), null);
    });

    it('calls to render the search widget on render', function() {
      // XXX This doesn't really test anything yet because the search widget
      // rendering code isn't completed.
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);

      charmBrowser.render(container);
      assert.equal(search.calledOnce(), true);
    });

    it('shows the loading indicator on render', function() {
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);

      charmBrowser.render(container);
      assert.equal(indicator.calledOnce(), true);
    });

    it('calls to render the search results when requested', function() {
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);
      var searchResults = utils.makeStubMethod(
          charmBrowser, '_renderSearchResults');
      this._cleanups.push(searchResults.reset);
      var curated = utils.makeStubMethod(charmBrowser, '_loadCurated');
      this._cleanups.push(curated.reset);

      charmBrowser.render(container, 'search');
      // Make sure we don't also render the curated list.
      assert.equal(curated.callCount(), 0);
      assert.equal(searchResults.calledOnce(), true);
    });

    it('calls to render the curated list on render when requested', function() {
      var search = utils.makeStubMethod(charmBrowser, '_renderSearch');
      this._cleanups.push(search.reset);
      var indicator = utils.makeStubMethod(charmBrowser, 'showIndicator');
      this._cleanups.push(indicator.reset);
      var searchResults = utils.makeStubMethod(
          charmBrowser, '_renderSearchResults');
      this._cleanups.push(searchResults.reset);
      var curated = utils.makeStubMethod(charmBrowser, '_loadCurated');
      this._cleanups.push(curated.reset);

      charmBrowser.render(container, 'curated');
      assert.equal(curated.calledOnce(), true);
      // Make sure we don't also render the search result list.
      assert.equal(searchResults.callCount(), 0);
    });
  });

  describe.skip('_renderSearch', function() {
    it('renders the search widget on render');
  });

  describe.skip('_renderSearchResults', function() {
    it('renders the search results when requested');
  });

  describe('_loadCurated', function() {
    var interesting, intArgs, failure, render, transform;
    beforeEach(function() {
      failure = utils.makeStubMethod(charmBrowser, 'apiFailure');
      this._cleanups.push(failure.reset);
      render = utils.makeStubMethod(charmBrowser, '_renderCurated');
      this._cleanups.push(render.reset);
      charmBrowser.set('store', {
        interesting: utils.makeStubFunction(),
        transformResults: utils.makeStubFunction({})
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
      assert.deepEqual(render.lastArguments()[0], data.result);
    });
  });

  describe('_renderCurated', function() {
    var hideIndicator, updateActive, sticky;

    beforeEach(function() {
      charmBrowser.set('activeID', '12');
      hideIndicator = utils.makeStubMethod(charmBrowser, 'hideIndicator');
      this._cleanups.push(hideIndicator.reset);
      updateActive = utils.makeStubMethod(charmBrowser, 'updateActive');
      this._cleanups.push(updateActive.reset);
      sticky = utils.makeStubMethod(charmBrowser, '_makeStickyHeaders');
      this._cleanups.push(sticky.reset);
      // Type is intentionally left off so that it doesn't load the curated
      // results.
      charmBrowser.render(container);
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
      charmBrowser._renderCurated.call(charmBrowser, results);
      var container = charmBrowser.get('container');
      assert.notEqual(container.one('.featured'), null);
      assert.notEqual(container.one('.popular'), null);
      assert.notEqual(container.one('.new'), null);
      assert.equal(container.all('.yui3-token').size(), 2);
    });

    it('hides the loading indicator on rendering the curated list', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCurated.call(charmBrowser, results);
      assert.equal(hideIndicator.calledOnce(), true);
    });

    it('calls to mark the selected charm in the charm list', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCurated.call(charmBrowser, results);
      assert.equal(updateActive.callCount(), 1);
      assert.equal(updateActive.lastArguments()[0], null);
    });

    it('calls to make the headers sticky', function() {
      var results = {
        featured: [],
        popular: [],
        'new': []
      };
      charmBrowser._renderCurated.call(charmBrowser, results);
      assert.equal(sticky.callCount(), 1);
    });
  });

  describe('_makeStickyHeaders', function() {
    it('makes the charm list section headers sticky', function() {
      var hideIndicator = utils.makeStubMethod(charmBrowser, 'hideIndicator');
      this._cleanups.push(hideIndicator.reset);
      charmBrowser.render(container);
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
      charmBrowser._renderCurated.call(charmBrowser, results);
      var stickys = container.all('.stickable');
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
      container.append(token1);
      container.append(token2);
      charmBrowser.updateActive(token2.one('.click'));
      assert.equal(token2.hasClass('active'), true);
      assert.equal(container.all('.yui3-token.active').size(), 1);
    });
  });

  describe('destroy', function() {
    it('destroys rendered tokens on destroy', function() {
      charmBrowser.tokenContainers = [
        { destroy: utils.makeStubFunction() }
      ];
      charmBrowser.destroy();
      assert.equal(charmBrowser.tokenContainers[0].destroy.calledOnce(), true);
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
