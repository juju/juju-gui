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
        'added-services-button-extension',
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

    it('fires changeState from the __changeState method', function() {
      var testData = { foo: 'bar' };
      var fire = utils.makeStubMethod(testView, 'fire');
      testView.__changeState(testData);
      assert.equal(fire.callCount(), 1);
      var fireArgs = fire.lastArguments();
      assert.equal(fireArgs[0], 'changeState');
      assert.deepEqual(fireArgs[1], testData);
    });

    it('calls to render the AddedServicesButton', function() {
      var serviceCount = 7,
          closed = true;

      var struct = utils.makeStubReactComponent(views, 'AddedServicesButton', {
        render: function() {
          assert.equal(this.props.serviceCount, serviceCount);
          assert.equal(this.props.closed, closed);
        }
      });
      this._cleanups.push(struct.reset);

      testView._renderAddedServicesButton(serviceCount, closed);
      assert.equal(struct.assertions.render.callCount(), 1)
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
      assert.isNotNull(btnContainer.one('.added-services-open'));
      assert.isNull(btnContainer.one('.added-services-close'));
      button.set('closed', false);
      button.render();
      assert.isNull(btnContainer.one('.added-services-open'));
      assert.isNotNull(btnContainer.one('.added-services-close'));
    });
  });

});
