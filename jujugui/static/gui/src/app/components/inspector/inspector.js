'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const InspectorChangeVersion = require('./change-version/change-version');
const InspectorExpose = require('./expose/expose');
const InspectorHeader = require('./header/header');
const Configuration = require('./config/config');
const InspectorPlan = require('./plan/plan');
const InspectorRelateTo = require('./relate-to/relate-to');
const InspectorRelateToEndpoint = require('./relate-to/endpoint/endpoint');
const InspectorRelations = require('./relations/relations');
const InspectorRelationDetails = require('./relations/details/details');
const InspectorResourcesList = require('./resources/list/list');
const ScaleService = require('./scale-service/scale-service');
const ServiceOverview = require('./service-overview/service-overview');
const UnitDetails = require('./unit-details/unit-details');
const UnitList = require('./unit-list/unit-list');

class Inspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.generateState(this.props);
  }

  /**
    Callback for when the header back is clicked.

    @method _backCallback
  */
  _backCallback() {
    this.props.appState.changeState(this.state.activeChild.backState);
  }

  /**
    Generates the state for the inspector based on the app state.

    @method generateState
    @param {Object} nextProps The props which were sent to the component.
    @return {Object} A generated state object which can be passed to setState.
  */
  generateState(nextProps) {
    const { modelAPI } = nextProps;
    const service = nextProps.service;
    const serviceId = service.get('id');
    const appState = this.props.appState;
    const changeState = appState.changeState.bind(appState);
    const state = {
      activeComponent: appState.current.gui.inspector.activeComponent,
      showHeaderLinks: false
    };
    const stateHistory = appState.history;
    const prevState = stateHistory[stateHistory.length-2];
    const previousInspector = prevState.gui && prevState.gui.inspector;
    switch (state.activeComponent) {
      case undefined:
        const backState = {};
        // Handle navigating back from the service details to a previous
        // service's relations.
        if (previousInspector &&
            previousInspector.id !== serviceId &&
            previousInspector.activeComponent === 'relations') {
          backState.gui = {
            inspector: {
              id: previousInspector.id,
              activeComponent: previousInspector.activeComponent}};
        } else {
          backState.gui = {inspector: null};
        }
        state.activeChild = {
          title: service.get('name'),
          icon: service.get('icon'),
          component: <ServiceOverview
            acl={nextProps.acl}
            addNotification={nextProps.addNotification}
            changeState={changeState}
            charm={nextProps.charm}
            destroyService={nextProps.initUtils.destroyService}
            modelUUID={nextProps.modelUUID}
            service={service}
            serviceRelations={nextProps.serviceRelations}
            showActivePlan={nextProps.showActivePlan}
            showPlans={nextProps.showPlans} />,
          backState: backState
        };
        state.showHeaderLinks = true;
        break;
      case 'units':
        var unitStatus = appState.current.gui.inspector.units;
        // A unit status of 'true' is provided when there is no status, but
        // we don't want to pass that on as the status value.
        unitStatus = unitStatus === true ? null : unitStatus;
        var units = service.get('units').filterByStatus(unitStatus);
        state.activeChild = {
          title: 'Units',
          icon: service.get('icon'),
          count: units.length,
          headerType: unitStatus,
          component:
            <UnitList
              acl={nextProps.acl}
              changeState={changeState}
              destroyUnits={nextProps.modelAPI.destroyUnits}
              envResolved={nextProps.modelAPI.envResolved}
              service={service}
              units={units}
              unitStatus={unitStatus} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined
              }}}};
        break;
      case 'unit':
        var unitId = appState.current.gui.inspector.unit;
        var unit = service.get('units').getById(
          serviceId + '/' + unitId);
        var unitStatus = null;
        var previousComponent;
        var id;
        if (previousInspector && previousInspector.units) {
          var units = previousInspector.units;
          previousComponent = previousInspector.activeComponent;
          // A unit status of 'true' is provided when there is no status, but
          // we don't want to pass that on as the status value.
          unitStatus = units === true ? null : units;
          id = previousInspector.id;
        } else {
          id = serviceId;
        }
        // If the unit doesn't exist then show the list of units.
        if (!unit) {
          changeState({
            gui: {
              inspector: {
                id: id,
                activeComponent: 'units',
                unit: null,
                unitStatus: unitStatus}}});
          return {};
        }
        state.activeChild = {
          title: unit.displayName,
          icon: service.get('icon'),
          headerType: unit.agent_state || 'uncommitted',
          component:
            <UnitDetails
              acl={nextProps.acl}
              changeState={changeState}
              destroyUnits={nextProps.modelAPI.destroyUnits}
              generatePath={this.props.appState.generatePath}
              previousComponent={previousComponent}
              service={service}
              showSSHButtons={nextProps.showSSHButtons && window.juju_config.flags.expert}
              unit={unit}
              unitStatus={unitStatus} />,
          backState: {
            gui: {
              inspector: {
                id: id,
                activeComponent: previousComponent || 'units',
                unit: null,
                unitStatus: unitStatus}}}};
        break;
      case 'scale':
        const { initUtils } = nextProps;
        state.activeChild = {
          title: 'Scale',
          icon: service.get('icon'),
          component:
            <ScaleService
              acl={nextProps.acl}
              changeState={changeState}
              initUtils={{
                addGhostAndEcsUnits: initUtils.addGhostAndEcsUnits,
                createMachinesPlaceUnits: initUtils.createMachinesPlaceUnits,
                reshape: shapeup.reshapeFunc
              }}
              providerType={nextProps.providerType}
              serviceId={serviceId} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: 'units'}}}};
        break;
      case 'config':
        state.activeChild = {
          title: 'Configure',
          icon: service.get('icon'),
          component:
            <Configuration
              acl={nextProps.acl}
              addNotification={nextProps.addNotification}
              changeState={changeState}
              charm={nextProps.charm}
              getServiceByName={nextProps.services.getServiceByName}
              service={service}
              serviceRelations={nextProps.serviceRelations}
              setConfig={nextProps.modelAPI.setConfig}
              unplaceServiceUnits={nextProps.unplaceServiceUnits}
              updateServiceUnitsDisplayname={nextProps.updateServiceUnitsDisplayname} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
      case 'expose':
        state.activeChild = {
          title: 'Expose',
          icon: service.get('icon'),
          component:
            <InspectorExpose
              acl={nextProps.acl}
              addNotification={nextProps.addNotification}
              changeState={changeState}
              modelAPI={shapeup.addReshape({
                exposeService: modelAPI.exposeService,
                unexposeService: modelAPI.unexposeService
              })}
              service={service}
              units={service.get('units')} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
      case 'relations':
        state.activeChild = {
          title: 'Relations',
          icon: service.get('icon'),
          component:
            <InspectorRelations
              acl={nextProps.acl}
              changeState={changeState}
              destroyRelations={nextProps.relationUtils.destroyRelations}
              service={service}
              serviceRelations={nextProps.serviceRelations} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
      case 'relation':
        var relationIndex = nextProps.appState.current.gui.inspector.relation;
        var relation = nextProps.serviceRelations[relationIndex];
        var serviceName = relation.far.serviceName;
        var relationName = relation.far.name;
        state.activeChild = {
          title: (serviceName + ':' + relationName),
          icon: service.get('icon'),
          component:
            <InspectorRelationDetails
              relation={relation} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: 'relations'}}}};
        break;
      case 'relate-to':
        const spouse = nextProps.appState.current.gui.inspector['relate-to'];
        if (typeof serviceId === 'string' && typeof spouse === 'string') {
          state.activeChild = {
            title: nextProps.services.getById(spouse).get('name'),
            icon: service.get('icon'),
            component:
              <InspectorRelateToEndpoint
                backState={{
                  gui: {
                    inspector: {
                      id: serviceId,
                      activeComponent: 'relations'}}}}
                changeState={changeState}
                createRelation={nextProps.relationUtils.createRelation}
                endpoints={nextProps.relationUtils.getAvailableEndpoints(
                  service, nextProps.services.getById(spouse))} />,
            backState: {
              gui: {
                inspector: {
                  id: serviceId,
                  activeComponent: 'relate-to'}}}};
          break;
        }
        state.activeChild = {
          title: 'Relate to',
          icon: service.get('icon'),
          component:
            <InspectorRelateTo
              application={service}
              changeState={changeState}
              relatableApplications={nextProps.relatableApplications} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: 'relations'
              }
            }
          }
        };
        break;
      case 'change-version':
        state.activeChild = {
          title: 'Change version',
          icon: service.get('icon'),
          component:
            <InspectorChangeVersion
              acl={nextProps.acl}
              addCharm={nextProps.addCharm}
              addNotification={nextProps.addNotification}
              changeState={changeState}
              charmId={service.get('charm')}
              getAvailableVersions={nextProps.getAvailableVersions}
              modelAPI={shapeup.addReshape({
                getCharm: modelAPI.getCharm,
                setCharm: modelAPI.setCharm
              })}
              service={service} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
      case 'resources':
        state.activeChild = {
          title: 'Resources',
          icon: service.get('icon'),
          component:
            <InspectorResourcesList
              acl={nextProps.acl}
              resources={nextProps.charm.get('resources')} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
      case 'plan':
        state.activeChild = {
          title: 'Plan',
          icon: service.get('icon'),
          component:
            <InspectorPlan
              acl={nextProps.acl}
              currentPlan={nextProps.service.get('activePlan')} />,
          backState: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: undefined}}}};
        break;
    }
    return state;
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.generateState(nextProps));
  }

  render() {
    return (
      <div className="inspector-view">
        <InspectorHeader
          activeComponent={this.state.activeComponent}
          backCallback={this._backCallback.bind(this)}
          changeState={this.props.appState.changeState.bind(this.props.appState)}
          charmId={this.props.charm.get('id')}
          hasGetStarted={this.props.charm.hasGetStarted()}
          icon={this.state.activeChild.icon}
          showLinks={this.state.showHeaderLinks}
          title={this.state.activeChild.title}
          type={this.state.activeChild.headerType} />
        <div className="inspector-content">
          {this.state.activeChild.component}
        </div>
      </div>
    );
  }
};

