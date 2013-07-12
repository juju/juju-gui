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
  var Y, container, Search;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-search-widget',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Search = Y.juju.widgets.browser.Search;
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
  });

  afterEach(function() {
    container.remove(true);
  });

  it('needs to render from the template', function() {
    var search = new Search();
    search.render(container);
    assert.isObject(container.one('.bws-searchbox'));
  });

  it('should support setting search string', function() {
    var search = new Search();
    search.render(container);

    search.updateSearch('test');
    container.one('input').get('value').should.eql('test');
  });

  it('supports an onHome event', function(done) {
    var search = new Search();
    search.render(container);

    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });

    container.one('i.home').simulate('click');
  });

  it('clicking on the home link also works', function(done) {
    var search = new Search();
    search.render(container);

    search.on(search.EVT_SEARCH_GOHOME, function() {
      done();
    });

    container.one('a.home').simulate('click');
  });

});
