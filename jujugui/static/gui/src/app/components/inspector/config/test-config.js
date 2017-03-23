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

describe('Configuration', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-config', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('renders binary and string config inputs', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var option1key = 'string body value';
    var option2key = true;
    var charm = {
      get: function() {
        // Return the charm options.
        return { option1: option1, option2: option2 };
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        // Return the config options
        return { option1: option1key, option2: option2key };
      }};
    var setConfig = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />);

    assert.deepEqual(output.props.children[0].props.children[4], [
      <juju.components.StringConfig
        key="Config-option1"
        ref="Config-option1"
        option={option1}
        config={option1key} />,
      <juju.components.BooleanConfig
        key="Config-option2"
        ref="Config-option2"
        label="option2:"
        option={option2}
        config={option2key} />
    ]);
  });

  it('renders message when no config available', function() {
    var charm = {
      get: function() {
        // Return the charm options.
        return null;
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        return {};
      }
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />);
    assert.deepEqual(output.props.children[0].props.children[4],
      <div className="inspector-config--no-config">
        No configuration options.
      </div>);
  });

  it('saves the config when save config is clicked', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var option1key = 'string body value';
    var option2key = true;
    var charm = {
      get: function() {
        // Return the charm options.
        return { option1: option1, option2: option2 };
      }};
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('cs:trusty/ghost');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    var service = {
      get: serviceGet
    };
    var setConfig = sinon.stub();
    var changeState = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}/>);

    var domNode = ReactDOM.findDOMNode(component);

    var string = domNode.querySelector('.string-config--value');
    var bool = domNode.querySelector('.boolean-config--input');

    string.innerText = 'new value';
    testUtils.Simulate.input(string);

    // React requires us to pass in the full change object instead of it
    // actually interacting with the DOM.
    testUtils.Simulate.change(bool, {target: {checked: false}});

    var save = domNode.querySelector('.button-row--count-2 .button--neutral');
    testUtils.Simulate.click(save);

    assert.equal(setConfig.callCount, 1);
    var args = setConfig.args[0];
    assert.strictEqual(args.length, 3);
    assert.equal(args[0], 'cs:trusty/ghost');
    assert.deepEqual(args[1], {option1: 'new value', option2: false});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'cs:trusty/ghost',
          activeComponent: undefined
        }}});
  });

  it('can change the service name for ghost services', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var charm = {
      get: sinon.stub().returns({ option1: option1, option2: option2 })
    };
    var option1key = 'string body value';
    var option2key = true;
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('abc123$');
    serviceGet.withArgs('name').returns('servicename');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    var service = {
      get: serviceGet,
      set: sinon.stub()
    };
    var updateUnit = sinon.stub();
    var getServiceByName = sinon.stub().returns(null);
    var component = testUtils.renderIntoDocument(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={getServiceByName}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={updateUnit}/>);
    assert.equal(component.refs.ServiceName.props.config, 'servicename');

    var domNode = ReactDOM.findDOMNode(component);
    var name = domNode.querySelector('.string-config--value');

    name.innerText = 'newservicename';
    testUtils.Simulate.input(name);

    var save = domNode.querySelector('.button-row--count-2 .button--neutral');
    testUtils.Simulate.click(save);

    assert.equal(service.set.callCount, 1);
    assert.deepEqual(service.set.args[0], ['name', 'newservicename']);
    // Calls to update then unit names.
    assert.equal(updateUnit.callCount, 1);
    assert.equal(updateUnit.args[0][0], 'abc123$');
    // Calls to check to see if a service exists.
    assert.equal(getServiceByName.callCount, 1);
    assert.equal(getServiceByName.args[0][0], 'newservicename');
  });

  it('allows you to modify the series of multi-series charms', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option1key = 'string body value';
    var charm = {
      get: function(val) {
        // Return the charm options.
        if (val === 'options') {
          return { option1: option1 };
        }
        if (val === 'series') {
          return ['precise', 'trusty'];
        }
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        if (val === 'series') {
          return 'trusty';
        }
        if (val === 'pending') {
          return true;
        }
        // Return the config options
        return { option1: option1key };
      }};
    var setConfig = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <div className="inspector-config__series-select">
        <span>Choose Series</span>
        <select
          className="inspector-config__select"
          disabled={false}
          onChange={instance._handleSeriesChange}
          title={undefined}
          value='trusty'>
          {[<option key="precise" value="precise">precise</option>,
            <option key="trusty" value="trusty">trusty</option>]}
        </select>
        <span className="inspector-config__series-select-description">
          Choose the series to deploy. This cannot be
          changed once the application is deployed.
        </span>
      </div>);
    assert.deepEqual(output.props.children[0].props.children[1], expected);
  });

  it('disables the series select if there are existing relations', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option1key = 'string body value';
    var charm = {
      get: function(val) {
        // Return the charm options.
        if (val === 'options') {
          return { option1: option1 };
        }
        if (val === 'series') {
          return ['precise', 'trusty'];
        }
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        if (val === 'series') {
          return 'trusty';
        }
        if (val === 'pending') {
          return true;
        }
        // Return the config options
        return { option1: option1key };
      }};
    var setConfig = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={['one']}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var expected = (
      <div className="inspector-config__series-select">
        <span>Choose Series</span>
        <select
          className="inspector-config__select"
          disabled={true}
          onChange={instance._handleSeriesChange}
          title={'The series for this subordinate has been set ' +
            'to the application it is related to.'}
          value='trusty'>
          {[<option key="precise" value="precise">precise</option>,
            <option key="trusty" value="trusty">trusty</option>]}
        </select>
        <span className="inspector-config__series-select-description">
          Choose the series to deploy. This cannot be
          changed once the application is deployed.
        </span>
      </div>);
    assert.deepEqual(output.props.children[0].props.children[1], expected);
  });

  it('does not allow you to change series if app is deployed', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option1key = 'string body value';
    var charm = {
      get: function(val) {
        // Return the charm options.
        if (val === 'options') {
          return { option1: option1 };
        }
        if (val === 'series') {
          return ['precise', 'trusty'];
        }
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        if (val === 'series') {
          return 'trusty';
        }
        if (val === 'pending') {
          return false;
        }
        // Return the config options
        return { option1: option1key };
      }};
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />);
    assert.deepEqual(output.props.children[0].props.children[1], undefined);
  });

  it('can handle changing of series', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option1key = 'string body value';
    var charm = {
      get: function(val) {
        // Return the charm options.
        if (val === 'options') {
          return { option1: option1 };
        }
        if (val === 'series') {
          return ['precise', 'trusty'];
        }
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        }
        if (val === 'series') {
          return 'trusty';
        }
        if (val === 'pending') {
          return false;
        }
        // Return the config options
        return { option1: option1key };
      },
      set: sinon.stub()};
    var unplaceServiceUnits = sinon.stub().returns([{}, {}]);
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={addNotification}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={unplaceServiceUnits}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    instance._handleSeriesChange({
      currentTarget: {
        value: 'xenial'
      }
    });
    assert.equal(service.set.callCount, 1);
    assert.deepEqual(service.set.args[0], ['series', 'xenial']);
    assert.equal(unplaceServiceUnits.callCount, 1);
    assert.equal(unplaceServiceUnits.args[0][0], 'abc123');
    assert.equal(addNotification.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        machines: ''
      }});
  });

  it('stops setting changes if service name already exists', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var charm = {
      get: sinon.stub().returns({ option1: option1, option2: option2 })
    };
    var option1key = 'string body value';
    var option2key = true;
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('abc123$');
    serviceGet.withArgs('name').returns('servicename');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    var service = {
      get: serviceGet,
      set: sinon.stub()
    };
    var updateUnit = sinon.stub();
    var getServiceByName = sinon.stub().returns(true);
    var addNotification = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.Configuration
        acl={acl}
        addNotification={addNotification}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={getServiceByName}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={updateUnit}/>);

    var domNode = ReactDOM.findDOMNode(component);
    var name = domNode.querySelector('.string-config--value');

    name.innerText = 'newservicename';
    testUtils.Simulate.input(name);

    var save = domNode.querySelector('.button-row--count-2 .button--neutral');
    testUtils.Simulate.click(save);

    // Make sure it emits a notification if the name exists.
    assert.equal(addNotification.callCount, 1);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);
  });

  it('not able to change the service name on deployed services', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var charm = {
      get: sinon.stub().returns({ option1: option1, option2: option2 })
    };
    var option1key = 'string body value';
    var option2key = true;
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('abc123');
    serviceGet.withArgs('name').returns('servicename');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    var service = {
      get: serviceGet,
      set: sinon.stub()
    };
    var component = testUtils.renderIntoDocument(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}/>);
    assert.equal(component.refs.ServiceName, undefined);
  });

  it('can handle cancelling the changes', function() {
    var charm = {
      get: function() {
        return null;
      }};
    var service = {
      get: sinon.stub().returns('mysql')
    };
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}/>);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'mysql',
          activeComponent: undefined
        }}});
  });

  it('can open the file dialog when the button is clicked', function() {
    var charm = {
      get: function() {
        return null;
      }};
    var service = {
      get: sinon.stub().returns('mysql')
    };
    var fileClick = sinon.stub();
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()}/>, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {file: {click: fileClick}};
    var output = shallowRenderer.getRenderOutput();
    var children = output.props.children[0];
    children.props.children[3].props.children.props.buttons[0].action();
    assert.equal(fileClick.callCount, 1);
  });

  it('can get a YAML file when a file is selected', function() {
    var charm = {
      get: function() {
        return null;
      }};
    var service = {
      get: sinon.stub().returns('mysql')
    };
    var getYAMLConfig = sinon.stub();
    var formReset = sinon.stub();
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={getYAMLConfig}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      file: {files: ['apache2.yaml']},
      'file-form': {reset: formReset}
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[2].props.children.props.onChange();
    assert.equal(getYAMLConfig.callCount, 1);
    assert.equal(getYAMLConfig.args[0][0], 'apache2.yaml');
    assert.equal(getYAMLConfig.args[0][1], instance._applyConfig);
    assert.equal(formReset.callCount, 1);
  });

  it('can apply the uploaded config', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var option1key = 'string body value';
    var option2key = true;
    var charmGet = sinon.stub();
    charmGet.withArgs('name').returns('apache2');
    charmGet.withArgs('options').returns(
      {option1: option1, option2: option2});
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('apache2');
    serviceGet.withArgs('config').returns(
      {option1: option1key, option2: option2key});
    var charm = {get: charmGet};
    var service = {get: serviceGet};
    var getYAMLConfig = sinon.stub().callsArgWith(1, {
      apache2: {option1: 'my apache2', option2: false}
    });
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={getYAMLConfig}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      file: {files: ['apache2.yaml']},
      'file-form': {reset: sinon.stub()}
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[2].props.children.props.onChange();
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.children[4], [
      <juju.components.StringConfig
        key="Config-option1"
        ref="Config-option1"
        option={option1}
        config="my apache2" />,
      <juju.components.BooleanConfig
        key="Config-option2"
        ref="Config-option2"
        label="option2:"
        option={option2}
        config={false} />
    ]);
  });

  it('does not try to apply the config for the wrong charm', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var option1key = 'string body value';
    var option2key = true;
    var charmGet = sinon.stub();
    charmGet.withArgs('name').returns('apache2');
    charmGet.withArgs('options').returns(
      {option1: option1, option2: option2});
    var serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('apache2');
    serviceGet.withArgs('config').returns(
      {option1: option1key, option2: option2key});
    var charm = {get: charmGet};
    var service = {get: serviceGet};
    var getYAMLConfig = sinon.stub().callsArgWith(1, {
      postgresql: {option1: 'my apache2', option2: false}
    });
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={getYAMLConfig}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      file: {files: ['apache2.yaml']},
      'file-form': {reset: sinon.stub()}
    };
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      instance.state.serviceConfig,
      {option1: 'string body value', option2: true});
    output.props.children[0].props.children[2].props.children.props.onChange();
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      instance.state.serviceConfig,
      {option1: 'string body value', option2: true});
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    var option1key = 'string body value';
    var option2key = true;
    var charm = {
      get: function() {
        // Return the charm options.
        return { option1: option1, option2: option2 };
      }};
    var service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123$';
        } else if (val === 'name') {
          return 'abc123$';
        }
        // Return the config options
        return { option1: option1key, option2: option2key };
      }};
    var setConfig = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={sinon.stub()}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var importButton = [{
      disabled: true,
      title: 'Import config file',
      action: instance._openFileDialog
    }];
    var actionButtons = [{
      disabled: true,
      title: 'Cancel',
      type: 'base',
      action: instance._showInspectorIndex
    }, {
      disabled: true,
      title: 'Save changes',
      type: 'neutral',
      action: instance._saveConfig
    }];
    var expected = (
      <div className="inspector-config">
        <div className="inspector-config__fields">
        <juju.components.StringConfig
          disabled={true}
          ref="ServiceName"
          option={{
            key: 'Application name',
            description: 'Specify a custom application name. The application' +
              ' name cannot be changed once it has been deployed.'
          }}
          config="abc123$" />
          {undefined}
          <form ref="file-form">
            <input
              className="hidden"
              disabled={true}
              onChange={instance._importConfig}
              ref="file"
              type="file" />
          </form>
          <div className="inspector-config__config-file">
            <juju.components.ButtonRow buttons={importButton} />
          </div>
          {[
            <juju.components.StringConfig
              disabled={true}
              key="Config-option1"
              ref="Config-option1"
              option={option1}
              config={option1key} />,
            <juju.components.BooleanConfig
              disabled={true}
              key="Config-option2"
              ref="Config-option2"
              option={option2}
              label="option2:"
              config={option2key} />
          ]}
        </div>
        <juju.components.ButtonRow buttons={actionButtons} />
      </div>);
    assert.deepEqual(output, expected);
  });
});
