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
  let acl, fakeCharm, fakeService;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('service-overview', function() { done(); });
  });

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    fakeService = {
      get: sinon.stub()
    };
    fakeService.get.withArgs('charm').returns('cs:django');
    fakeService.get.withArgs('units').returns({ toArray: () => [] });
    fakeService.get.withArgs('deleted').returns(false);
    fakeService.get.withArgs('pending').returns(false);
    fakeCharm = {
      hasMetrics: sinon.stub().returns(true),
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }
    };
  });

  function getUnitStatusCounts(error=0, pending=0, uncommitted=0) {
    return sinon.stub().returns({
      error: {size: error},
      pending: {size: pending},
      uncommitted: {size: uncommitted}
    });
  }

  it('does not request plans if charm does not have metrics', function() {
    const setAttrs = sinon.stub();
    const getStub = sinon.stub();
    getStub.withArgs('activePlan')
      .throws('it should not fetch this if no metrics');
    getStub.withArgs('charm').returns('cs:django');
    getStub.withArgs('name').throws('it should not fetch this if no metrics');
    getStub.withArgs('plans').throws('it should not fetch this if no metrics');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      setAttrs: setAttrs,
      get: getStub
    };
    const charm = {
      hasMetrics: sinon.stub().returns(false),
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }
    };
    const showActivePlan = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={'abc123'}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan} />, true);
    const instance = renderer.getMountedInstance();
    assert.equal(showActivePlan.callCount, 0);
    assert.equal(instance.state.plans, null);
    assert.equal(instance.state.activePlan, null);
  });

  it('queries for active plans if none are stored on the charm', function() {
    const setStub = sinon.stub();
    const getStub = sinon.stub();
    getStub.withArgs('activePlan').returns(undefined);
    getStub.withArgs('charm').returns('cs:django');
    getStub.withArgs('name').returns('servicename');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const charmGetStub = sinon.stub();
    charmGetStub.withArgs('plans').returns(undefined);
    const service = {
      set: setStub,
      get: getStub
    };
    const charm = {
      get: charmGetStub,
      hasMetrics: sinon.stub().returns(true)
    };
    const modelUUID = 'abc123';
    const showActivePlan = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={modelUUID}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan} />, true);
    const instance = renderer.getMountedInstance();
    assert.equal(showActivePlan.callCount, 1, 'showActivePlan not called');
    assert.equal(showActivePlan.args[0][0], modelUUID);
    assert.equal(showActivePlan.args[0][1], 'servicename');
    const activePlan = 'active';
    const plans = 'plans';
    // Call the callback sent to showActivePlan
    showActivePlan.args[0][2](null, activePlan, plans);
    assert.equal(setStub.callCount, 1, 'setAttrs never called');
    assert.deepEqual(setStub.args[0], ['activePlan', activePlan]);
    assert.equal(instance.state.plans, plans);
    assert.equal(instance.state.activePlan, activePlan);
  });

  it('uses plans stored on a charm', function() {
    const setStub = sinon.stub();
    const activePlan = {active: 'plan'};
    const planList = [{plan: 'list'}];
    const getStub = sinon.stub();
    getStub.withArgs('activePlan').returns(activePlan);
    getStub.withArgs('charm').returns('cs:django');
    getStub.withArgs('name').throws('it should not request the service name');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const charmGetStub = sinon.stub();
    charmGetStub.withArgs('plans').returns(planList);
    const service = {
      set: setStub,
      get: getStub
    };
    const charm = {
      get: charmGetStub,
      hasMetrics: sinon.stub().returns(true)
    };
    const showActivePlan = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={'abc123'}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan} />, true);
    const instance = renderer.getMountedInstance();
    assert.equal(showActivePlan.callCount, 0);
    assert.equal(instance.state.plans, planList);
    assert.equal(instance.state.activePlan, activePlan);
  });

  it('shows the all units action', function() {
    const service = {
      get: function() {
        return {
          toArray: function() {
            return [{}, {}];
          }
        };
      }};

    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts()}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[0],
      <juju.components.OverviewAction
        icon="units"
        key="Units"
        title="Units"
        value={2}
        valueType="all"
        linkAction={undefined}
        linkTitle={undefined}
        action={output.props.children[1].props.children[0].props.action} />);
  });

  it('shows the all units action even if there are no units', function() {
    const service = {
      get: function() {
        return {
          toArray: function() {
            return [];
          }
        };
      }};

    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts()}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[0],
      <juju.components.OverviewAction
        icon="units"
        key="Units"
        title="Units"
        value={0}
        valueType="all"
        linkAction={undefined}
        linkTitle={undefined}
        action={output.props.children[1].props.children[0].props.action} />);
  });

  it('navigates to the unit list when All Units is clicked', function() {
    const getStub = sinon.stub();
    getStub.withArgs('units').returns({toArray: function() {
      return [{}, {}];
    }});
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(true);
    const service = {
      get: getStub
    };
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            clearState={sinon.stub()}
            charm={fakeCharm}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts()}
            modelUUID="abc123"
            changeState={changeState}
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    // call the action method which is passed to the child to make sure it
    // is hooked up to the changeState method.
    output.props.children[1].props.children[0].props.action({
      currentTarget: {
        getAttribute: function() { return 'Units'; }
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'demo',
          activeComponent: 'units',
          unitStatus: null
        }
      }
    });
  });

  it('shows the uncommitted units action', function() {
    const service = {
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
    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts(0, 0, 2)}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <juju.components.OverviewAction
        key="Uncommitted"
        title="Uncommitted"
        value={2}
        icon={undefined}
        action={output.props.children[1].props.children[1].props.action}
        valueType="uncommitted"
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the pending units action', function() {
    const service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'pending'}];
          }
        };
      }};
    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts(0, 1, 0)}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <juju.components.OverviewAction
        key="Pending"
        title="Pending"
        value={1}
        icon={undefined}
        action={output.props.children[1].props.children[1].props.action}
        valueType='pending'
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the errors units action', function() {
    const service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'error'}];
          }
        };
      }};
    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts(1, 0, 0)}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <juju.components.OverviewAction
        key="Errors"
        title="Errors"
        value={1}
        icon={undefined}
        action={output.props.children[1].props.children[1].props.action}
        valueType="error"
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the configure action', function() {
    const service = {
      get: function() {
        return {
          toArray: function() {
            return [{agent_state: 'error'}];
          }
        };
      }};
    const output = jsTestUtils.shallowRender(
          <juju.components.ServiceOverview
            acl={acl}
            changeState={sinon.stub()}
            charm={fakeCharm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={false}
            getUnitStatusCounts={getUnitStatusCounts()}
            modelUUID="abc123"
            service={service}
            serviceRelations={[1]}
            showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <juju.components.OverviewAction
        key="Configure"
        title="Configure"
        value={undefined}
        icon="configure"
        action={output.props.children[1].props.children[1].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the relations action if there are relations', function() {
    const getStub = sinon.stub();
    getStub.withArgs('charm').returns('cs:django');
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={fakeCharm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1, 2, 3]}
          showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[2],
      <juju.components.OverviewAction
        key="Relations"
        title="Relations"
        value={undefined}
        icon="relations"
        action={output.props.children[1].props.children[2].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('shows the expose action if the service is committed', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={fakeCharm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1]}
          showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[3],
      <juju.components.OverviewAction
        key="Expose"
        title="Expose"
        value="On"
        icon="exposed_16"
        action={output.props.children[1].props.children[3].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
    assert.equal(output.props.children[1].props.children.length, 6);
  });

  it('shows the resources action', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={fakeCharm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1]}
          showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[4],
      <juju.components.OverviewAction
        key="Resources"
        title="Resources"
        value={undefined}
        icon="resources_16"
        action={output.props.children[1].props.children[4].props.action}
        valueType={undefined}
        linkAction={undefined}
        linkTitle={undefined} />);
  });

  it('does not show the resources action if there are none', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const charmGetStub = sinon.stub();
    charmGetStub.withArgs('resources').returns(null);
    const charm = {
      get: charmGetStub,
      hasMetrics: sinon.stub().returns(true)
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={charm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1]}
          showActivePlan={sinon.stub()} />);
    assert.equal(output.props.children[1].props.children.length, 5);
  });

  it('shows the Change version action if the service is committed', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:xenial/django-42');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={fakeCharm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1]}
          showActivePlan={sinon.stub()} />);
    assert.deepEqual(output.props.children[1].props.children[5],
      <juju.components.OverviewAction
        key="Change version"
        title="Change version"
        linkAction={output.props.children[1].props.children[5].props.linkAction}
        linkTitle="django/xenial/42"
        icon="change-version"
        action={output.props.children[1].props.children[5].props.action}
        valueType={undefined}
        value={undefined} />);
    assert.equal(output.props.children[1].props.children.length, 6);
  });

  it('shows the charm details if the version is clicked', function() {
    const changeState = sinon.stub();
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(false);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          clearState={sinon.stub()}
          charm={fakeCharm}
          destroyService={sinon.stub()}
          displayPlans={false}
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1]}
          showActivePlan={sinon.stub()} />);
    output.props.children[1].props.children[5].props.linkAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'demo'
    });
  });

  it('does not show Change version if uncommitted', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('pending').returns(true);
    getStub.withArgs('exposed').returns(true);
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    const service = {
      get: getStub
    };
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={fakeCharm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={false}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[1, 2, 3]}
          showActivePlan={sinon.stub()} />);
    assert.equal(output.props.children[1].props.children.length, 5);
  });

  it('shows the plans action if there are plans', function() {
    const setAttrs = sinon.stub();
    const getStub = sinon.stub();
    getStub.withArgs('charm').returns('cs:django');
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    // Return an array to make it think it has plans
    const charmGetStub = sinon.stub();
    charmGetStub.withArgs('plans').returns([]);
    charmGetStub.withArgs('resources').returns({resource: 'one'});
    getStub.withArgs('activePlan').returns([]);
    const service = {
      setAttrs: setAttrs,
      get: getStub
    };
    const charm = {
      get: charmGetStub,
      hasMetrics: sinon.stub().returns(true)
    };
    const showActivePlan = sinon.stub();
    const output = jsTestUtils.shallowRender(
        <juju.components.ServiceOverview
          acl={acl}
          changeState={sinon.stub()}
          charm={charm}
          clearState={sinon.stub()}
          destroyService={sinon.stub()}
          displayPlans={true}
          getUnitStatusCounts={getUnitStatusCounts()}
          modelUUID="abc123"
          service={service}
          serviceRelations={[]}
          showActivePlan={showActivePlan} />);
    assert.equal(
      showActivePlan.callCount, 0,
      'we are defining plans in the service, it should not call to fetch more');
    assert.equal(
      output.props.children[1].props.children[6].props.title, 'Plan');
  });

  it('renders the delete button', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    const buttons = [{
      disabled: false,
      title: 'Destroy',
      action: output.props.children[2].props.children.props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[2].props.children,
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('disables the delete button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        displayPlans={false}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    const buttons = [{
      disabled: true,
      title: 'Destroy',
      action: output.props.children[2].props.children.props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[2].props.children,
      <juju.components.ButtonRow
        buttons={buttons} />);
  });

  it('hides the delete button when pending deletion', function() {
    fakeService.get.withArgs('deleted').returns(true);
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        displayPlans={false}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    assert.equal(output.props.children[2], undefined);
  });

  it('renders the delete confirmation when pending deletion', function() {
    fakeService.get.withArgs('deleted').returns(true);
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    const confirmMessage = 'This application has been marked to be destroyed'
      + ' on next deployment.';
    assert.deepEqual(output.props.children[0],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={true}
        buttons={[]} />);
  });

  it('hides the confirmation when not deleted', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts()}
        displayPlans={false}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    const confirmMessage = 'This application has been marked to be destroyed'
      + ' on next deployment.';
    assert.deepEqual(output.props.children[0],
      <juju.components.InspectorConfirm
        message={confirmMessage}
        open={false}
        buttons={[]} />);
  });

  it('calls the destroy service method if destroy is clicked', function() {
    const clearState = sinon.stub();
    const destroyService = sinon.stub();
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.ServiceOverview
        acl={acl}
        charm={fakeCharm}
        destroyService={destroyService}
        clearState={clearState}
        changeState={changeState}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()} />);
    // Simulate the confirm click.
    output.props.children[2].props.children.props.buttons[0].action();
    assert.equal(destroyService.callCount, 1);
  });
});
