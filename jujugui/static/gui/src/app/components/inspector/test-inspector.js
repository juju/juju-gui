/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Inspector = require('./inspector');
const InspectorChangeVersion = require('./change-version/change-version');
const InspectorExpose = require('./expose/expose');
const InspectorHeader = require('./header/header');
const Configuration = require('./config/config');
const InspectorPlan = require('./plan/plan');
const InspectorRelateTo = require('./relate-to/relate-to');
const InspectorRelateToEndpoint = require('./relate-to/endpoint/endpoint');
const InspectorRelations = require('./relations/relations');
const InspectorResourcesList = require('./resources/list/list');
const ScaleService = require('./scale-service/scale-service');
const ServiceOverview = require('./service-overview/service-overview');
const UnitDetails = require('./unit-details/unit-details');
const UnitList = require('./unit-list/unit-list');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Inspector', function() {
  var acl, appState;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    appState = {
      current: {
        gui: {
          inspector: {}
        }
      },
      changeState: sinon.stub(),
      history: [{
        gui: {
          inspector: {}
        }
      }, {
        gui: {
          inspector: {}
        }
      }]
    };
  });

  it('displays the service overview for the "inspector" state', function() {
    const addNotification = sinon.stub();
    var getStub = sinon.stub();
    var icon = 'foo.png';
    var title = 'demo';
    getStub.withArgs('icon').returns(icon);
    getStub.withArgs('id').returns('apache2');
    getStub.withArgs('name').returns(title);
    var service = {
      get: getStub
    };
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var getUnitStatusCounts = sinon.stub();
    var showActivePlan = sinon.stub();
    var serviceRelations = ['relations'];
    const charm = {get: () => 'charmid', hasGetStarted: () => true};
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={charm}
        clearState={clearState}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={destroyService}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={getUnitStatusCounts}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={serviceRelations}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={showActivePlan}
        showPlans={true}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent={undefined}
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={true}
        title={title}
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    const overview = output.props.children[1].props.children;
    var expectedOverview = (
      <ServiceOverview
        acl={acl}
        addNotification={addNotification}
        changeState={overview.props.changeState}
        charm={charm}
        clearState={clearState}
        destroyService={destroyService}
        displayPlans={true}
        getUnitStatusCounts={getUnitStatusCounts}
        modelUUID="abc123"
        service={service}
        serviceRelations={serviceRelations}
        showActivePlan={showActivePlan}
        showPlans={true} />);
    expect(overview).toEqualJSX(expectedOverview);
  });

  it('displays the unit list when the app state calls for it', function() {
    var envResolved = sinon.stub();
    var destroyUnits = sinon.stub();
    var unitStatus = 'error';
    var getStub = sinon.stub();
    var icon = 'foo.png';
    getStub.withArgs('icon').returns(icon);
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'units',
      units: unitStatus
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={destroyUnits}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={envResolved}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}>
      </Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent='units'
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Units'
        type={unitStatus} />
    );
    expect(header).toEqualJSX(expectedHeader);

    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <UnitList
        acl={acl}
        changeState={children.props.changeState}
        destroyUnits={destroyUnits}
        envResolved={envResolved}
        service={service}
        units={[]}
        unitStatus="error" />);
  });

  it('displays the configuration when the app state calls for it', function() {
    var setConfig = sinon.stub();
    var getStub = sinon.stub();
    var icon = 'foo.png';
    getStub.withArgs('icon').returns(icon);
    var getYAMLConfig = sinon.stub();
    var updateServiceUnitsDisplayname = sinon.stub();
    var getServiceByName = sinon.stub();
    var addNotification = sinon.stub();
    var linkify = sinon.stub();
    var unplaceServiceUnits = sinon.stub();
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'config'
    };
    var charm = {get: () => 'charmid', hasGetStarted: () => true};
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={charm}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={getServiceByName}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={getYAMLConfig}
        linkify={linkify}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={setConfig}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={unplaceServiceUnits}
        updateServiceUnitsDisplayname={updateServiceUnitsDisplayname} />,
      true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="config"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Configure'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);

    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <Configuration
        acl={acl}
        addNotification={addNotification}
        changeState={children.props.changeState}
        charm={charm}
        getServiceByName={getServiceByName}
        getYAMLConfig={getYAMLConfig}
        linkify={linkify}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={unplaceServiceUnits}
        updateServiceUnitsDisplayname={updateServiceUnitsDisplayname} />);
  });

  it('displays the unit details when the app state calls for it', function() {
    var destroyUnits = sinon.stub();
    var getStub = sinon.stub();
    var title = 'demo-unit';
    var icon = 'foo.png';
    var headerType = 'active';
    var unit = {
      displayName: title,
      agent_state: headerType
    };
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return unit;
    }});
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={destroyUnits}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}>
      </Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent='unit'
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title={title}
        type={headerType} />
    );
    expect(header).toEqualJSX(expectedHeader);

    var children = output.props.children[1].props.children;
    var expectedChildren = (
      <UnitDetails
        acl={acl}
        changeState={children.props.changeState}
        destroyUnits={destroyUnits}
        previousComponent={undefined}
        service={service}
        unit={unit}
        unitStatus={null} />
    );
    assert.deepEqual(children, expectedChildren,
      'Unit details not rendered as expected');
  });

  it('handles the unit being removed while viewing the unit', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'units',
      units: 'error'
    };
    var shallowRenderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = shallowRenderer.getMountedInstance();
    assert.equal(instance.state.activeComponent, 'units');
    getStub.withArgs('units').returns({getById: function() {
      return;
    }});
    service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    shallowRenderer.render(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />);
    // The displayed component should not have been updated.
    assert.equal(instance.state.activeComponent, 'units');
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'demo',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('can go back from the unit details to a status list', function() {
    var destroyUnits = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return {displayName: 'spinach'};
    }});
    var service = {
      get: getStub
    };
    appState.history[0].gui.inspector = {
      activeComponent: 'units',
      units: 'error',
      id: 'demo'
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    var output = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={destroyUnits}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}>
      </Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'demo',
          activeComponent: 'units',
          unit: null,
          unitStatus: 'error'
        }}});
  });

  it('defaults to go back from the unit details to the all list', function() {
    var destroyUnits = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return {displayName: 'spinache'};
    }});
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    var output = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={destroyUnits}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}>
      </Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'demo',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('goes back to the previous service from unit details', function() {
    // Subordinates show the services unit that it's placed on so viewing
    // that unit will take you to another services inspector. This test
    // makes sure that if the previous service was different then 'back'
    // takes to you to that service.
    var destroyUnits = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return {displayName: 'spinache'};
    }});
    var service = {
      get: getStub
    };
    appState.history[0].gui.inspector = {
      id: 'previousService',
      units: true
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    var output = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={destroyUnits}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}>
      </Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'previousService',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('displays Scale Service when the app state calls for it', function() {
    var icon = 'foo.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'scale'
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        providerType='lxd'
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="scale"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Scale'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <ScaleService
        acl={acl}
        addGhostAndEcsUnits={children.props.addGhostAndEcsUnits}
        changeState={children.props.changeState}
        createMachinesPlaceUnits={children.props.createMachinesPlaceUnits}
        providerType='lxd'
        serviceId={service.get('id')} />);
  });

  it('displays Expose when the app state calls for it', function() {
    var addNotification = sinon.stub();
    var exposeService = sinon.stub();
    var unexposeService = sinon.stub();
    var service = sinon.stub();
    var units = {};
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    getStub.withArgs('units').returns(units);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'expose'
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={exposeService}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={unexposeService}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="expose"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Expose'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorExpose
        acl={acl}
        addNotification={addNotification}
        changeState={children.props.changeState}
        exposeService={exposeService}
        service={service}
        unexposeService={unexposeService}
        units={units} />);
  });

  it('displays Relations when the app state calls for it', function() {
    var destroyRelations = sinon.stub();
    var service = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'relations'
    };
    var serviceRelations = ['relatons'];
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={serviceRelations}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="relations"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Relations'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorRelations
        acl={acl}
        changeState={children.props.changeState}
        destroyRelations={destroyRelations}
        service={service}
        serviceRelations={serviceRelations} />);
  });

  it('displays the relate-to when the app state calls for it', function() {
    var destroyRelations = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'relate-to'
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={['apps']}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="relate-to"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Relate to'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorRelateTo
        application={service}
        changeState={children.props.changeState}
        relatableApplications={['apps']} />);
  });

  it('displays relate-to with spouse when the app state calls for it', () => {
    var destroyRelations = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'relate-to',
      'relate-to': 'zee-spouse'
    };
    var createRelation = sinon.stub();
    var getAvailableEndpoints = sinon.stub().returns([]);
    var getServiceById = () => ({
      get: sinon.stub().returns('spouse-name')
    });
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={createRelation}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={getAvailableEndpoints}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={getServiceById}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={['apps']}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="relate-to"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='spouse-name'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorRelateToEndpoint
        backState={{
          gui: {
            inspector: {
              id: 'demo',
              activeComponent: 'relations'
            }
          }
        }}
        changeState={children.props.changeState}
        createRelation={createRelation}
        endpoints={[]} />);
  });

  it('displays the Plans when the app state calls for it', function() {
    var icon = 'icon.png';
    var activePlan = {active: 'plan'};
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    getStub.withArgs('activePlan').returns(activePlan);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'plan'
    };
    var serviceRelations = ['relatons'];
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={serviceRelations}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent='plan'
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Plan'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorPlan
        acl={acl}
        currentPlan={activePlan} />);
  });

  it('displays Change versions when the app state calls for it', function() {
    var addNotification = sinon.stub();
    var service = sinon.stub();
    var addCharm = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'change-version'
    };
    var component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={addCharm}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={getAvailableVersions}
        getCharm={getCharm}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={setCharm}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <InspectorHeader
        activeComponent="change-version"
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="charmid"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Change version'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    var children = output.props.children[1].props.children;
    expect(children).toEqualJSX(
      <InspectorChangeVersion
        acl={acl}
        addCharm={addCharm}
        addNotification={addNotification}
        changeState={children.props.changeState}
        charmId="cs:demo"
        getAvailableVersions={getAvailableVersions}
        getCharm={getCharm}
        service={service}
        setCharm={setCharm} />);
  });

  it('displays Resources when the app state calls for it', function() {
    const addNotification = sinon.stub();
    const getMacaroon = sinon.stub();
    const addCharm = sinon.stub();
    const setCharm = sinon.stub();
    const getCharm = sinon.stub();
    const getAvailableVersions = sinon.stub();
    const icon = 'icon.png';
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('icon').returns(icon);
    getStub.returns([{resource: 'one'}]);
    const service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'resources'
    };

    const component = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={addCharm}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{
          get: getStub,
          hasGetStarted: () => true
        }}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={getAvailableVersions}
        getCharm={getCharm}
        getMacaroon={getMacaroon}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={setCharm}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const header = output.props.children[0];
    const expectedHeader = (
      <InspectorHeader
        activeComponent='resources'
        backCallback={instance._backCallback}
        changeState={sinon.stub()}
        charmId="demo"
        entityPath="u/foo/bar"
        hasGetStarted={true}
        icon={icon}
        showLinks={false}
        title='Resources'
        type={undefined} />
    );
    expect(header).toEqualJSX(expectedHeader);
    const children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <InspectorResourcesList
        acl={acl}
        resources={[{resource: 'one'}]} />);
  });

  it('passes changeState callable to header component', function() {
    const service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        } else if (val === 'icon') {
          return 'icon.png';
        } else if (val === 'name') {
          return 'spinach';
        }
        return {name: 'demo'};
      }};
    const renderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: null
      }
    });
  });

  it('can navigate back to the inspector from a service', function() {
    appState.history[0].gui.inspector = {
      activeComponent: 'relations',
      id: 'service2'
    };
    const service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        } else if (val === 'icon') {
          return 'icon.png';
        } else if (val === 'name') {
          return 'spinach';
        }
        return {name: 'demo'};
      }};
    const renderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'service2',
          activeComponent: 'relations'
        }
      }
    });
  });

  it('does not go back to the inspector from the same service', function() {
    const getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('name').returns('demo');
    const service = {get: getStub};
    const renderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: null
      }
    });
  });

  it('passes a title to the header component', function() {
    const service = {
      get: function() {
        return 'demo';
      }};
    const renderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    assert.equal(output.props.children[0].props.title, 'demo');
  });

  it('passes the type to the header component', function() {
    const getStub = sinon.stub();
    getStub.withArgs('icon').returns('icon.svg');
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    const service = {get: getStub};
    appState.current.gui.inspector = {
      id: 'django',
      activeComponent: 'units',
      units: 'error',
      unitStatus: null
    };
    const renderer = jsTestUtils.shallowRender(
      <Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{get: () => 'charmid', hasGetStarted: () => true}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
        entityPath={'u/foo/bar'}
        envResolved={sinon.stub()}
        exposeService={sinon.stub()}
        getAvailableEndpoints={sinon.stub()}
        getAvailableVersions={sinon.stub()}
        getCharm={sinon.stub()}
        getMacaroon={sinon.stub()}
        getServiceById={sinon.stub()}
        getServiceByName={sinon.stub()}
        getUnitStatusCounts={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        modelUUID="abc123"
        relatableApplications={[]}
        service={service}
        serviceRelations={[]}
        setCharm={sinon.stub()}
        setConfig={sinon.stub()}
        showActivePlan={sinon.stub()}
        showPlans={false}
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.type, 'error');
  });
});
