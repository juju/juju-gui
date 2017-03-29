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

describe('Inspector', function() {
  var acl, appState;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-component', function() { done(); });
  });

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
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={clearState}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={destroyService}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={undefined}
        type={undefined}
        count={undefined}
        title={title}
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    const overview = output.props.children[1].props.children;
    var expectedOverview = (
        <juju.components.ServiceOverview
          acl={acl}
          changeState={overview.props.changeState}
          charm={{}}
          clearState={clearState}
          destroyService={destroyService}
          displayPlans={true}
          getUnitStatusCounts={getUnitStatusCounts}
          modelUUID="abc123"
          service={service}
          serviceRelations={serviceRelations}
          showActivePlan={showActivePlan} />);
    assert.deepEqual(overview, expectedOverview,
                     'Overview is not rendered as expected');
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
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={destroyUnits}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()}>
        </juju.components.Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent='units'
        type={unitStatus}
        count={0}
        title='Units'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');


    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.UnitList
          acl={acl}
          service={service}
          unitStatus="error"
          units={[]}
          envResolved={envResolved}
          destroyUnits={destroyUnits}
          changeState={children.props.changeState} />);
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
    var charm = {};
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={unplaceServiceUnits}
          updateServiceUnitsDisplayname={updateServiceUnitsDisplayname} />,
          true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="config"
        type={undefined}
        count={undefined}
        title='Configure'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');

    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.Configuration
          acl={acl}
          service={service}
          changeState={children.props.changeState}
          getYAMLConfig={getYAMLConfig}
          charm={charm}
          setConfig={setConfig}
          updateServiceUnitsDisplayname={updateServiceUnitsDisplayname}
          addNotification={addNotification}
          unplaceServiceUnits={unplaceServiceUnits}
          linkify={linkify}
          getServiceByName={getServiceByName}
          serviceRelations={[]} />);
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
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={destroyUnits}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()}>
        </juju.components.Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent='unit'
        type={headerType}
        count={undefined}
        title={title}
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    var expectedChildren = (
      <juju.components.UnitDetails
        acl={acl}
        destroyUnits={destroyUnits}
        service={service}
        changeState={children.props.changeState}
        previousComponent={undefined}
        unitStatus={null}
        unit={unit} />
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={destroyUnits}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()}>
        </juju.components.Inspector>);
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
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={destroyUnits}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()}>
        </juju.components.Inspector>);
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
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={destroyUnits}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()}>
        </juju.components.Inspector>);
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="scale"
        type={undefined}
        count={undefined}
        title='Scale'
        icon={icon}
      />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.ScaleService
          acl={acl}
          addGhostAndEcsUnits={children.props.addGhostAndEcsUnits}
          changeState={children.props.changeState}
          createMachinesPlaceUnits={children.props.createMachinesPlaceUnits}
          providerType='lxd'
          serviceId={service.get('id')}
        />);
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={unexposeService}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="expose"
        type={undefined}
        count={undefined}
        title='Expose'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.InspectorExpose
          acl={acl}
          addNotification={addNotification}
          changeState={children.props.changeState}
          exposeService={exposeService}
          unexposeService={unexposeService}
          service={service}
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="relations"
        type={undefined}
        count={undefined}
        title='Relations'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.InspectorRelations
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="relate-to"
        type={undefined}
        count={undefined}
        title='Relate to'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <juju.components.InspectorRelateTo
        changeState={children.props.changeState}
        application={service}
        relatableApplications={['apps']}/>);
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={createRelation}
        destroyRelations={destroyRelations}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="relate-to"
        type={undefined}
        count={undefined}
        title='spouse-name'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <juju.components.InspectorRelateToEndpoint
        backState={{
          gui: {
            inspector: {
              id: 'demo',
              activeComponent: 'relations'
            }
          }
        }}
        createRelation={createRelation}
        endpoints={[]}
        changeState={children.props.changeState} />);
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
      <juju.components.Inspector
        acl={acl}
        addCharm={sinon.stub()}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={sinon.stub()}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent='plan'
        type={undefined}
        count={undefined}
        title='Plan'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.InspectorPlan
          acl={acl}
          currentPlan={activePlan} />);
  });

  it('displays Change versions when the app state calls for it', function() {
    var addNotification = sinon.stub();
    var service = sinon.stub();
    var getMacaroon = sinon.stub();
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
      <juju.components.Inspector
        acl={acl}
        addCharm={addCharm}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent="change-version"
        type={undefined}
        count={undefined}
        title='Change version'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <juju.components.InspectorChangeVersion
        acl={acl}
        addNotification={addNotification}
        changeState={children.props.changeState}
        charmId="cs:demo"
        service={service}
        getMacaroon={getMacaroon}
        addCharm={addCharm}
        setCharm={setCharm}
        getCharm={getCharm}
        getAvailableVersions={getAvailableVersions} />);
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
    const service = {
      get: getStub
    };
    appState.current.gui.inspector = {
      activeComponent: 'resources'
    };
    const component = jsTestUtils.shallowRender(
      <juju.components.Inspector
        acl={acl}
        addCharm={addCharm}
        addGhostAndEcsUnits={sinon.stub()}
        addNotification={addNotification}
        appState={appState}
        charm={{get: sinon.stub().returns({resource: 'one'})}}
        clearState={sinon.stub()}
        createMachinesPlaceUnits={sinon.stub()}
        createRelation={sinon.stub()}
        destroyRelations={sinon.stub()}
        destroyService={sinon.stub()}
        destroyUnits={sinon.stub()}
        displayPlans={true}
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
        unexposeService={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const instance = component.getMountedInstance();
    const output = component.getRenderOutput();
    const header = output.props.children[0];
    const expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent='resources'
        type={undefined}
        count={undefined}
        title='Resources'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    const children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <juju.components.InspectorResourcesList
        acl={acl}
        resources={{resource: 'one'}} />);
  });

  it('passes changeState callable to header component', function() {
    var service = {
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
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    var output = shallowRenderer.getRenderOutput();
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
    var service = {
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
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    var output = shallowRenderer.getRenderOutput();
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
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('name').returns('demo');
    var service = {get: getStub};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: null
      }
    });
  });

  it('passes a title to the header component', function() {
    var service = {
      get: function() {
        return 'demo';
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[0].props.title, 'demo');
  });

  it('passes the type to the header component', function() {
    var getStub = sinon.stub();
    getStub.withArgs('icon').returns('icon.svg');
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    var service = {get: getStub};
    appState.current.gui.inspector = {
      id: 'django',
      activeComponent: 'units',
      units: 'error',
      unitStatus: null
    };
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.type, 'error');
  });

  it('displays the service overview when switching services', function() {
    appState.current.gui.inspector = {
      id: 'django',
      activeComponent: undefined,
      unit: null,
      unitStatus: null
    };
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        } else if (val === 'icon') {
          return 'icon.svg';
        } else if (val === 'name') {
          return 'apache2';
        }
        return {name: 'demo'};
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    shallowRenderer.getRenderOutput();
    assert.equal(appState.changeState.callCount, 0);
    service = {
      get: function(val) {
        if (val === 'id') {
          return 'django';
        }
        return {name: 'demo'};
      }};
    shallowRenderer.render(
        <juju.components.Inspector
          acl={acl}
          addCharm={sinon.stub()}
          addGhostAndEcsUnits={sinon.stub()}
          addNotification={sinon.stub()}
          appState={appState}
          charm={{}}
          clearState={sinon.stub()}
          createMachinesPlaceUnits={sinon.stub()}
          createRelation={sinon.stub()}
          destroyRelations={sinon.stub()}
          destroyService={sinon.stub()}
          destroyUnits={sinon.stub()}
          displayPlans={true}
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
          unexposeService={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />);
    shallowRenderer.getRenderOutput();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'django',
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    });
  });
});
