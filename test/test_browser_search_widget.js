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
    container = utils.makeContainer(this, 'container');
    search = new Search();
    search.render(container);
    cleanIconHelper = utils.stubCharmIconPath();
  });

  afterEach(function() {
    if (search) {
      search.destroy();
    }
    cleanIconHelper();
  });

  after(function() {
    Y.Handlebars.helpers.charmFilePath = undefined;
  });

  it('needs to render from the template', function() {
    search = new Search();
    search.render(container);
    assert.isObject(container.one('.bws-searchbox'));
  });

  it('shows the home links when withHome is set', function() {
    // Skip the default beforeEach Search and create our own.
    search.destroy();
    container.remove(true);
    container = utils.makeContainer(this, 'container');
    search = new Search({
      withHome: true
    });
    search.render(container);
    assert.isFalse(container.one('.browser-nav').hasClass('hidden'));
  });

  it('should support setting search string', function() {
    search.updateSearch('test');
    container.one('input').get('value').should.eql('test');
  });

  it('clicking on the home link also works', function(done) {
    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });

    container.one('.home').simulate('click');
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
    container = utils.makeContainer(this, 'container');
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
      filters: {},
      envSeries: function() {}
    });
    search.render(container);
  });

  afterEach(function() {
    cleanIconHelper();
    search.destroy();
    fakeStore.destroy();
  });

  after(function() {
    Y.Handlebars.helpers.charmFilePath = undefined;
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

});
