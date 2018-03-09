/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ServiceOverview = require('./service-overview');
const ButtonRow = require('../../button-row/button-row');
const InspectorConfirm = require('../confirm/confirm');
const OverviewAction = require('../overview-action/overview-action');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('ServiceOverview', function() {
  let acl, fakeCharm, fakeService;

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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={'abc123'}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan}
        showPlans={false} />, true);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={modelUUID}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan}
        showPlans={true} />, true);
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

  it('handles errors getting the active plan', function() {
    const addNotification = sinon.stub();
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
    const showActivePlan = sinon.stub().callsArgWith(2, 'Uh oh!', null, null);
    jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={addNotification}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan}
        showPlans={true} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'fetching plan failed',
      message: 'fetching plan failed: Uh oh!',
      level: 'error'
    });
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID={'abc123'}
        service={service}
        serviceRelations={[1]}
        showActivePlan={showActivePlan}
        showPlans={true} />, true);
    const instance = renderer.getMountedInstance();
    assert.equal(showActivePlan.callCount, 0);
    assert.equal(instance.state.plans, planList);
    assert.equal(instance.state.activePlan, activePlan);
  });

  it('shows the all units action', function() {
    fakeService.get.withArgs('units').returns({toArray: () => [{}, {}]});
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[0],
      <OverviewAction
        action={output.props.children[1].props.children[0].props.action}
        icon="units"
        key="Units"
        linkAction={undefined}
        linkTitle={undefined}
        title="Units"
        value={2}
        valueType="all" />);
  });

  it('shows the all units action even if there are no units', function() {
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[0],
      <OverviewAction
        action={output.props.children[1].props.children[0].props.action}
        icon="units"
        key="Units"
        linkAction={undefined}
        linkTitle={undefined}
        title="Units"
        value={0}
        valueType="all" />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
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
    fakeService.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'uncommitted'},
      {agent_state: 'started'},
      {}
    ]});
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts(0, 0, 2)}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <OverviewAction
        action={output.props.children[1].props.children[1].props.action}
        icon={undefined}
        key="Uncommitted"
        linkAction={undefined}
        linkTitle={undefined}
        title="Uncommitted"
        value={2}
        valueType="uncommitted" />);
  });

  it('shows the pending units action', function() {
    fakeService.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'pending'}
    ]});
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts(0, 1, 0)}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <OverviewAction
        action={output.props.children[1].props.children[1].props.action}
        icon={undefined}
        key="Pending"
        linkAction={undefined}
        linkTitle={undefined}
        title="Pending"
        value={1}
        valueType='pending' />);
  });

  it('shows the errors units action', function() {
    fakeService.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'error'}
    ]});
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts(1, 0, 0)}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <OverviewAction
        action={output.props.children[1].props.children[1].props.action}
        icon={undefined}
        key="Errors"
        linkAction={undefined}
        linkTitle={undefined}
        title="Errors"
        value={1}
        valueType="error" />);
  });

  it('shows the configure action', function() {
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[1],
      <OverviewAction
        action={output.props.children[1].props.children[1].props.action}
        icon="configure"
        key="Configure"
        linkAction={undefined}
        linkTitle={undefined}
        title="Configure"
        value={undefined}
        valueType={undefined} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1, 2, 3]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[2],
      <OverviewAction
        action={output.props.children[1].props.children[2].props.action}
        icon="relations"
        key="Relations"
        linkAction={undefined}
        linkTitle={undefined}
        title="Relations"
        value={undefined}
        valueType={undefined} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[3],
      <OverviewAction
        action={output.props.children[1].props.children[3].props.action}
        icon="exposed_16"
        key="Expose"
        linkAction={undefined}
        linkTitle={undefined}
        title="Expose"
        value="On"
        valueType={undefined} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[4],
      <OverviewAction
        action={output.props.children[1].props.children[4].props.action}
        icon="resources_16"
        key="Resources"
        linkAction={undefined}
        linkTitle={undefined}
        title="Resources"
        value={undefined}
        valueType={undefined} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.deepEqual(output.props.children[1].props.children[5],
      <OverviewAction
        action={output.props.children[1].props.children[5].props.action}
        icon="change-version"
        key="Change version"
        linkAction={output.props.children[1].props.children[5].props.linkAction}
        linkTitle="django/xenial/42"
        title="Change version"
        value={undefined}
        valueType={undefined} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[1, 2, 3]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
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
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={service}
        serviceRelations={[]}
        showActivePlan={showActivePlan}
        showPlans={false} />);
    assert.equal(
      showActivePlan.callCount, 0,
      'we are defining plans in the service, it should not call to fetch more');
    assert.equal(
      output.props.children[1].props.children[6].props.title, 'Plan');
  });

  it('renders the delete button', function() {
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    const buttons = [{
      disabled: false,
      title: 'Destroy',
      action: output.props.children[2].props.children.props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[2].props.children,
      <ButtonRow
        buttons={buttons} />);
  });

  it('disables the delete button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    const buttons = [{
      disabled: true,
      title: 'Destroy',
      action: output.props.children[2].props.children.props.buttons[0].action
    }];
    assert.deepEqual(output.props.children[2].props.children,
      <ButtonRow
        buttons={buttons} />);
  });

  it('hides the delete button when pending deletion', function() {
    fakeService.get.withArgs('deleted').returns(true);
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    assert.equal(output.props.children[2], undefined);
  });

  it('renders the delete confirmation when pending deletion', function() {
    fakeService.get.withArgs('deleted').returns(true);
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    const confirmMessage = 'This application has been marked to be destroyed'
      + ' on next deployment.';
    assert.deepEqual(output.props.children[0],
      <InspectorConfirm
        buttons={[]}
        message={confirmMessage}
        open={true} />);
  });

  it('hides the confirmation when not deleted', function() {
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={fakeCharm}
        clearState={sinon.stub()}
        destroyService={sinon.stub()}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    const confirmMessage = 'This application has been marked to be destroyed'
      + ' on next deployment.';
    assert.deepEqual(output.props.children[0],
      <InspectorConfirm
        buttons={[]}
        message={confirmMessage}
        open={false} />);
  });

  it('calls the destroy service method if destroy is clicked', function() {
    const clearState = sinon.stub();
    const destroyService = sinon.stub();
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <ServiceOverview
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={fakeCharm}
        clearState={clearState}
        destroyService={destroyService}
        displayPlans={false}
        getUnitStatusCounts={getUnitStatusCounts()}
        modelUUID="abc123"
        service={fakeService}
        serviceRelations={[]}
        showActivePlan={sinon.stub()}
        showPlans={false} />);
    // Simulate the confirm click.
    output.props.children[2].props.children.props.buttons[0].action();
    assert.equal(destroyService.callCount, 1);
  });
});
