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
    var service = {
      get: function() {
        return {name: 'demo'};
      }};
    var appState = {
      sectionA: {
        metadata: {}
      }};
    var shallowRenderer = testUtils.createRenderer();
    var clearState = sinon.stub();
    var destroyService = sinon.stub();
    var getUnitStatusCounts = sinon.stub();
    var appPreviousState = sinon.stub();
    shallowRenderer.render(
        <juju.components.Inspector
          service={service}
          destroyService={destroyService}
          getUnitStatusCounts={getUnitStatusCounts}
          clearState={clearState}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[1].props.children,
        <juju.components.ServiceOverview
          changeState={undefined}
          destroyService={destroyService}
          getUnitStatusCounts={getUnitStatusCounts}
          clearState={clearState}
          service={service} />);
  });

  it('displays the unit list when the app state calls for it', function() {
    var envResolved = sinon.stub();
    var changeStateStub = sinon.stub();
    var destroyUnits = sinon.stub();
    var appPreviousState = sinon.stub();
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
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          appState={appState}
          destroyUnits={destroyUnits}
          envResolved={envResolved}
          appPreviousState={appPreviousState}
          changeState={changeStateStub}>
        </juju.components.Inspector>);

    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.UnitList
          serviceId="demo"
          unitStatus="error"
          units={[]}
          envResolved={envResolved}
          destroyUnits={destroyUnits}
          changeState={changeStateStub} />);
  });

  it('displays the configuration when the app state calls for it', function() {
    var setConfig = sinon.stub();
    var charm = 'charm';
    var getStub = sinon.stub();
    var changeState = sinon.stub();
    var appPreviousState = sinon.stub();
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'config'
        }}};
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          appState={appState}
          service={service}
          changeState={changeState}
          charm={charm}
          appPreviousState={appPreviousState}
          setConfig={setConfig} /> );

    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.Configuration
          service={service}
          changeState={changeState}
          charm={charm}
          setConfig={setConfig} />);
  });

  it('displays the unit details when the app state calls for it', function() {
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
    var appPreviousState = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.Inspector
          service={service}
          destroyUnits={destroyUnits}
          changeState={changeState}
          appPreviousState={appPreviousState}
          appState={appState}>
        </juju.components.Inspector>);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.UnitDetails
          destroyUnits={destroyUnits}
          serviceId="demo"
          changeState={changeState}
          previousComponent={undefined}
          unitStatus={null}
          unit="unit" />);
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
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');

    var service = {
      get: getStub
    };

    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'scale',
        }}};
    var output = jsTestUtils.shallowRender(
      <juju.components.Inspector
        service={service}
        appPreviousState={appPreviousState}
        appState={appState} />);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.ScaleService
          serviceId={service.get('id')}
          addGhostAndEcsUnits={children.props.addGhostAndEcsUnits}
          createMachinesPlaceUnits={children.props.createMachinesPlaceUnits}
          changeState={children.props.changeState} />);
  });

  it('displays Expose when the app state calls for it', function() {
    var changeState = sinon.stub();
    var exposeService = sinon.stub();
    var unexposeService = sinon.stub();
    var service = sinon.stub();
    var units = sinon.stub();
    var appPreviousState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('units').returns(units);
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'expose',
        }}};
    var output = jsTestUtils.shallowRender(
      <juju.components.Inspector
        changeState={changeState}
        exposeService={exposeService}
        unexposeService={unexposeService}
        service={service}
        appPreviousState={appPreviousState}
        appState={appState} />);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.InspectorExpose
          changeState={changeState}
          exposeService={exposeService}
          unexposeService={unexposeService}
          service={service}
          units={units} />);
  });

  it('displays Relations when the app state calls for it', function() {
    var changeState = sinon.stub();
    var getRelationDataForService = sinon.stub();
    var service = sinon.stub();
    var appPreviousState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'relations',
        }}};
    var output = jsTestUtils.shallowRender(
      <juju.components.Inspector
        changeState={changeState}
        service={service}
        getRelationDataForService={getRelationDataForService}
        appPreviousState={appPreviousState}
        appState={appState} />);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
        <juju.components.InspectorRelations
          changeState={changeState}
          getRelationDataForService={getRelationDataForService}
          service={service} />);
  });

  it('displays Change versions when the app state calls for it', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var appPreviousState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('charm').returns('cs:demo');
    var service = {
      get: getStub
    };
    var appState = {
      sectionA: {
        metadata: {
          activeComponent: 'change-version',
        }}};
    var output = jsTestUtils.shallowRender(
      <juju.components.Inspector
        changeState={changeState}
        setCharm={setCharm}
        getCharm={getCharm}
        getAvailableVersions={getAvailableVersions}
        appPreviousState={appPreviousState}
        service={service}
        appState={appState} />);
    var children = output.props.children[1].props.children;
    assert.deepEqual(children,
      <juju.components.InspectorChangeVersion
        changeState={changeState}
        charmId="cs:demo"
        service={service}
        setCharm={setCharm}
        getCharm={getCharm}
        getAvailableVersions={getAvailableVersions} />);
  });

  it('passes changeState callable to header component', function() {
    var appPreviousState = sinon.stub();
    var service = {
      get: function() {
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
      get: function() {
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
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.InspectorHeader
        backCallback={output.props.children[0].props.backCallback}
        activeComponent={undefined}
        count={undefined}
        type={undefined}
        title="demo"/>);
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
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0],
      <juju.components.InspectorHeader
        backCallback={output.props.children[0].props.backCallback}
        count={0}
        activeComponent="units"
        type="error"
        title="Units"/>);
  });
});
