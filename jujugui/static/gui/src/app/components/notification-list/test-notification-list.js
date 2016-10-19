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

const juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('NotificationList', function() {

  let clock;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('notification-list', function() { done(); });
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('renders a list based on the notification passed in', () => {
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={notification}/>, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const children = output.props.children;
    const items = [
      <juju.components.NotificationListItem
        key={notification.timestamp}
        timestamp={notification.timestamp}
        ref={'NotificationListItem' + notification.timestamp}
        removeNotification={children[0].props.removeNotification}
        message={notification.message}
        timeout={undefined}
        type={notification.level} />];
    const expected = (
      <ul className="notification-list"
          onMouseOver={instance._clearTimeouts}
          onMouseOut={instance._restartTimeouts}>
        {items}
      </ul>
    );
    assert.deepEqual(output, expected);
  });

  it('can render with no notifications', () => {
    const output = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={null}/>);
    assert.deepEqual(output.props.children[0], undefined);
  });

  it('can render notifications after rendering none', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={null}/>, true);
    const output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0], undefined);
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    renderer.render(
      <juju.components.NotificationList
        notification={notification}/>);
    const instance = renderer.getMountedInstance();
    // Updates to state don't re-render when using the shallow renderer
    // so just checking that the state gets updated.
    assert.deepEqual(instance.state, {
      notifications: {
        12345: {
          message: 'notification message',
          type: 'info',
          timestamp: '12345'
        }
      }
    });
  });

  it('times out non error messages', () => {
    const notification = {
      key: '12345',
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const timeout = 500;
    const renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        timeout={timeout}
        notification={notification}/>, this);
    const instance = renderer.getMountedInstance();
    const key = 'NotificationListItem' + notification.timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 1);
  });

  it('does not time out error messages', () => {
    const notification = {
      key: '12345',
      timestamp: '12345',
      message: 'notification message',
      level: 'error'
    };
    const timeout = 500;
    const renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        timeout={timeout}
        notification={notification}/>, this);
    const instance = renderer.getMountedInstance();
    const key = 'NotificationListItem' + notification.timestamp;
    const refs = {};
    const hideStub = sinon.stub();
    refs[key] = { hide: hideStub };
    instance.refs = refs;
    // Trigger the timeout.
    clock.tick(timeout + 10);
    assert.equal(hideStub.callCount, 0);
  });

  it('can clear and restart timeouts', () => {
    const longTimeout = 10000;
    const notification = {
      timestamp: '12345',
      message: 'notification message',
      level: 'info'
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.NotificationList
        notification={notification}
        timeout={longTimeout} />, this);
    const instance = renderer.getMountedInstance();
    renderer.getRenderOutput();
    assert.equal(instance.timeouts.length, 1,
                 'notification timeouts were not populated');
    instance._clearTimeouts();
    assert.equal(instance.timeouts.length, 0,
                 'notification timeouts did not clear');
    instance._restartTimeouts();
    assert.equal(instance.timeouts.length, 1,
                 'notification timeouts were not restarted');
    // Let everything clear out.
    clock.tick(longTimeout + 10);
  });
});
