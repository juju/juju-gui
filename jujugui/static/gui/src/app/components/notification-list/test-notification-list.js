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

describe('NotificationList', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('notification-list', function() { done(); });
  });

  it('renders a list based on the notification passed in', () => {
    var notification = {
      timestamp: '12345',
      description: 'notification content',
      level: 'info'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={notification}/>);
    var children = output.props.children;
    var items = [
      <juju.components.NotificationListItem
        key={notification.timestamp}
        timestamp={notification.timestamp}
        ref={'NotificationListItem' + notification.timestamp}
        removeNotification={children.props.children[0].props.removeNotification}
        content={notification.description}
        timeout={undefined}
        type={notification.level} />];
    var expected = (
      <div className="notification-list">
        <ul>{items}</ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render with no notifications', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={null}/>);
    assert.deepEqual(output.props.children[0], undefined);
  });

  it('can render notifications after rendering none', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={null}/>, true);
    var output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0], undefined);
    var notification = {
      timestamp: '12345',
      description: 'notification content',
      level: 'info'
    };
    renderer.render(
      <juju.components.NotificationList
        notification={notification}/>);
    var instance = renderer.getMountedInstance();
    // Updates to state don't re-render when using the shallow renderer
    // so just checking that the state gets updated.
    assert.deepEqual(instance.state, {
      notifications: {
        12345: {
          content: 'notification content',
          type: 'info'
        }
      }
    });
  });

  it('times out non error messages', (done) => {
    var notification = {
      timestamp: '12345',
      description: 'notification content',
      level: 'info'
    };
    var timeout = 1;
    var renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        timeout={timeout}
        notification={notification}/>, this);
    var instance = renderer.getMountedInstance();
    // Fake the ref being created for the list item;
    instance.refs = {
      NotificationListItem12345: {
        hide: () => {
          done();
        }
      }
    };
  });

  it('does not time out error messages', () => {
    var notification = {
      timestamp: '12345',
      description: 'notification content',
      level: 'error'
    };
    var timeout = 1;
    var renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        timeout={timeout}
        notification={notification}/>, this);
    var instance = renderer.getMountedInstance();
    // Fake the ref being created for the list item;
    instance.refs = {
      NotificationListItem12345: {
        hide: () => {
          // If it gets here then it's setting the timeout.
          assert.fail();
        }
      }
    };
  });

});
