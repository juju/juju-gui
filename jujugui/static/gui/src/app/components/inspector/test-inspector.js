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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-component', function() { done(); });
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
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var getUnitStatusCounts = sinon.stub();
    var appPreviousState = sinon.stub();
    var serviceRelations = sinon.stub();
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyService={destroyService}
          getUnitStatusCounts={getUnitStatusCounts}
          linkify={sinon.stub()}
          clearState={clearState}
          appPreviousState={appPreviousState}
          appState={appState}
          serviceRelations={serviceRelations} />, true);
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
    var expectedOverview = (
        <juju.components.ServiceOverview
          changeState={undefined}
          destroyService={destroyService}
          getUnitStatusCounts={getUnitStatusCounts}
          clearState={clearState}
          service={service}
          serviceRelations={serviceRelations} />);
    var overview = output.props.children[1].props.children;
    assert.deepEqual(overview, expectedOverview,
                     'Overview is not rendered as expected');
  });

  it('displays the unit list when the app state calls for it', function() {
    var envResolved = sinon.stub();
    var changeStateStub = sinon.stub();
    var destroyUnits = sinon.stub();
    var appPreviousState = sinon.stub();
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
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'units',
          units: unitStatus
        }}};
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          appState={appState}
          destroyUnits={destroyUnits}
          envResolved={envResolved}
          linkify={sinon.stub()}
          appPreviousState={appPreviousState}
          changeState={changeStateStub}>
        </juju.components.Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
          service={service}
          unitStatus="error"
          units={[]}
          envResolved={envResolved}
          destroyUnits={destroyUnits}
          changeState={changeStateStub} />);
  });

  it('displays the configuration when the app state calls for it', function() {
    var setConfig = sinon.stub();
    var charm = {};
    var getStub = sinon.stub();
    var icon = 'foo.png';
    getStub.withArgs('icon').returns(icon);
    var changeState = sinon.stub();
    var getYAMLConfig = sinon.stub();
    var appPreviousState = sinon.stub();
    var updateServiceUnitsDisplayname = sinon.stub();
    var getServiceByName = sinon.stub();
    var addNotification = sinon.stub();
    var linkify = sinon.stub();
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'config'
        }}};
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
          appState={appState}
          service={service}
          changeState={changeState}
          getYAMLConfig={getYAMLConfig}
          charm={charm}
          appPreviousState={appPreviousState}
          updateServiceUnitsDisplayname={updateServiceUnitsDisplayname}
          addNotification={addNotification}
          getServiceByName={getServiceByName}
          linkify={linkify}
          setConfig={setConfig} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
          service={service}
          changeState={changeState}
          getYAMLConfig={getYAMLConfig}
          charm={charm}
          setConfig={setConfig}
          updateServiceUnitsDisplayname={updateServiceUnitsDisplayname}
          addNotification={addNotification}
          linkify={linkify}
          getServiceByName={getServiceByName} />);
  });

  it('displays the unit details when the app state calls for it', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
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
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'unit',
          unit: '5'
        }}};
    var appPreviousState = sinon.stub();
    var component = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyUnits={destroyUnits}
          changeState={changeState}
          linkify={sinon.stub()}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
        destroyUnits={destroyUnits}
        service={service}
        changeState={changeState}
        previousComponent={undefined}
        unitStatus={null}
        unit={unit} />
    );
    assert.deepEqual(children, expectedChildren,
                     'Unit details not rendered as expected');
  });

  it('handles the unit being removed while viewing the unit', function() {
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({
      filterByStatus: sinon.stub().returns([])
    });
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'units',
          units: 'error'
        }}};
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Inspector
        service={service}
        appState={appState}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        linkify={sinon.stub()}
        appPreviousState={sinon.stub()}
        changeState={changeState} />, true);
    var instance = shallowRenderer.getMountedInstance();
    assert.equal(instance.state.activeComponent, 'units');
    getStub.withArgs('units').returns({getById: function() {
      return;
    }});
    service = {
      get: getStub
    };
    appState = {
      sectionA: {
        metadata: {
          activeComponent: 'unit',
          unit: '5'
        }}};
    shallowRenderer.render(
      <juju.components.Inspector
        service={service}
        appState={appState}
        destroyUnits={sinon.stub()}
        envResolved={sinon.stub()}
        linkify={sinon.stub()}
        appPreviousState={sinon.stub()}
        changeState={sinon.stub()} />);
    // The displayed component should not have been updated.
    assert.equal(instance.state.activeComponent, 'units');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'demo',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('can go back from the unit details to a status list', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return 'unit';
    }});
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'unit',
          unit: '5'
        }}};
    var appPreviousState = {
      sectionA: {
        metadata: {
          activeComponent: 'units',
          units: 'error',
          id: 'demo'
        }}};
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyUnits={destroyUnits}
          changeState={changeState}
          linkify={sinon.stub()}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'demo',
          activeComponent: 'units',
          unit: null,
          unitStatus: 'error'
        }}});
  });

  it('defaults to go back from the unit details to the all list', function() {
    var destroyUnits = sinon.stub();
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return 'unit';
    }});
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'unit',
          unit: '5'
        }}};
    var appPreviousState = {};
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyUnits={destroyUnits}
          changeState={changeState}
          linkify={sinon.stub()}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
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
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns({getById: function() {
      return 'unit';
    }});
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'unit',
          unit: '5'
        }}};
    var appPreviousState = {
      sectionA: {
        metadata: {
          id: 'previousService',
          units: true
        }}};
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyUnits={destroyUnits}
          changeState={changeState}
          linkify={sinon.stub()}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>);
    output.props.children[0].props.backCallback();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'previousService',
          activeComponent: 'units',
          unit: null,
          unitStatus: null
        }}});
  });

  it('displays the Scale Service when the app state calls for it', function() {
    var appPreviousState = sinon.stub();
    var icon = 'foo.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };

    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'scale',
        }}};
    var component = jsTestUtils.shallowRender(
      <juju.components.Inspector
        linkify={sinon.stub()}
        service={service}
        appPreviousState={appPreviousState}
        appState={appState} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
        type={undefined}
        count={undefined}
        title='Scale'
        icon={icon} />
    );
    assert.deepEqual(header, expectedHeader,
                     'Header is not rendered as expected');
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.ScaleService
          serviceId={service.get('id')}
          addGhostAndEcsUnits={children.props.addGhostAndEcsUnits}
          createMachinesPlaceUnits={children.props.createMachinesPlaceUnits}
          changeState={children.props.changeState} />);
  });

  it('displays Expose when the app state calls for it', function() {
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var exposeService = sinon.stub();
    var unexposeService = sinon.stub();
    var service = sinon.stub();
    var units = sinon.stub();
    var appPreviousState = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    getStub.withArgs('units').returns(units);
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'expose',
        }}};
    var component = jsTestUtils.shallowRender(
      <juju.components.Inspector
        addNotification={addNotification}
        changeState={changeState}
        exposeService={exposeService}
        linkify={sinon.stub()}
        unexposeService={unexposeService}
        service={service}
        appPreviousState={appPreviousState}
        appState={appState} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
          addNotification={addNotification}
          changeState={changeState}
          exposeService={exposeService}
          unexposeService={unexposeService}
          service={service}
          units={units} />);
  });

  it('displays Relations when the app state calls for it', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var appPreviousState = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'relations',
        }}};
    var serviceRelations = sinon.stub();
    var component = jsTestUtils.shallowRender(
      <juju.components.Inspector
        changeState={changeState}
        service={service}
        appPreviousState={appPreviousState}
        appState={appState}
        linkify={sinon.stub()}
        serviceRelations={serviceRelations} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
          changeState={changeState}
          service={service}
          serviceRelations={serviceRelations} />);
  });

  it('displays Change versions when the app state calls for it', function() {
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var service = sinon.stub();
    var getMacaroon = sinon.stub();
    var addCharm = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var appPreviousState = sinon.stub();
    var icon = 'icon.png';
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('charm').returns('cs:demo');
    getStub.withArgs('icon').returns(icon);
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'change-version',
        }}};
    var component = jsTestUtils.shallowRender(
      <juju.components.Inspector
        addNotification={addNotification}
        changeState={changeState}
        getMacaroon={getMacaroon}
        addCharm={addCharm}
        setCharm={setCharm}
        getCharm={getCharm}
        getAvailableVersions={getAvailableVersions}
        linkify={sinon.stub()}
        appPreviousState={appPreviousState}
        service={service}
        appState={appState} />, true);
    var instance = component.getMountedInstance();
    var output = component.getRenderOutput();
    var header = output.props.children[0];
    var expectedHeader = (
      <juju.components.InspectorHeader
        backCallback={instance._backCallback}
        activeComponent={appState.sectionA.metadata.activeComponent}
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
        addNotification={addNotification}
        changeState={changeState}
        charmId="cs:demo"
        service={service}
        getMacaroon={getMacaroon}
        addCharm={addCharm}
        setCharm={setCharm}
        getCharm={getCharm}
        getAvailableVersions={getAvailableVersions} />);
  });

  it('passes changeState callable to header component', function() {
    var appPreviousState = sinon.stub();
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        }
        return {name: 'demo'};
      }};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'services',
        metadata: null
      }
    });
  });

  it('can navigate back to the inspector from a service', function() {
    var appPreviousState = {
      sectionA: {
        metadata: {
          activeComponent: 'relations',
          id: 'service2'
        }}};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        }
        return {name: 'demo'};
      }};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'service2',
          activeComponent: 'relations'
        }
      }
    });
  });

  it('does not go back to the inspector from the same service', function() {
    var appPreviousState = {
      sectionA: {
        metadata: {
          activeComponent: 'relations',
          id: 'demo'
        }}};
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('name').returns('demo');
    var service = {get: getStub};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'services',
        metadata: null
      }
    });
  });

  it('passes a title to the header component', function() {
    var appPreviousState = sinon.stub();
    var service = {
      get: function() {
        return 'demo';
      }};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[0].props.title, 'demo');
  });

  it('passes the type to the header component', function() {
    var appPreviousState = sinon.stub();
    var service = {
      get: sinon.stub().returns({
        filterByStatus: sinon.stub().returns([])
      })
    };
    var appState = {
      sectionA: {
        metadata: {
          id: 'django',
          activeComponent: 'units',
          units: 'error'
        }
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.type, 'error');
  });

  it('displays the service overview when switching services', function() {
    var appPreviousState = {
      sectionA: {
        metadata: {
          activeComponent: 'relations',
          id: 'service2'
        }}};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'apache2';
        }
        return {name: 'demo'};
      }};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    shallowRenderer.getRenderOutput();
    assert.equal(changeStub.callCount, 0);
    service = {
      get: function(val) {
        if (val === 'id') {
          return 'django';
        }
        return {name: 'demo'};
      }};
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          appState={appState}
          appPreviousState={appPreviousState}
          linkify={sinon.stub()}
          service={service} />);
    shallowRenderer.getRenderOutput();
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'django',
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }}});
  });
});
