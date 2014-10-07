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

describe('added services view', function() {
  var Y, view, View, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'juju-tests-utils',
        'juju-added-services',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          View = Y.juju.browser.views.AddedServices;
          done();
        });
  });

  beforeEach(function() {
    view = new View();
  });

  afterEach(function(done) {
    if (view) {
      view.after('destroy', function() { done(); });
      view.destroy();
    }
  });

  it('is extended by the search widget', function() {
    assert.notEqual(view._renderSearchWidget, undefined);
  });

  describe('render', function() {
    var renderSearch;

    beforeEach(function() {
      renderSearch = utils.makeStubMethod(view, '_renderSearchWidget');
      this._cleanups.push(renderSearch.reset);
    });

    it('appends the template to the container', function() {
      view.render();
      var container = view.get('container');
      assert.notEqual(container.one('.search-widget'), null);
      assert.notEqual(container.one('.services-list'), null);
    });

    it('calls to render the search widget on render', function() {
      view.render();
      assert.equal(renderSearch.calledOnce(), true);
    });
  });

  describe('destroy', function() {

    it('removes the container from the DOM', function() {
      view.render();
      var container = view.get('container');
      assert.notEqual(container.getDOMNode(), null,
                      'Container is not present in DOM.');
      assert.notEqual(container.one('.services-list'), null,
                      'Template HTML is not present in DOM');
      view.destroy();
      assert.equal(container.getDOMNode(), null,
                   'Container is still present in DOM');
      assert.equal(container.one('.services-list'), null,
                   'Template HTML is still present in DOM');
    });
  });
});
