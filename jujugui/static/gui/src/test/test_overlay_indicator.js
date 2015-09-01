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

describe('overlay indicator', function() {
  var container, indicator, utils, widget, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['browser-overlay-indicator',
      'juju-tests-utils', 'node'],
    function(Y) {
      widget = Y.juju.widgets.browser;
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
  });

  afterEach(function() {
    if (indicator) {
      indicator.destroy();
    }
  });

  it('exists', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator();
    assert.isObject(indicator);
  });

  it('gets target from config', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    assert.equal(container, indicator.get('target'));
  });

  it('appends itself to target parent', function() {
    var child = Y.Node.create('<div/>');
    container.appendChild(child);
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: child});
    indicator.render();
    assert.equal(container, indicator.get('boundingBox').get('parentNode'));
  });

  it('has a spinner', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    indicator.setBusy();
    assert.isObject(container.one('.spinner'));
  });

  it('starts invisible', function() {
    // OverlayIndicator widgets should start hidden.
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    assert.isFalse(indicator.get('visible'));
    assert.isTrue(indicator.get('boundingBox').hasClass(
        'yui3-overlay-indicator-hidden'));
  });

  it('shows on setBusy', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    indicator.setBusy();
    assert.isTrue(indicator.get('visible'));
    assert.isFalse(indicator.get('boundingBox').hasClass(
        'yui3-overlay-indicator-hidden'));
  });

  it('size matches on setBusy', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    // Mess with the size of target div.
    var expected_width = 800,
        expected_height = 600;
    container.set('offsetWidth', expected_width);
    container.set('offsetHeight', expected_height);
    assert.notEqual(
        expected_width,
        indicator.get('boundingBox').get('offsetWidth'));
    assert.notEqual(
        expected_height,
        indicator.get('boundingBox').get('offsetHeight'));
    indicator.setBusy();
    assert.equal(
        expected_width,
        indicator.get('boundingBox').get('offsetWidth'));
    assert.equal(
        expected_height,
        indicator.get('boundingBox').get('offsetHeight'));
  });

  it('position matches on setBusy', function() {
    // OverlayIndicator should always reposition itself before setBusy.
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    // Change the position of target div.
    var expected_xy = [100, 300],
        actual_xy = indicator.get('boundingBox').getXY();
    container.setXY(expected_xy);
    assert.notEqual(expected_xy[0], actual_xy[0]);
    assert.notEqual(expected_xy[1], actual_xy[1]);
    indicator.setBusy();
    var final_xy = indicator.get('boundingBox').getXY();

    // (IE 10 on Win 8) The position of this indicator is positioned slightly
    // different each time this test is run so as long as it falls within
    // this range it is fine.
    assert.equal(
        (final_xy[0] > expected_xy[0] - 5) &&
        (final_xy[0] < expected_xy[0] + 5), true);
    assert.equal(
        (final_xy[1] > expected_xy[1] - 5) &&
        (final_xy[1] < expected_xy[1] + 5), true);
  });

  it('hides on success', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    indicator.setBusy();
    indicator.success();
    assert.isFalse(indicator.get('visible'));
    assert.isTrue(indicator.get('boundingBox').hasClass(
        'yui3-overlay-indicator-hidden'));
  });

  it('can have a success callback', function() {
    var called = false;
    indicator = new Y.juju.widgets.browser.OverlayIndicator({
      target: container,
      success_action: function() {
        called = true;
      }
    });
    indicator.render();
    indicator.success();
    assert.isTrue(called);
  });

  it('hides on error', function() {
    indicator = new Y.juju.widgets.browser.OverlayIndicator(
        {target: container});
    indicator.render();
    indicator.setBusy();
    indicator.error();
    assert.isFalse(indicator.get('visible'));
    assert.isTrue(indicator.get('boundingBox').hasClass(
        'yui3-overlay-indicator-hidden'));
  });

  it('can have an error callback', function() {
    var called = false;
    indicator = new Y.juju.widgets.browser.OverlayIndicator({
      target: container,
      error_action: function() {
        called = true;
      }
    });
    indicator.render();
    indicator.error();
    assert.isTrue(called);
  });

  it('indicator manager wires into an object properly', function() {
    var TestClass = Y.Base.create(
        'testclass',
        Y.Base,
        [widget.IndicatorManager]);
    var test_instance = new TestClass();
    test_instance._indicators.should.eql({});
    assert(typeof(test_instance.showIndicator) === 'function');
    assert(typeof(test_instance.hideIndicator) === 'function');
  });

  it('indicator manager only creates one indicator per node id', function() {
    var TestClass = Y.Base.create(
        'testclass',
        Y.Base,
        [widget.IndicatorManager]);
    var test_instance = new TestClass();
    test_instance.showIndicator(container);
    test_instance.showIndicator(container);

    assert(Y.Object.keys(test_instance._indicators).length === 1);

    test_instance.destroy();
  });

  it('indicator manager handles cleanup', function(done) {
    var TestClass = Y.Base.create(
        'testclass',
        Y.Base,
        [widget.IndicatorManager], {
          _destroyIndicators: function() {
            // override the cleanup method to check it's called.
            Y.Object.each(this._indicators, function(ind, key) {
              ind.destroy();
            });
            done();
          }
        });

    var test_instance = new TestClass();
    test_instance.showIndicator(container);
    test_instance.destroy();
  });


});
