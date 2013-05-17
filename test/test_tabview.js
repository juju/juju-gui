/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012  Canonical Ltd.
Copyright (C) 2013  Canonical Ltd.

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


(function() {

  describe('tabview', function() {
    var container, Y, tabview, utils;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-tests-utils',
        'browser-tabview', 'node', 'node-event-simulate'
      ], function(Y) {
        utils = Y.namespace('juju-tests.utils');
        done();
      });
    });

    beforeEach(function() {
      container = utils.makeContainer('container');
      tabview = new Y.juju.widgets.browser.TabView();
    });

    afterEach(function() {
      container.remove(true);
      tabview.destroy();
    });

    it('exists', function() {
      assert.isObject(tabview);
    });

    it('can be rendered horizontally', function() {
      assert.isFalse(tabview.get('vertical'));
      tabview.render(container);
      assert.isNull(container.one('.vertical'));
    });

    it('can be rendered vertically', function() {
      tabview = new Y.juju.widgets.browser.TabView({vertical: true});
      assert.isTrue(tabview.get('vertical'));

      tabview.render(container);
      assert.isObject(container.one('.vertical'));
    });
  });

})();
