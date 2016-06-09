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

YUI.add('inspector-component', function() {

  juju.components.Inspector = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addCharm: React.PropTypes.func.isRequired,
      addGhostAndEcsUnits: React.PropTypes.func.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      appPreviousState: React.PropTypes.object.isRequired,
      appState: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      charm: React.PropTypes.object.isRequired,
      clearState: React.PropTypes.func.isRequired,
      createMachinesPlaceUnits: React.PropTypes.func.isRequired,
      destroyRelations: React.PropTypes.func.isRequired,
      destroyService: React.PropTypes.func.isRequired,
      destroyUnits: React.PropTypes.func.isRequired,
      displayPlans: React.PropTypes.bool.isRequired,
      envResolved: React.PropTypes.func.isRequired,
      exposeService: React.PropTypes.func.isRequired,
      getAvailableVersions: React.PropTypes.func.isRequired,
      getCharm: React.PropTypes.func.isRequired,
      getMacaroon: React.PropTypes.func.isRequired,
      getServiceByName: React.PropTypes.func.isRequired,
      getUnitStatusCounts: React.PropTypes.func.isRequired,
      getYAMLConfig: React.PropTypes.func.isRequired,
      linkify: React.PropTypes.func.isRequired,
      modelUUID: React.PropTypes.string.isRequired,
      service: React.PropTypes.object.isRequired,
      serviceRelations: React.PropTypes.array.isRequired,
      setCharm: React.PropTypes.func.isRequired,
      setConfig: React.PropTypes.func.isRequired,
      showActivePlan: React.PropTypes.func.isRequired,
      unexposeService: React.PropTypes.func.isRequired,
      updateServiceUnitsDisplayname: React.PropTypes.func.isRequired
    },

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return this.generateState(this.props);
    },

    /**
      Callback for when the header back is clicked.

      @method _backCallback
    */
    _backCallback: function() {
      this.props.changeState(this.state.activeChild.backState);
    },

    /**
      Generates the state for the inspector based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var service = nextProps.service;
      var serviceId = service.get('id');
      var metadata = nextProps.appState.sectionA.metadata;
      var lastId = this.props.service.get('id');
      if (lastId && serviceId !== lastId) {
        // If we've switched to a new service then return to the service
        // overview. All metadata properties need to be cleared to prevent
        // displaying a particular sub-view.
        this.props.changeState({
          sectionA: {
            component: 'inspector',
            metadata: {
              id: serviceId,
              activeComponent: undefined,
              unit: null,
              unitStatus: null
            }}});
        return {};
      }
      var state = {
        activeComponent: metadata.activeComponent
      };
      var appPreviousState = nextProps.appPreviousState ||
          this.props.appPreviousState;
      var previousMetadata;
      if (appPreviousState.sectionA) {
        previousMetadata = appPreviousState.sectionA.metadata;
      }
      switch (state.activeComponent) {
        case undefined:
          var component;
          var newMetadata;
          // Handle navigating back from the service details to a previous
          // service's relations.
          if (previousMetadata && previousMetadata.id !== serviceId &&
              previousMetadata.activeComponent === 'relations') {
            component = 'inspector';
            newMetadata = {
              id: previousMetadata.id,
              activeComponent: previousMetadata.activeComponent
            };
          }
          state.activeChild = {
            title: service.get('name'),
            icon: service.get('icon'),
            component: <juju.components.ServiceOverview
              acl={this.props.acl}
              changeState={this.props.changeState}
              charm={this.props.charm}
              clearState={this.props.clearState}
              destroyService={this.props.destroyService}
              displayPlans={this.props.displayPlans}
              getUnitStatusCounts={this.props.getUnitStatusCounts}
              modelUUID={this.props.modelUUID}
              service={service}
              serviceRelations={this.props.serviceRelations}
              showActivePlan={this.props.showActivePlan} />,
            backState: {
              sectionA: {
                component: component || 'applications',
                metadata: newMetadata || null
              }}};
          break;
        case 'units':
          var unitStatus = metadata.units;
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
              <juju.components.UnitList
                acl={this.props.acl}
                service={service}
                unitStatus={unitStatus}
                units={units}
                envResolved={this.props.envResolved}
                destroyUnits={this.props.destroyUnits}
                changeState={this.props.changeState} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
        case 'unit':
          var unitId = metadata.unit;
          var unit = service.get('units').getById(
                serviceId + '/' + unitId);
          var unitStatus = null;
          var previousComponent;
          var id;
          if (previousMetadata) {
            var units = previousMetadata.units;
            previousComponent = previousMetadata.activeComponent;
            // A unit status of 'true' is provided when there is no status, but
            // we don't want to pass that on as the status value.
            unitStatus = units === true ? null : units;
            id = previousMetadata.id;
          } else {
            id = serviceId;
          }
          // If the unit doesn't exist then show the list of units.
          if (!unit) {
            this.props.changeState({
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: id,
                  activeComponent: 'units',
                  unit: null,
                  unitStatus: unitStatus
                }}});
            return {};
          }
          state.activeChild = {
            title: unit.displayName,
            icon: service.get('icon'),
            headerType: unit.agent_state || 'uncommitted',
            component:
              <juju.components.UnitDetails
                acl={this.props.acl}
                destroyUnits={this.props.destroyUnits}
                service={service}
                changeState={this.props.changeState}
                unitStatus={unitStatus}
                previousComponent={previousComponent}
                unit={unit} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: id,
                  activeComponent: previousComponent || 'units',
                  unit: null,
                  unitStatus: unitStatus
                }}}};
          break;
        case 'scale':
          state.activeChild = {
            title: 'Scale',
            icon: service.get('icon'),
            component:
              <juju.components.ScaleService
                acl={this.props.acl}
                serviceId={serviceId}
                addGhostAndEcsUnits={this.props.addGhostAndEcsUnits}
                createMachinesPlaceUnits={this.props.createMachinesPlaceUnits}
                changeState={this.props.changeState} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: 'units'
                }}}};
          break;
        case 'config':
          state.activeChild = {
            title: 'Configure',
            icon: service.get('icon'),
            component:
              <juju.components.Configuration
                acl={this.props.acl}
                service={service}
                charm={nextProps.charm}
                changeState={this.props.changeState}
                getYAMLConfig={this.props.getYAMLConfig}
                updateServiceUnitsDisplayname=
                  {this.props.updateServiceUnitsDisplayname}
                getServiceByName={this.props.getServiceByName}
                addNotification={this.props.addNotification}
                linkify={this.props.linkify}
                setConfig={nextProps.setConfig} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
        case 'expose':
          state.activeChild = {
            title: 'Expose',
            icon: service.get('icon'),
            component:
              <juju.components.InspectorExpose
                acl={this.props.acl}
                changeState={this.props.changeState}
                exposeService={this.props.exposeService}
                unexposeService={this.props.unexposeService}
                addNotification={this.props.addNotification}
                service={service}
                units={service.get('units')} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
        case 'relations':
          state.activeChild = {
            title: 'Relations',
            icon: service.get('icon'),
            component:
              <juju.components.InspectorRelations
                acl={this.props.acl}
                service={service}
                destroyRelations={this.props.destroyRelations}
                serviceRelations={this.props.serviceRelations}
                changeState={this.props.changeState} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
        case 'relation':
          var relationIndex = metadata.relation;
          var relation = this.props.serviceRelations[relationIndex];
          var serviceName = relation.far.serviceName;
          var relationName = relation.far.name;
          state.activeChild = {
            title: (serviceName + ':' + relationName),
            icon: service.get('icon'),
            component:
              <juju.components.InspectorRelationDetails
                relation={relation} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: 'relations'
                }}}};
          break;
        case 'relate-to':
          var spouse = metadata['relate-to'];
          console.log(typeof serviceId, typeof spouse);
          if (typeof serviceId === 'string' && typeof spouse === 'string') {
            console.log('Show relation types');
            state.activeChild = {
              title: spouse,
              icon: service.get('icon'),
              component:
                <juju.components.InspectorRelateToType
                  service={service}
                  createRelation={this.props.createRelation}
                  serviceRelations={this.props.serviceRelations}
                  changeState={this.props.changeState} />,
              backState: {
                sectionA: {
                  component: 'inspector',
                  metadata: {
                    id: serviceId,
                    activeComponent: 'relations'
                  }}}};
            break;
          }
          state.activeChild = {
            title: 'Relate to',
            icon: service.get('icon'),
            component:
              <juju.components.InspectorRelateTo
                changeState={this.props.changeState}
                application={service}
                getRelatableApplications={this.props.getRelatableApplications}
                />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: 'relations'
                }}}};
          break;
        case 'change-version':
          state.activeChild = {
            title: 'Change version',
            icon: service.get('icon'),
            component:
              <juju.components.InspectorChangeVersion
                acl={this.props.acl}
                changeState={this.props.changeState}
                addNotification={this.props.addNotification}
                charmId={service.get('charm')}
                service={service}
                getMacaroon={this.props.getMacaroon}
                addCharm={this.props.addCharm}
                setCharm={this.props.setCharm}
                getCharm={this.props.getCharm}
                getAvailableVersions={this.props.getAvailableVersions} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
        case 'plan':
          state.activeChild = {
            title: 'Plan',
            icon: service.get('icon'),
            component:
              <juju.components.InspectorPlan
                acl={this.props.acl}
                currentPlan={this.props.service.get('activePlan')} />,
            backState: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: undefined
                }}}};
          break;
      }
      return state;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    render: function() {
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._backCallback}
            activeComponent={this.state.activeComponent}
            type={this.state.activeChild.headerType}
            count={this.state.activeChild.count}
            title={this.state.activeChild.title}
            icon={this.state.activeChild.icon} />
          <div className="inspector-content">
            {this.state.activeChild.component}
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'inspector-change-version',
    'inspector-expose',
    'inspector-header',
    'inspector-config',
    'inspector-plan',
    'inspector-relations',
    'inspector-relation-details',
    'inspector-relate-to',
    'inspector-relate-to-type',
    'scale-service',
    'service-overview',
    'unit-details',
    'unit-list'
  ]
});
