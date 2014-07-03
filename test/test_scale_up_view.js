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

describe('scale-up view', function() {

  var container, utils, view, View, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        'scale-up-view',
        'juju-tests-utils',
        'node-event-simulate',
        function() {
          utils = Y.namespace('juju-tests').utils;
          View = Y.namespace('juju.viewlets').ScaleUp;
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this);
  });

  afterEach(function(done) {
    if (view) {
      view.destroy();
    }
  });

  function instantiateView() {
    view = new View({
      container: container
    });
    return view;
  }

  function testEventBinding(options, context) {
    var stub = utils.makeStubMethod(View.prototype, options.stubMethod);
    context._cleanups.push(stub.reset);
    instantiateView().render();
    var button = container.one(options.buttonSelector);
    // Open the scale-up view.
    button.simulate('click');
    assert.equal(stub.calledOnce(), true, options.stubMethod + ' not called');
  }

  function testSetStateClass(options, context) {
    instantiateView().render();
    var update = utils.makeStubMethod(view, 'updateStateClass');
    context._cleanups.push(update.reset);
    var prevent = utils.makeStubFunction();
    var event = options.customEvent || { preventDefault: prevent };
    view[options.method](event);
    if (typeof event.preventDefault === 'function') {
      assert.equal(prevent.calledOnce(), true);
    }
    assert.equal(update.calledOnce(), true);
    assert.equal(update.lastArguments()[0], options.className);
  }

  it('can be instantiated', function() {
    instantiateView();
    assert.equal(view instanceof View, true);
  });

  it('can render its template to its container', function() {
    instantiateView().render();
    assert.isNotNull(view.get('container').one('.view-container'));
  });

  it('clicking the + calls to open the scale up options', function() {
    testEventBinding({
      stubMethod: '_showScaleUp',
      buttonSelector: '.add.button'
    }, this);
  });

  it('clicking the x calls to close the scale up options', function() {
    testEventBinding({
      stubMethod: '_hideScaleUp',
      buttonSelector: '.placement .cancel.button'
    }, this);
  });

  it('changing the radio button calls to change constraints visibility',
      function() {
        testEventBinding({
          stubMethod: '_toggleConstraints',
          buttonSelector: 'input#manually-place'
        }, this);
      });

  it('clicking the constraints Edit calls to show the constraints inputs',
      function() {
        testEventBinding({
          stubMethod: '_toggleEditConstraints',
          buttonSelector: '.edit.link'
        }, this);
      });

  it('clicking the cancel button calls to close the scale-up UI', function() {
    testEventBinding({
      stubMethod: '_hideScaleUp',
      buttonSelector: '.inspector-buttons .cancel'
    }, this);
  });

  it('clicking the confirm button calls to submit scale-up data', function() {
    testEventBinding({
      stubMethod: '_submitScaleUp',
      buttonSelector: '.inspector-buttons .confirm'
    }, this);
  });

  it('_showScaleUp calls to set the proper state class', function() {
    testSetStateClass({
      method: '_showScaleUp',
      className: 'per-machine'
    }, this);
  });

  it('_hideScaleUp calls to the proper state class', function() {
    testSetStateClass({
      method: '_hideScaleUp',
      className: 'default'
    }, this);
  });

  it('_toggleEditConstraints calls to set the proper state class', function() {
    testSetStateClass({
      method: '_toggleEditConstraints',
      className: 'constraints'
    }, this);
  });

  it('_toggleConstraints sets the proper state data(manual place)', function() {
    testSetStateClass({
      method: '_toggleConstraints',
      customEvent: {
        currentTarget: {
          get: function() { return 'manually-place'; }
        }
      },
      className: 'manual'
    }, this);
  });

  it('_toggleConstraints sets the proper state data(auto place)', function() {
    testSetStateClass({
      method: '_toggleConstraints',
      customEvent: {
        currentTarget: {
          get: function() { return 'unit-per-machine'; }
        }
      },
      className: 'per-machine'
    }, this);
  });
});
