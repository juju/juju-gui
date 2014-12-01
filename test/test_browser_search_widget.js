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

  it('clicking on the home link also works', function(done) {
    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });
    container.one('.home').simulate('click');
  });

});
