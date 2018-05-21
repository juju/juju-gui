/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ServiceOverview = require('./service-overview');

describe('ServiceOverview', function() {
  let acl, charm, service;

  const renderComponent = (options = {}) => enzyme.shallow(
    <ServiceOverview
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      charm={options.charm || charm}
      destroyService={options.destroyService || sinon.stub()}
      getUnitStatusCounts={options.getUnitStatusCounts || getUnitStatusCounts()}
      modelUUID={options.modelUUID || 'abc123'}
      service={options.service || service}
      serviceRelations={options.serviceRelations || [1]}
      showActivePlan={options.showActivePlan || sinon.stub()}
      showPlans={options.showPlans === undefined ? false : options.showPlans} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    service = {
      get: sinon.stub(),
      set: sinon.stub(),
      setAttrs: sinon.stub()
    };
    service.get.withArgs('charm').returns('cs:django');
    service.get.withArgs('name').returns('servicename');
    service.get.withArgs('units').returns({
      toArray: sinon.stub().returns([])
    });
    service.get.withArgs('deleted').returns(false);
    service.get.withArgs('pending').returns(false);
    charm = {
      hasMetrics: sinon.stub().returns(true),
      get: sinon.stub()
    };
    charm.get.withArgs('resources').returns({
      toArray: sinon.stub().returns([])
    });
  });

  function getUnitStatusCounts(error=0, pending=0, uncommitted=0) {
    return sinon.stub().returns({
      error: {size: error},
      pending: {size: pending},
      uncommitted: {size: uncommitted}
    });
  }

  it('does not request plans if charm does not have metrics', function() {
    service.get.withArgs('activePlan')
      .throws('it should not fetch this if no metrics');
    service.get.withArgs('name').throws('it should not fetch this if no metrics');
    service.get.withArgs('plans').throws('it should not fetch this if no metrics');
    charm.hasMetrics.returns(false);
    const showActivePlan = sinon.stub();
    const wrapper = renderComponent({ showActivePlan });
    const instance = wrapper.instance();
    assert.equal(showActivePlan.callCount, 0);
    assert.equal(instance.state.plans, null);
    assert.equal(instance.state.activePlan, null);
  });

  it('queries for active plans if none are stored on the charm', function() {
    const showActivePlan = sinon.stub();
    const wrapper = renderComponent({
      showActivePlan,
      showPlans: true
    });
    const instance = wrapper.instance();
    assert.equal(showActivePlan.callCount, 1, 'showActivePlan not called');
    assert.equal(showActivePlan.args[0][0], 'abc123');
    assert.equal(showActivePlan.args[0][1], 'servicename');
    const activePlan = 'active';
    const plans = 'plans';
    // Call the callback sent to showActivePlan
    showActivePlan.args[0][2](null, activePlan, plans);
    assert.equal(service.set.callCount, 1, 'setAttrs never called');
    assert.deepEqual(service.set.args[0], ['activePlan', activePlan]);
    assert.equal(instance.state.plans, plans);
    assert.equal(instance.state.activePlan, activePlan);
  });

  it('handles errors getting the active plan', function() {
    const addNotification = sinon.stub();
    const showActivePlan = sinon.stub().callsArgWith(2, 'Uh oh!', null, null);
    renderComponent({
      addNotification,
      showActivePlan,
      showPlans: true
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'fetching plan failed',
      message: 'fetching plan failed: Uh oh!',
      level: 'error'
    });
  });

  it('uses plans stored on a charm', function() {
    const activePlan = {active: 'plan'};
    const planList = [{plan: 'list'}];
    service.get.withArgs('activePlan').returns(activePlan);
    service.get.withArgs('name').throws('it should not request the service name');
    charm.get.withArgs('plans').returns(planList);
    const showActivePlan = sinon.stub();
    const wrapper = renderComponent({
      charm,
      service,
      showActivePlan,
      showPlans: true
    });
    const instance = wrapper.instance();
    assert.equal(showActivePlan.callCount, 0);
    assert.equal(instance.state.plans, planList);
    assert.equal(instance.state.activePlan, activePlan);
  });

  it('shows the all units action', function() {
    service.get.withArgs('units').returns({toArray: () => [{}, {}]});
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[valueType="all"]').length, 1);
  });

  it('shows the all units action even if there are no units', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[valueType="all"]').length, 1);
  });

  it('navigates to the unit list when All Units is clicked', function() {
    service.get.withArgs('id').returns('demo');
    service.get.withArgs('pending').returns(true);
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    // call the action method which is passed to the child to make sure it
    // is hooked up to the changeState method.
    wrapper.find('OverviewAction[valueType="all"]').props().action({
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
    service.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'uncommitted'},
      {agent_state: 'started'},
      {}
    ]});
    const wrapper = renderComponent({
      getUnitStatusCounts: getUnitStatusCounts(0, 0, 2)
    });
    assert.equal(
      wrapper.find('OverviewAction[valueType="uncommitted"]').length, 1);
  });

  it('shows the pending units action', function() {
    service.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'pending'}
    ]});
    const wrapper = renderComponent({
      getUnitStatusCounts: getUnitStatusCounts(0, 1, 0)
    });
    assert.equal(wrapper.find('OverviewAction[valueType="pending"]').length, 1);
  });

  it('shows the errors units action', function() {
    service.get.withArgs('units').returns({toArray: () => [
      {agent_state: 'error'}
    ]});
    const wrapper = renderComponent({
      getUnitStatusCounts: getUnitStatusCounts(1, 0, 0)
    });
    assert.equal(wrapper.find('OverviewAction[valueType="error"]').length, 1);
  });

  it('shows the configure action', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Configure"]').length, 1);
  });

  it('shows the relations action if there are relations', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Relations"]').length, 1);
  });

  it('shows the expose action if the service is committed', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Expose"]').length, 1);
  });

  it('shows the resources action', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Resources"]').length, 1);
  });

  it('does not show the resources action if there are none', function() {
    charm.get.withArgs('resources').returns(null);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Resources"]').length, 0);
  });

  it('shows the Change version action if the service is committed', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Change version"]').length, 1);
  });

  it('shows the charm details if the version is clicked', function() {
    const changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('OverviewAction[title="Change version"]').props().linkAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'django'
    });
  });

  it('does not show Change version if uncommitted', function() {
    service.get.withArgs('pending').returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('OverviewAction[title="Change version"]').length, 0);
  });

  it('shows the plans action if there are plans', function() {
    // Return an array to make it think it has plans
    charm.get.withArgs('plans').returns([]);
    const showActivePlan = sinon.stub();
    const wrapper = renderComponent({ showActivePlan });
    assert.equal(
      showActivePlan.callCount, 0,
      'we are defining plans in the service, it should not call to fetch more');
    assert.equal(wrapper.find('OverviewAction[title="Plan"]').length, 1);
  });

  it('disables the delete button when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[0].disabled, true);
  });

  it('hides the delete button when pending deletion', function() {
    service.get.withArgs('deleted').returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').length, 0);
  });

  it('renders the delete confirmation when pending deletion', function() {
    service.get.withArgs('deleted').returns(true);
    const wrapper = renderComponent();
    const confirmMessage = 'This application has been marked to be destroyed'
      + ' on next deployment.';
    const confirm = wrapper.find('InspectorConfirm');
    assert.equal(confirm.length, 1);
    assert.equal(confirm.prop('message'), confirmMessage);
    assert.equal(confirm.prop('open'), true);
  });

  it('hides the confirmation when not deleted', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('InspectorConfirm').prop('open'), false);
  });

  it('calls the destroy service method if destroy is clicked', function() {
    const destroyService = sinon.stub();
    const wrapper = renderComponent({ destroyService });
    // Simulate the confirm click.
    wrapper.find('ButtonRow').prop('buttons')[0].action();
    assert.equal(destroyService.callCount, 1);
  });
});
