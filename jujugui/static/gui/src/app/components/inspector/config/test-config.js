/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const Configuration = require('./config');
const BooleanConfig = require('../../boolean-config/boolean-config');
const StringConfig = require('../../string-config/string-config');
const ButtonRow = require('../../button-row/button-row');

const jsTestUtils = require('../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('Configuration', function() {
  var acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('renders binary and string config inputs', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
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
    const renderer = jsTestUtils.shallowRender(
      <Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={linkify}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    expect(output.props.children[0].props.children[4][0]).toEqualJSX(
      <StringConfig
        config={option1key}
        key="Config-option1"
        onChange={instance._handleOnChange}
        option={{
          description: 'description 1',
          key: 'option1',
          type: 'string'
        }}
        ref="Config-option1" />);
    expect(output.props.children[0].props.children[4][1]).toEqualJSX(
      <BooleanConfig
        config={option2key}
        key="Config-option2"
        label="option2:"
        onChange={instance._handleOnChange}
        option={{
          description: 'description 2',
          key: 'option2',
          type: 'boolean'
        }}
        ref="Config-option2" />);
  });

  it('displays the save button when there are changes', function() {
    const option1 = { key: 'option1key', type: 'string' };
    const option2 = { key: 'option2key', type: 'boolean' };
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
    const option1key = 'string body value';
    const option2key = true;
    const charm = {
      get: function() {
        // Return the charm options.
        return { option1: option1, option2: option2 };
      }};
    const service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        } else if (val === 'name') {
          return 'mysql';
        } else if (val === 'series') {
          return 'zesty';
        } else if (val === 'config') {
          return { option1: option1key, option2: option2key };
        }
      }};
    const setConfig = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={linkify}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      ServiceName: {getValue: sinon.stub().returns('mysql')},
      'Config-option1': {
        getKey: sinon.stub().returns('option1'),
        getValue: sinon.stub().returns('new value')
      },
      'Config-option2': {
        getKey: sinon.stub().returns('option2'),
        getValue: sinon.stub().returns('new value2')
      }
    };
    let output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'inspector-config__buttons inspector-config__buttons--hidden');
    output.props.children[0].props.children[4][0].props.onChange();
    output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'inspector-config__buttons');
  });

  it('can handle changes with null values', function() {
    const option1 = { key: 'option1key', type: 'string' };
    const option2 = { key: 'option2key', type: 'boolean' };
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
    const option1key = 'string body value';
    const option2key = true;
    const charm = {
      get: function() {
        // Return the charm options.
        return { option1: option1, option2: option2 };
      }};
    const service = {
      get: function(val) {
        if (val === 'id') {
          return 'abc123';
        } else if (val === 'name') {
          return 'mysql';
        } else if (val === 'series') {
          return 'zesty';
        } else if (val === 'config') {
          return { option1: option1key, option2: option2key };
        }
      }};
    const setConfig = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={linkify}
        service={service}
        serviceRelations={[]}
        setConfig={setConfig}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      ServiceName: {getValue: sinon.stub().returns('mysql')},
      'Config-option1': {
        getKey: sinon.stub().returns('option1'),
        getValue: sinon.stub().returns(null)
      },
      'Config-option2': {
        getKey: sinon.stub().returns('option2'),
        getValue: sinon.stub().returns(null)
      }
    };
    let output = renderer.getRenderOutput();
    output.props.children[0].props.children[4][0].props.onChange();
    output = renderer.getRenderOutput();
    assert.equal(
      output.props.children[1].props.className,
      'inspector-config__buttons');
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
      <Configuration
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
    expect(output.props.children[0].props.children[4]).toEqualJSX(
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
      <Configuration
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
        updateServiceUnitsDisplayname={sinon.stub()} />);

    var domNode = ReactDOM.findDOMNode(component);

    var string = domNode.querySelector('.string-config-input');
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

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
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
      <Configuration
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
        updateServiceUnitsDisplayname={updateUnit} />);
    assert.equal(component.refs.ServiceName.props.config, 'servicename');

    var domNode = ReactDOM.findDOMNode(component);
    var name = domNode.querySelector('.string-config-input');

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

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
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
      <Configuration
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
    expect(output.props.children[0].props.children[1]).toEqualJSX(expected);
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
      <Configuration
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
    expect(output.props.children[0].props.children[1]).toEqualJSX(expected);
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
      <Configuration
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
    assert.strictEqual(output.props.children[0].props.children[1], undefined);
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
      <Configuration
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
    instance.refs = {
      ServiceName: {getValue: sinon.stub()}
    };
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
      <Configuration
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
        updateServiceUnitsDisplayname={updateUnit} />);

    var domNode = ReactDOM.findDOMNode(component);
    var name = domNode.querySelector('.string-config-input');

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

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
  });

  it('stops setting changes if service name is invalid', () => {
    const option1 = { key: 'option1key', type: 'string' };
    const option2 = { key: 'option2key', type: 'boolean' };
    const charm = {
      get: sinon.stub().returns({ option1: option1, option2: option2 })
    };
    const option1key = 'string body value';
    const option2key = true;
    const serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('abc123$');
    serviceGet.withArgs('name').returns('servicename');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    const service = {
      get: serviceGet,
      set: sinon.stub()
    };
    const updateUnit = sinon.stub();
    const getServiceByName = sinon.stub().returns(false);
    const addNotification = sinon.stub();
    const component = testUtils.renderIntoDocument(
      <Configuration
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
        updateServiceUnitsDisplayname={updateUnit} />);

    const domNode = ReactDOM.findDOMNode(component);
    const name = domNode.querySelector('.string-config-input');

    name.innerText = '';
    testUtils.Simulate.input(name);

    const save = domNode.querySelector('.button-row--count-2 .button--neutral');
    testUtils.Simulate.click(save);

    // Make sure it emits a notification if the name is empty.
    assert.equal(addNotification.callCount, 1);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);

    name.innerText = '!@#$%';
    testUtils.Simulate.input(name);

    testUtils.Simulate.click(save);

    // Make sure it emits a notification if the name is invalid.
    assert.equal(addNotification.callCount, 2);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
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
      <Configuration
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
    assert.equal(component.refs.ServiceName, undefined);

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
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
    const renderer = jsTestUtils.shallowRender(
      <Configuration
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
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    output.props.children[1].props.children.props.buttons[0].action();
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
      <Configuration
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
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
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
      <Configuration
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
      'file-form': {reset: formReset},
      ServiceName: {getValue: sinon.stub()}
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[2].props.children.props.onChange();
    assert.equal(getYAMLConfig.callCount, 1);
    assert.equal(getYAMLConfig.args[0][0], 'apache2.yaml');
    assert.equal(formReset.callCount, 1);
  });

  it('can apply the uploaded config', function() {
    var option1 = { key: 'option1key', type: 'string' };
    var option2 = { key: 'option2key', type: 'boolean' };
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
    linkify.onCall(2).returns('description 1');
    linkify.onCall(3).returns('description 2');
    linkify.onCall(4).returns('description 1');
    linkify.onCall(5).returns('description 2');
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
      <Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={getYAMLConfig}
        linkify={linkify}
        service={service}
        serviceRelations={[]}
        setConfig={sinon.stub()}
        unplaceServiceUnits={sinon.stub()}
        updateServiceUnitsDisplayname={sinon.stub()} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {
      file: {files: ['apache2.yaml']},
      'file-form': {reset: sinon.stub()},
      ServiceName: {getValue: sinon.stub()},
      'Config-option1': {
        getKey: sinon.stub().returns('option1'),
        getValue: sinon.stub().returns('')
      },
      'Config-option2': {
        getKey: sinon.stub().returns('option2'),
        getValue: sinon.stub().returns('')
      }
    };
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[2].props.children.props.onChange();
    output = shallowRenderer.getRenderOutput();
    expect(output.props.children[0].props.children[4][0]).toEqualJSX(
      <StringConfig
        config="my apache2"
        key="Config-option1"
        onChange={instance._handleOnChange}
        option={{
          description: 'description 1',
          key: 'option1',
          type: 'string'
        }}
        ref="Config-option1" />);
    expect(output.props.children[0].props.children[4][1]).toEqualJSX(
      <BooleanConfig
        config={false}
        key="Config-option2"
        label="option2:"
        onChange={instance._handleOnChange}
        option={{
          description: 'description 2',
          key: 'option2',
          type: 'boolean'
        }}
        ref="Config-option2" />);
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
      <Configuration
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
      'file-form': {reset: sinon.stub()},
      ServiceName: {getValue: sinon.stub()},
      'Config-option1': {
        getKey: sinon.stub().returns('option1'),
        getValue: sinon.stub().returns('')
      },
      'Config-option2': {
        getKey: sinon.stub().returns('option2'),
        getValue: sinon.stub().returns('')
      }
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
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
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
      <Configuration
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        charm={charm}
        getServiceByName={sinon.stub()}
        getYAMLConfig={sinon.stub()}
        linkify={linkify}
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
          <StringConfig
            config="abc123$"
            disabled={true}
            onChange={instance._handleOnChange}
            option={{
              key: 'Application name',
              description: 'Specify a custom application name. The application'
                + ' name cannot be changed once it has been deployed.'
            }}
            ref="ServiceName" />
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
            <ButtonRow buttons={importButton} />
          </div>
          {[
            <StringConfig
              config={option1key}
              disabled={true}
              key="Config-option1"
              onChange={instance._handleOnChange}
              option={{
                description: 'description 1',
                key: 'option1',
                type: 'string'
              }}
              ref="Config-option1" />,
            <BooleanConfig
              config={option2key}
              disabled={true}
              key="Config-option2"
              label="option2:"
              onChange={instance._handleOnChange}
              option={{
                description: 'description 2',
                key: 'option2',
                type: 'boolean'
              }}
              ref="Config-option2" />
          ]}
        </div>
        <div className={
          'inspector-config__buttons inspector-config__buttons--hidden'}>
          <ButtonRow buttons={actionButtons} />
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
