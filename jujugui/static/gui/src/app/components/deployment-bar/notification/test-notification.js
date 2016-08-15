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
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentBarNotification', function() {
  var clearTimeout, setTimeout;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-bar-notification', function() { done(); });
  });

  beforeEach(function() {
    clearTimeout = window.clearTimeout;
    window.clearTimeout = sinon.stub();
    setTimeout = window.setTimeout;
    window.setTimeout = sinon.stub();
  });

  afterEach(function() {
    window.clearTimeout = clearTimeout;
    window.setTimeout = setTimeout;
  });

  it('can render a notification', function() {
    var change = {
      description: 'Django added'
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.DeploymentBarNotification
          change={change} />);
    assert.deepEqual(output,
        <div className="deployment-bar__notification"
          onClick={output.props.onClick}
          ref="deploymentBarNotificationContainer">
          Django added
        </div>);
  });

  it('can hide the notification when it is clicked', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.DeploymentBarNotification
          change={change} />);
    output.props.onClick();
    assert.deepEqual(output,
        <div className="deployment-bar__notification"
          onClick={output.props.onClick}
          ref="deploymentBarNotificationContainer">
          Django added
        </div>);
    assert.equal(window.clearTimeout.callCount, 1);
  });

  it('can show a notification for the provided change', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    // Have to render to the document here as the shallow renderer does not
    // support componentDidMount or componentWillReceiveProps.
    var output = testUtils.renderIntoDocument(
        <juju.components.DeploymentBarNotification
          change={change} />);
    assert.isTrue(
        output.refs.deploymentBarNotificationContainer
              .classList.contains('deployment-bar__notification--visible'));
    assert.equal(window.clearTimeout.callCount, 1);
    assert.equal(window.setTimeout.callCount, 1);
  });

  it('does not show a notification more than once', function() {
    var change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    // Have to render to the document here as the shallow renderer does not
    // support componentDidMount or componentWillReceiveProps.
    var node = document.createElement('div');
    var component = ReactDOM.render(
        <juju.components.DeploymentBarNotification
          change={change} />, node);

    testUtils.Simulate.click(ReactDOM.findDOMNode(component));
    var container = component.refs.deploymentBarNotificationContainer;
    assert.equal(container.classList.length, 1);
    ReactDOM.render(
        <juju.components.DeploymentBarNotification
          change={change} />, node);
    assert.equal(window.setTimeout.callCount, 1);
    assert.equal(container.classList.length, 1);
  });
});
