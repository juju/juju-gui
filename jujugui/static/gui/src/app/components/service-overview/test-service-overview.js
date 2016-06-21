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

describe('ServiceOverview', function() {
  var acl, fakeService;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('service-overview', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    fakeService = {
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }};
  });

  function getUnitStatusCounts(error=0, pending=0, uncommitted=0) {
    return sinon.stub().returns({
      error: {size: error},
      pending: {size: pending},
      uncommitted: {size: uncommitted}
    });
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
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts()}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[0],
      <juju.components.OverviewAction
        icon="units"
        key="Units"
        title="Units"
        value={2}
        valueType="all"
        linkAction={undefined}
        linkTitle={undefined}
        action={output.props.children[0].props.children[0].props.action} />);
  });

  it('shows the all units action even if there are no units', function() {
    var service = {
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }};

    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts()}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[0],
      <juju.components.OverviewAction
        icon="units"
        key="Units"
        title="Units"
        value={0}
        valueType="all"
        linkAction={undefined}
        linkTitle={undefined}
        action={output.props.children[0].props.children[0].props.action} />);
  });

  it('navigates to the unit list when All Units is clicked', function() {
    var getStub = sinon.stub();
    getStub.withArgs('units').returns({toArray: function() {
      return [{}, {}];
    }});
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(true);
    var service = {
      get: getStub
    };
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts()}
            changeState={changeState}
            service={service}
            serviceRelations={[1]} />);
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
          activeComponent: 'units',
          unitStatus: null
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
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts(0, 0, 2)}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Uncommitted"
        title="Uncommitted"
        value={2}
        icon={undefined}
        action={output.props.children[0].props.children[1].props.action}
        valueType="uncommitted"
        linkAction={undefined}
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
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts(0, 1, 0)}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Pending"
        title="Pending"
        value={1}
        icon={undefined}
        action={output.props.children[0].props.children[1].props.action}
        valueType='pending'
        linkAction={undefined}
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
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts(1, 0, 0)}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Errors"
        title="Errors"
        value={1}
        icon={undefined}
        action={output.props.children[0].props.children[1].props.action}
        valueType="error"
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the configure action', function() {
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
            acl={acl}
            changeState={sinon.stub()}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            getUnitStatusCounts={getUnitStatusCounts()}
            service={service}
            serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[1],
      <juju.components.OverviewAction
        key="Configure"
        title="Configure"
        value={undefined}
        icon="configure"
        action={output.props.children[0].props.children[1].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the relations action if there are relations', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[1, 2, 3]} />);
    assert.deepEqual(output.props.children[0].props.children[2],
      <juju.components.OverviewAction
        key="Relations"
        title="Relations"
        value={undefined}
        icon="relations"
        action={output.props.children[0].props.children[2].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the expose action if the service is committed', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[3],
      <juju.components.OverviewAction
        key="Expose"
        title="Expose"
        value="On"
        icon="exposed_16"
        action={output.props.children[0].props.children[3].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
    assert.equal(output.props.children[0].props.children.length, 5);
  });

  it('shows the Change version action if the service is committed', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[1]} />);
    assert.deepEqual(output.props.children[0].props.children[4],
      <juju.components.OverviewAction
        key="Change version"
        title="Change version"
        linkAction={output.props.children[0].props.children[4].props.linkAction}
        linkTitle="cs:demo"
        icon="change-version"
        action={output.props.children[0].props.children[4].props.action}
        valueType={undefined}
        value={undefined} />);
    assert.equal(output.props.children[0].props.children.length, 5);
  });

  it('shows the charm details if the version is clicked', function() {
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[1]} />);
    output.props.children[0].props.children[4].props.linkAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'entity-details',
          id: 'demo'
        }
      }
    });
  });

  it('does not show Change version if uncommitted', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(true);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[1, 2, 3]} />);
    assert.equal(output.props.children[0].props.children.length, 4);
  });

  it('does not show relations if there are none', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          getUnitStatusCounts={getUnitStatusCounts()}
          service={service}
          serviceRelations={[]} />);
    assert.equal(output.props.children[0].props.children.length, 4);
  });

  it('renders the delete button', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    var buttons = [{
      disabled: false,
      title: 'Destroy',
      action: output.props.children[1].props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[1],
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('disables the delete button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    var buttons = [{
      disabled: true,
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
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    var buttons = [{
      disabled: false,
      title: 'Cancel',
      action: output.props.children[2].props.buttons[0].action
    }, {
      disabled: false,
      title: 'Confirm',
      type: 'destructive',
      action: output.props.children[2].props.buttons[1].action
    }];
    var confirmMessage = 'Are you sure you want to destroy the application? ' +
        'This cannot be undone.';
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={buttons} />);
  });

  it('shows the confirmation when the delete button is clicked', function() {
    var confirmMessage = 'Are you sure you want to destroy the application? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />, true);
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      disabled: false,
      title: 'Cancel',
      action: output.props.children[2].props.buttons[0].action
    }, {
      disabled: false,
      title: 'Confirm',
      type: 'destructive',
      action: output.props.children[2].props.buttons[1].action
    }];
    // Fire the click action.
    output.props.children[1].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={true}
        buttons={buttons} />);
  });

  it('hides the confirmation when the cancel button is clicked', function() {
    var confirmMessage = 'Are you sure you want to destroy the application? ' +
        'This cannot be undone.';
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />, true);
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      disabled: false,
      title: 'Cancel',
      action: output.props.children[2].props.buttons[0].action
    },{
      disabled: false,
      title: 'Confirm',
      type: 'destructive',
      action: output.props.children[2].props.buttons[1].action
    }];
    // Open the confirmation.
    output.props.children[1].props.buttons[0].action();
    // close the confirmation.
    output.props.children[2].props.buttons[0].action();
    shallowRenderer.render(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={buttons} />);
  });

  it('hides the confirmation when confirm button is clicked', function() {
    var confirmMessage = 'Are you sure you want to destroy the application? ' +
        'This cannot be undone.';
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        destroyService={destroyService}
        getUnitStatusCounts={getUnitStatusCounts()}
        clearState={clearState}
        changeState={changeState}
        service={fakeService}
        serviceRelations={[]} />, true);
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      disabled: false,
      title: 'Cancel',
      action: output.props.children[2].props.buttons[0].action
    }, {
      disabled: false,
      title: 'Confirm',
      type: 'destructive',
      action: output.props.children[2].props.buttons[1].action
    }];
    // Open the confirmation.
    output.props.children[1].props.buttons[0].action();
    // Simulate the confirm click.
    output.props.children[2].props.buttons[1].action();
    shallowRenderer.render(
      <juju.components.ServiceOverview
        acl={acl}
        destroyService={destroyService}
        clearState={clearState}
        changeState={changeState}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[2],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={buttons} />);
  });

  it('calls the destroy service method if confirm is clicked', function() {
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        destroyService={destroyService}
        clearState={clearState}
        changeState={changeState}
        getUnitStatusCounts={getUnitStatusCounts()}
        service={fakeService}
        serviceRelations={[]} />);
    // Simulate the confirm click.
    output.props.children[2].props.buttons[1].action();
    assert.equal(destroyService.callCount, 1);
  });

  it('calls clearState if confirm is clicked', function() {
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        destroyService={destroyService}
        getUnitStatusCounts={getUnitStatusCounts()}
        clearState={clearState}
        changeState={changeState}
        service={fakeService}
        serviceRelations={[]} />);
    // Simulate the confirm click.
    output.props.children[2].props.buttons[1].action();
    assert.equal(clearState.callCount, 1);
  });
});
