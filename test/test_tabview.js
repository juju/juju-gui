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
      container = utils.makeContainer(this, 'container');
      var testcontent = [
        '<div class="tabs">',
        '<nav><ul>',
        '<li><a href="#test1">Test1</a></li>',
        '<li><a href="#test2">Test2</a></li>',
        '</ul>',
        '<div class="selected"></div>',
        '</nav>',
        '<div class="tab-panels"><div class="tab-carousel">',
        '<div id="test1" class="tab-panel"></div>',
        '<div id="test2" class="tab-panel"></div>',
        '</div></div></div>'
      ].join();
      Y.Node.create(testcontent).appendTo(container);
      tabview = new Y.juju.widgets.browser.TabView({
        container: container.one('.tabs'),
        skipAnchorNavigation: true
      });
    });

    afterEach(function() {
      container.remove(true);
      tabview.destroy();
    });

    it('exists', function() {
      assert.isObject(tabview);
    });

    it('initializes showing it\'s first tab', function() {
      tabview.render(container);
      assert.equal(tabview.get('selection'), container.one('nav a'));
    });

    it('changes position to the selected tab', function() {
      tabview.render(container);
      var tabContainer = tabview.get('container'),
          tabCarousel = tabContainer.one('.tab-carousel');
      tabContainer.one('nav a[href="#test2"]').simulate('click');
      assert.equal(tabCarousel.getStyle('left'), '-750px');
    });

    it('sets selected tabs', function() {
      tabview.render(container);
      var tabContainer = tabview.get('container'),
          link = tabContainer.one('nav a[href="#test2"]');
      link.simulate('click');
      assert.equal(tabview.get('selection'), link);
    });

    it('fires a change event when the selection has changed', function(done) {
      tabview.render(container);
      var tabContainer = tabview.get('container'),
          tabCarousel = tabContainer.one('.tab-carousel');
      tabview.on('selectionChange', function(e) {
        assert.equal(tabCarousel.getStyle('left'), '-750px');
        done();
      });
      tabContainer.one('nav a[href="#test2"]').simulate('click');
    });

    it('fires a completed event when the carousel has moved', function(done) {
      tabview.render(container);
      var tabContainer = tabview.get('container'),
          eventCount = 0;
      tabview.on('selectionChangeComplete', function(e) {
        // Need to ignore the first selectionChangeComplete event that is fired
        // upon the TabView setup.
        eventCount += 1;
        if (eventCount === 2) {
          assert.equal(tabContainer.one('#test1').getStyle('height'), '1px');
          assert.equal(tabContainer.one('#test2').getStyle('height'), 'auto');
          done();
        }
      });
      tabview.setTab(tabContainer.one('nav a[href="#test2"]'));
      tabContainer.one('.tab-carousel').fire('transitionend');
    });
  });

})();
