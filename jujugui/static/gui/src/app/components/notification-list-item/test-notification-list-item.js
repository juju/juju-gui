/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('NotificationListItem', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('notification-list-item', function() { done(); });
  });

  it('renders a notification list item', () => {
    var message = 'notification message';
    var classes = 'notification-list-item notification-list-item--info ' +
      'notification-list-item--visible';
    var renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationListItem
        message={message}
        removeNotification={sinon.stub()}
        timestamp="123"
        type="info"/>, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <li className={classes}
        onClick={instance.hide}>
        <span>{message}</span>
        <span tabIndex="0" role="button"
          className="notification-list-item__hide">
          <juju.components.SvgIcon name="close_16"
            size="16" />
        </span>
      </li>);
    assert.deepEqual(output, expected);
  });

  it('adds the proper type class to the container', () => {
    var classes = 'notification-list-item notification-list-item--error ' +
      'notification-list-item--visible';
    var output = jsTestUtils.shallowRender(
      <juju.components.NotificationListItem
        message="message"
        removeNotification={sinon.stub()}
        timestamp="123"
        type="error"/>);
    assert.equal(output.props.className, classes);
  });

  it('updates class and calls to remove itself after hiding', (done) => {
    var timestamp = '123456';
    var timeout = 1;
    var removeNotification = function(ts) {
      assert.equal(ts, timestamp);
      done();
    };
    var component = testUtils.renderIntoDocument(
      <juju.components.NotificationListItem
        message="message"
        removeNotification={removeNotification}
        timestamp={timestamp}
        // Used to shorten the test time by setting the setTimeouts to 0.
        timeout={timeout}
        type="info"/>);
    var element = ReactDOM.findDOMNode(component);
    // Check that it's rendered with the proper classes.
    assert.isTrue(
      element.classList.contains('notification-list-item--visible'));
    assert.isFalse(
      element.classList.contains('notification-list-item--hidden'));
    testUtils.Simulate.click(element);
    // After a click it should have the classes updated.
    assert.isFalse(
      element.classList.contains('notification-list-item--visible'));
    assert.isTrue(
      element.classList.contains('notification-list-item--hidden'));
  });

});
