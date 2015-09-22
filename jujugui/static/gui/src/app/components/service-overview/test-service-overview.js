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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

describe('ServiceOverview', function() {
  var listItemStub, icons, fakeService;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('service-overview', function() { done(); });
  });

  beforeEach(function() {
    fakeService = {
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }};
    // Set icons to null so we can check if they were stored
    // here in the afterEach.
    icons = null;
    stubIcons();
  });

  afterEach(function() {
    // Make sure we reset the icons after every test even if it fails
    // so that we don't cause cascading failures.
    resetIcons();
  });

  function stubIcons() {
    icons = juju.components.ServiceOverview.icons;
    juju.components.ServiceOverview.prototype.icons = {};
  }

  function resetIcons() {
    if (icons !== null) {
      juju.components.ServiceOverview.prototype.icons = icons;
    }
  }

  it('shows the all units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{}, {}];
          }
        };
      }};

    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            service={service}/>);
    var value = 2;
    assert.deepEqual(output.props.children[0].props.children[0],
      <juju.components.OverviewAction
        icon={undefined}
        key="Units"
        title="Units"
        value={value}
        valueType={undefined}
        link={undefined}
        linkTitle={undefined}
        action={output.props.children[0].props.children[0].props.action} />);
  });

  it('navigates to the unit list when All Units is clicked', function() {
    var getStub = sinon.stub();
    getStub.withArgs('units').returns({toArray: function() {
      return [{}, {}];
    }});
    getStub.withArgs('id').returns('demo');
    var service = {
      get: getStub
    };
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            changeState={changeState}
            service={service} />);
    // call the action method which is passed to the child to make sure it
    // is hooked up to the changeState method.
    output.props.children[0].props.children[0].props.action({
      currentTarget: {
        getAttribute: function() { return 'Units'; }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'demo',
          activeComponent: 'units'
        }
      }
    });
  });

  it('shows the uncommitted units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [
              {agent_state: 'uncommitted'},
              {agent_state: 'started'},
              {}
              ];
          }
        };
      }};
    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            service={service}/>);
    var value = 2;
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Uncommitted"
        title="Uncommitted"
        value={value}
        icon={undefined}
        action={undefined}
        valueType="uncommitted"
        link={undefined}
        linkTitle={undefined} />);
  });

  it('shows the pending units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'pending'}];
          }
        };
      }};
    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            service={service}/>);
    var value = 1;
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Pending"
        title="Pending"
        value={value}
        icon={undefined}
        action={undefined}
        valueType='pending'
        link={undefined}
        linkTitle={undefined} />);
  });

  it('shows the errors units action', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'error'}];
          }
        };
      }};
    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            service={service}/>);
    var value = 1;
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Errors"
        title="Errors"
        value={value}
        icon={undefined}
        action={undefined}
        valueType="error"
        link={undefined}
        linkTitle={undefined} />);
  });

  it('renders the delete button', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        service={fakeService} />);
    var buttons = [{
      title: 'Destroy',
      action: output.props.children[1].props.buttons[0].action
      }];
    assert.deepEqual(output.props.children[1],
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('renders the delete confirmation', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        service={fakeService} />);
    var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    var confirmMessage = 'Are you sure you want to destroy the service? ' +
        'This cannot be undone.';
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={undefined}
        buttons={buttons} />);
  });

  it('shows the confirmation when the delete button is clicked', function() {
    var confirmMessage = 'Are you sure you want to destroy the service? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        service={fakeService} />, true);
    var output = shallowRenderer.getRenderOutput();
      var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    // Fire the click action.
    output.props.children[1].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.ServiceOverview
        service={fakeService} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={true}
        buttons={buttons} />);
  });

  it('hides the confirmation when the cancel button is clicked', function() {
    var confirmMessage = 'Are you sure you want to destroy the service? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        service={fakeService} />, true);
    var output = shallowRenderer.getRenderOutput();
      var buttons = [
        {
          title: 'Cancel',
          action: output.props.children[2].props.buttons[0].action
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
    // Open the confirmation.
    output.props.children[1].props.buttons[0].action();
    // close the confirmation.
    output.props.children[2].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.ServiceOverview
        service={fakeService} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={buttons} />);
  });
});
