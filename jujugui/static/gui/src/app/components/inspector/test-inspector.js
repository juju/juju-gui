/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

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

describe('Inspector', function() {
  let acl, appState, charm, service;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Inspector
      acl={options.acl || acl}
      addCharm={options.addCharm || sinon.stub()}
      addGhostAndEcsUnits={options.addGhostAndEcsUnits || sinon.stub()}
      addNotification={options.addNotification || sinon.stub()}
      appState={options.appState || appState}
      charm={options.charm || charm}
      clearState={options.clearState || sinon.stub()}
      createMachinesPlaceUnits={options.createMachinesPlaceUnits || sinon.stub()}
      createRelation={sinon.stub()}
      destroyRelations={options.destroyRelations || sinon.stub()}
      destroyService={options.destroyService || sinon.stub()}
      destroyUnits={options.destroyUnits || sinon.stub()}
      displayPlans={
        options.displayPlans === undefined ? true : options.displayPlans}
      entityPath={options.entityPath || 'u/foo/bar'}
      envResolved={options.envResolved || sinon.stub()}
      exposeService={options.exposeService || sinon.stub()}
      getAvailableEndpoints={options.getAvailableEndpoints || sinon.stub()}
      getAvailableVersions={options.getAvailableVersions || sinon.stub()}
      getCharm={options.getCharm || sinon.stub()}
      getMacaroon={options.getMacaroon || sinon.stub()}
      getServiceById={options.getServiceById || sinon.stub()}
      getServiceByName={options.getServiceByName || sinon.stub()}
      getUnitStatusCounts={options.getUnitStatusCounts || sinon.stub()}
      getYAMLConfig={options.getYAMLConfig || sinon.stub()}
      linkify={options.linkify || sinon.stub()}
      modelUUID={options.modelUUID || 'abc123'}
      providerType={options.providerType}
      relatableApplications={options.relatableApplications || []}
      service={options.service || service}
      serviceRelations={options.serviceRelations || ['relations']}
      setCharm={options.setCharm || sinon.stub()}
      setConfig={options.setConfig || sinon.stub()}
      showActivePlan={options.showActivePlan || sinon.stub()}
      showPlans={options.showPlans === undefined ? false : options.showPlans}
      unexposeService={options.unexposeService || sinon.stub()}
      unplaceServiceUnits={options.unplaceServiceUnits || sinon.stub()}
      updateServiceUnitsDisplayname={
        options.updateServiceUnitsDisplayname || sinon.stub()} />
  );

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
    var getStub = sinon.stub();
    getStub.withArgs('icon').returns('icon.png');
    getStub.withArgs('id').returns('apache2');
    getStub.withArgs('name').returns('demo');
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    service = {
      get: getStub
    };
    charm = {
      get: sinon.stub().returns('charmid'),
      hasGetStarted: sinon.stub().returns(true)
    };
  });

  it('displays the service overview for the "inspector" state', function() {
    const wrapper = renderComponent({
      showPlans: true
    });
    const expected = (
      <div className="inspector-view">
        <InspectorHeader
          activeComponent={undefined}
          backCallback={wrapper.find('InspectorHeader').prop('backCallback')}
          changeState={wrapper.find('InspectorHeader').prop('changeState')}
          charmId="charmid"
          entityPath="u/foo/bar"
          hasGetStarted={true}
          icon="icon.png"
          showLinks={true}
          title="demo"
          type={undefined} />
        <div className="inspector-content">
          <ServiceOverview
            acl={acl}
            addNotification={sinon.stub()}
            changeState={wrapper.find('ServiceOverview').prop('changeState')}
            charm={charm}
            clearState={sinon.stub()}
            destroyService={sinon.stub()}
            displayPlans={true}
            getUnitStatusCounts={sinon.stub()}
            modelUUID="abc123"
            service={service}
            serviceRelations={['relations']}
            showActivePlan={sinon.stub()}
            showPlans={true} />
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('displays the unit list when the app state calls for it', function() {
    var unitStatus = 'error';
    appState.current.gui.inspector = {
      activeComponent: 'units',
      units: unitStatus
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'units');
    assert.equal(header.prop('title'), 'Units');
    assert.equal(header.prop('type'), unitStatus);
    const expected = (
      <div className="inspector-content">
        <UnitList
          acl={acl}
          changeState={wrapper.find('UnitList').prop('changeState')}
          destroyUnits={sinon.stub()}
          envResolved={sinon.stub()}
          service={service}
          units={[]}
          unitStatus="error" />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays the configuration when the app state calls for it', function() {
    appState.current.gui.inspector = {
      activeComponent: 'config'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'config');
    assert.equal(header.prop('title'), 'Configure');
    const expected = (
      <div className="inspector-content">
        <Configuration
          acl={acl}
          addNotification={sinon.stub()}
          changeState={wrapper.find('Configuration').prop('changeState')}
          charm={charm}
          getServiceByName={sinon.stub()}
          getYAMLConfig={sinon.stub()}
          linkify={sinon.stub()}
          service={service}
          serviceRelations={['relations']}
          setConfig={sinon.stub()}
          unplaceServiceUnits={sinon.stub()}
          updateServiceUnitsDisplayname={sinon.stub()} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays the unit details when the app state calls for it', function() {
    var title = 'demo-unit';
    var headerType = 'active';
    var unit = {
      displayName: title,
      agent_state: headerType
    };
    service.get.withArgs('units').returns({getById: function() {
      return unit;
    }});
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'unit');
    assert.equal(header.prop('title'), 'demo-unit');
    assert.equal(header.prop('type'), headerType);
    const expected = (
      <div className="inspector-content">
        <UnitDetails
          acl={acl}
          changeState={wrapper.find('UnitDetails').prop('changeState')}
          destroyUnits={sinon.stub()}
          previousComponent={undefined}
          service={service}
          unit={unit}
          unitStatus={null} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('handles the unit being removed while viewing the unit', function() {
    appState.current.gui.inspector = {
      activeComponent: 'units',
      units: 'error'
    };
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.state.activeComponent, 'units');
    service.get.withArgs('units').returns({getById: function() {
      return;
    }});
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    wrapper.setProps();
    // The displayed component should not have been updated.
    assert.equal(instance.state.activeComponent, 'units');
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'apache2',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('can go back from the unit details to a status list', function() {
    service.get.withArgs('units').returns({getById: function() {
      return {displayName: 'spinach'};
    }});
    appState.history[0].gui.inspector = {
      activeComponent: 'units',
      units: 'error',
      id: 'demo'
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
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
    service.get.withArgs('units').returns({getById: function() {
      return {displayName: 'spinache'};
    }});
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'apache2',
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
    service.get.withArgs('units').returns({getById: function() {
      return {displayName: 'spinache'};
    }});
    appState.history[0].gui.inspector = {
      id: 'previousService',
      units: true
    };
    appState.current.gui.inspector = {
      activeComponent: 'unit',
      unit: '5'
    };
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
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
    appState.current.gui.inspector = {
      activeComponent: 'scale'
    };
    const wrapper = renderComponent({ providerType: 'lxd' });
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'scale');
    assert.equal(header.prop('title'), 'Scale');
    const expected = (
      <div className="inspector-content">
        <ScaleService
          acl={acl}
          addGhostAndEcsUnits={sinon.stub()}
          changeState={wrapper.find('ScaleService').prop('changeState')}
          createMachinesPlaceUnits={sinon.stub()}
          providerType='lxd'
          serviceId={service.get('id')} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays Expose when the app state calls for it', function() {
    var units = {};
    service.get.withArgs('units').returns(units);
    appState.current.gui.inspector = {
      activeComponent: 'expose'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'expose');
    assert.equal(header.prop('title'), 'Expose');
    const expected = (
      <div className="inspector-content">
        <InspectorExpose
          acl={acl}
          addNotification={sinon.stub()}
          changeState={wrapper.find('InspectorExpose').prop('changeState')}
          exposeService={sinon.stub()}
          service={service}
          unexposeService={sinon.stub()}
          units={units} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays Relations when the app state calls for it', function() {
    appState.current.gui.inspector = {
      activeComponent: 'relations'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'relations');
    assert.equal(header.prop('title'), 'Relations');
    const expected = (
      <div className="inspector-content">
        <InspectorRelations
          acl={acl}
          changeState={wrapper.find('InspectorRelations').prop('changeState')}
          destroyRelations={sinon.stub()}
          service={service}
          serviceRelations={['relations']} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays the relate-to when the app state calls for it', function() {
    appState.current.gui.inspector = {
      activeComponent: 'relate-to'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'relate-to');
    assert.equal(header.prop('title'), 'Relate to');
    const expected = (
      <div className="inspector-content">
        <InspectorRelateTo
          application={service}
          changeState={wrapper.find('InspectorRelateTo').prop('changeState')}
          relatableApplications={['apps']} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays relate-to with spouse when the app state calls for it', () => {
    appState.current.gui.inspector = {
      activeComponent: 'relate-to',
      'relate-to': 'zee-spouse'
    };
    var getAvailableEndpoints = sinon.stub().returns([]);
    var getServiceById = () => ({
      get: sinon.stub().returns('spouse-name')
    });
    const wrapper = renderComponent({
      getAvailableEndpoints,
      getServiceById
    });
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'relate-to');
    assert.equal(header.prop('title'), 'spouse-name');
    const expected = (
      <div className="inspector-content">
        <InspectorRelateToEndpoint
          backState={{
            gui: {
              inspector: {
                id: 'demo',
                activeComponent: 'relations'
              }
            }
          }}
          changeState={wrapper.find('InspectorRelateToEndpoint').prop('changeState')}
          createRelation={sinon.stub()}
          endpoints={[]} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays the Plans when the app state calls for it', function() {
    var activePlan = {active: 'plan'};
    service.get.withArgs('activePlan').returns(activePlan);
    appState.current.gui.inspector = {
      activeComponent: 'plan'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'plan');
    assert.equal(header.prop('title'), 'Plan');
    const expected = (
      <div className="inspector-content">
        <InspectorPlan
          acl={acl}
          currentPlan={activePlan} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays Change versions when the app state calls for it', function() {
    appState.current.gui.inspector = {
      activeComponent: 'change-version'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'change-version');
    assert.equal(header.prop('title'), 'Change version');
    const expected = (
      <div className="inspector-content">
        <InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={wrapper.find('InspectorChangeVersion').prop('changeState')}
          charmId="cs:demo"
          getAvailableVersions={sinon.stub()}
          getCharm={sinon.stub()}
          service={service}
          setCharm={sinon.stub()} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('displays Resources when the app state calls for it', function() {
    charm.get.withArgs('resources').returns([{resource: 'one'}]);
    appState.current.gui.inspector = {
      activeComponent: 'resources'
    };
    const wrapper = renderComponent();
    const header = wrapper.find('InspectorHeader');
    assert.equal(header.prop('activeComponent'), 'resources');
    assert.equal(header.prop('title'), 'Resources');
    const expected = (
      <div className="inspector-content">
        <InspectorResourcesList
          acl={acl}
          resources={[{resource: 'one'}]} />
      </div>);
    assert.compareJSX(wrapper.find('.inspector-content'), expected);
  });

  it('passes changeState callable to header component', function() {
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
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
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
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
    const wrapper = renderComponent();
    wrapper.find('InspectorHeader').props().backCallback();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      gui: {
        inspector: null
      }
    });
  });

  it('passes a title to the header component', function() {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('InspectorHeader').prop('title'), 'demo');
  });

  it('passes the type to the header component', function() {
    appState.current.gui.inspector = {
      id: 'django',
      activeComponent: 'units',
      units: 'error',
      unitStatus: null
    };
    const wrapper = renderComponent();
    assert.equal(wrapper.find('InspectorHeader').prop('type'), 'error');
  });
});
