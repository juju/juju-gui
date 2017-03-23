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
  let appState;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('env-size-display', function() { done(); });
  });

  beforeEach(function() {
    appState = {
      current: {
        gui: {
          machine: true
        }
      },
      changeState: sinon.stub()
    };
  });

  it('shows applications and machines count', function() {
    var pluralize = sinon.stub();
    pluralize.withArgs('application').returns('applications');
    pluralize.withArgs('machine').returns('machines');
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          appState={appState}
          machineCount={4}
          pluralize={pluralize}
          serviceCount={3} />);
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=application]').innerText, '3 applications');
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=machine]').innerText, '4 machines');
  });

  it('highlights active tab on initial render', function() {
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount={3}
          machineCount={4}
          appState={appState}
          pluralize={sinon.stub()} />);
    assert.notEqual(
        queryComponentSelector(
            component,
            '.env-size-display__list-item.is-active a[data-view=machine]'),
            null);
  });

  it('calls to change state when list item is clicked', function() {
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount={3}
          machineCount={4}
          appState={appState}
          pluralize={sinon.stub()} />);
    var serviceLink = queryComponentSelector(component,
      'a[data-view=application]');
    var machineLink = queryComponentSelector(component,
      'a[data-view=machine]');
    testUtils.Simulate.click(machineLink);
    testUtils.Simulate.click(serviceLink);

    assert.equal(appState.changeState.callCount, 2);
    assert.deepEqual(appState.changeState.getCall(0).args[0], {
      gui: {machines: ''}
    });
    assert.deepEqual(appState.changeState.getCall(1).args[0], {
      gui: {machines: null}
    });
  });

  it('highlights the tab which was clicked on', function() {
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount={3}
          machineCount={4}
          appState={appState}
          pluralize={sinon.stub()} />);
    var serviceLink = queryComponentSelector(component,
      'a[data-view=application]');
    var machineLink = queryComponentSelector(component,
      'a[data-view=machine]');

    testUtils.Simulate.click(machineLink);
    assert.notEqual(
        queryComponentSelector(
            component,
            '.env-size-display__list-item.is-active a[data-view=machine]'),
            null);
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        machines: ''
      }
    });
    delete appState.current.gui.machine;
    appState.current.gui.application = true;
    testUtils.Simulate.click(serviceLink);
    assert.notEqual(
        queryComponentSelector(
            component,
            '.env-size-display__list-item.is-active a[data-view=application]'),
            null);

    assert.equal(appState.changeState.callCount, 2);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        machines: ''
      }
    });
  });
});
