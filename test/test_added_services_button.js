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

describe('added services button', function() {
  var utils, views, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'view',
        'base-build',
        'juju-tests-utils',
        'added-services-button',
        'node-event-simulate',
        function(Y) {
          utils = Y.namespace('juju-tests.utils');
          views = Y.namespace('juju.views');
          done();
        });
  });

  describe('AddedServicesButtonExtension', function() {
    var container, TestView, testView;

    before(function() {
      TestView = Y.Base.create(
          'test-view', Y.View, [views.AddedServicesButtonExtension], {});
    });

    beforeEach(function() {
      container = utils.makeContainer(this);
      container.setHTML('<div class="added-services-button"></div>');
      testView = new TestView({
        container: container
      });
    });

    afterEach(function() {
      testView.destroy();
    });

    it('creates a new instance of the added services button', function() {
      assert.strictEqual(testView._addedServicesButton, undefined);
      testView._renderAddedServicesButton();
      assert.equal(
          testView._addedServicesButton instanceof views.AddedServicesButton,
          true);
    });

    it('renders the button to the DOM', function() {
      assert.strictEqual(container.one('.action-indicator'), null);
      testView._renderAddedServicesButton();
      assert.equal(container.one('.action-indicator') instanceof Y.Node, true);
    });

    it('updates existing added services button', function() {
      testView._renderAddedServicesButton();
      assert.equal(testView._addedServicesButton.get('serviceCount'), 0);
      testView._renderAddedServicesButton(99);
      assert.equal(testView._addedServicesButton.get('serviceCount'), 99);
    });
  });

  describe('AddedServicesButton', function() {
    var container, button;

    beforeEach(function() {
      container = utils.makeContainer(this);
      container.setHTML('<div class="added-services-button"></div>');
      button = new views.AddedServicesButton({
        serviceCount: 1,
        closed: true,
        container: container
      });
    });

    afterEach(function() {
      button.destroy();
    });

    it('binds a click handler which fires a changestate event', function(done) {
      button.on('changeState', function() {
        done();
      });
      button.get('container').simulate('click');
    });

    it('shows the supplied service count', function() {
      button.render();
      assert.equal(
          button.get('container').get('text').indexOf('(1)') > 0, true);
    });

    it('shows the proper indicator to open or close the view', function() {
      button.render();
      var btnContainer = button.get('container');
      assert.equal(btnContainer.get('text').indexOf('>') > 0, true);
      assert.equal(btnContainer.get('text').indexOf('x') > 0, false);
      button.set('closed', false);
      button.render();
      assert.equal(btnContainer.get('text').indexOf('>') > 0, false);
      assert.equal(btnContainer.get('text').indexOf('x') > 0, true);
    });
  });

});
