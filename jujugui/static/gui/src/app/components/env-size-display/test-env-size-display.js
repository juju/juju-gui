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
var renderIntoDocument = testUtils.renderIntoDocument;

function queryComponentSelector(component, selector, all) {
  var queryFn = (all) ? 'querySelectorAll' : 'querySelector';
  return ReactDOM.findDOMNode(component)[queryFn](selector);
}

describe('EnvSizeDisplay', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('env-size-display', function() { done(); });
  });

  it('shows services and machines count', function() {
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}} />);
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=service]').innerText, '3 services');
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=machine]').innerText, '4 machines');
  });

  it('highlights active tab on initial render', function() {
    var getAppStateStub = sinon.stub();
    getAppStateStub.returns('machine');

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={getAppStateStub} />);

    assert.equal(getAppStateStub.callCount, 1);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=machine]'), null);
  });

  it('calls to change state when list item is clicked', function() {
    var changeStateStub = sinon.stub();

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}}
          changeState={changeStateStub} />);
    var serviceLink = queryComponentSelector(component, 'a[data-view=service]');
    var machineLink = queryComponentSelector(component, 'a[data-view=machine]');
    testUtils.Simulate.click(machineLink);
    testUtils.Simulate.click(serviceLink);

    assert.equal(changeStateStub.callCount, 2);
    assert.deepEqual(changeStateStub.getCall(0).args[0], {
      sectionB: { component: 'machine', metadata: {} }
    });
    assert.deepEqual(changeStateStub.getCall(1).args[0], {
      sectionB: { component: null, metadata: {} }
    });
  });

  it('highlights the tab which was clicked on', function() {
    var changeStateStub = sinon.stub();

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}}
          changeState={changeStateStub} />);
    var serviceLink = queryComponentSelector(component, 'a[data-view=service]');
    var machineLink = queryComponentSelector(component, 'a[data-view=machine]');

    testUtils.Simulate.click(machineLink);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=machine]'), null);

    testUtils.Simulate.click(serviceLink);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=service]'), null);

    assert.equal(changeStateStub.callCount, 2);
  });
});
