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
      // Need the handlebars helper for the charm-token to render.
      Y.Handlebars.registerHelper(
          'charmFilePath',
          function(charmID, file) {
            return '/path/to/charm/' + file;
          });
      window.flags.ac = true;
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
    delete window.flags.ac;
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

  it('supports autocompletion while entering text', function(done) {
    // Create our own search instance.
    search.destroy();
    container.remove(true);
    container = utils.makeContainer('container');

    // We need a valid store instance to send back the data.
    var data = utils.loadFixture('data/autocomplete.json');
    var fakeStore = new Y.juju.Charmworld2({});

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
      autocompleteDataFormatter: fakeStore.resultsToCharmlist,
      filters: {}
    });
    search.render(container);
    search.ac.queryDelay = 0;

    search.ac.on('results', function(ev) {
      // The results should be displaying now. Check for charm-token nodes.
      assert.equal(ev.results.length, 19);
      assert.isTrue(ev.results[0].display.hasClass('yui3-charmtoken'));
      fakeStore.destroy();
      done();
    });

    // hack into the ac widget to simulate the valueChange event
    search.ac._afterValueChange({
      newVal: 'test',
      src: 'ui'
    });

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