Inspector.propTypes = {
  acl: PropTypes.object.isRequired,
  addCharm: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  appState: PropTypes.object.isRequired,
  charm: PropTypes.object.isRequired,
  getAvailableVersions: PropTypes.func.isRequired,
  initUtils: shapeup.shape({
    addGhostAndEcsUnits: PropTypes.func.isRequired,
    createMachinesPlaceUnits: PropTypes.func.isRequired,
    destroyService: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).isRequired,
  modelAPI: shapeup.shape({
    destroyUnits: PropTypes.func.isRequired,
    envResolved: PropTypes.func.isRequired,
    exposeService: PropTypes.func.isRequired,
    getCharm: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    setCharm: PropTypes.func.isRequired,
    setConfig: PropTypes.func.isRequired,
    unexposeService: PropTypes.func.isRequired
  }).isRequired,
  modelUUID: PropTypes.string.isRequired,
  providerType: PropTypes.string,
  relatableApplications: PropTypes.array.isRequired,
  relationUtils: shapeup.shape({
    createRelation: PropTypes.func.isRequired,
    destroyRelations: PropTypes.func.isRequired,
    getAvailableEndpoints: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).isRequired,
  service: PropTypes.object.isRequired,
  serviceRelations: PropTypes.array.isRequired,
  services: shapeup.shape({
    getById: PropTypes.func.isRequired,
    getServiceByName: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc
  }).isRequired,
  showActivePlan: PropTypes.func.isRequired,
  showPlans: PropTypes.bool.isRequired,
  showSSHButtons: PropTypes.bool.isRequired,
  unplaceServiceUnits: PropTypes.func.isRequired,
  updateServiceUnitsDisplayname: PropTypes.func.isRequired
};

module.exports = Inspector;
