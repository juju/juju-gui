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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-config', function() { done(); });
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
      get: function() {
        // Return the config options
        return { option1: option1key, option2: option2key };
      }};
    var setConfig = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        service={service}
        charm={charm}
        setConfig={setConfig} />);

    assert.deepEqual(output.props.children[0].props.children[2], [
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
    var service = {get: sinon.stub().returns({})};
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        service={service}
        charm={charm} />);
    assert.deepEqual(output.props.children[0].props.children[2],
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
    var component = testUtils.renderIntoDocument(
      <juju.components.Configuration
        service={service}
        charm={charm}
        setConfig={setConfig} />);

    var domNode = ReactDOM.findDOMNode(component);

    var string = domNode.querySelector('.string-config--value');
    var bool = domNode.querySelector('.boolean-config--input');

    string.innerText = 'new value';
    testUtils.Simulate.input(string);

    // React requires us to pass in the full change object instead of it
    // actually interacting with the DOM.
    testUtils.Simulate.change(bool, {target: {checked: false}});

    var save = domNode.querySelector('.generic-button--type-confirm');

    testUtils.Simulate.click(save);

    assert.equal(setConfig.callCount, 1);
    assert.equal(setConfig.args[0][0], 'cs:trusty/ghost');
    assert.deepEqual(
      setConfig.args[0][1],
      { option1: 'new value', option2: false });
    assert.strictEqual(setConfig.args[0][2], null);
    assert.strictEqual(setConfig.args[0][3], null);
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
        service={service}
        changeState={changeState}
        charm={charm} />);
    output.props.children[1].props.buttons[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
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
        service={service}
        changeState={changeState}
        charm={charm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {file: {click: fileClick}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[1].props.buttons[0].action();
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
    var changeState = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.Configuration
        service={service}
        getYAMLConfig={getYAMLConfig}
        changeState={changeState}
        charm={charm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {file: {files: ['apache2.yaml']}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onChange();
    assert.equal(getYAMLConfig.callCount, 1);
    assert.equal(getYAMLConfig.args[0][0], 'apache2.yaml');
    assert.equal(getYAMLConfig.args[0][1], instance._applyConfig);
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
        service={service}
        getYAMLConfig={getYAMLConfig}
        changeState={changeState}
        charm={charm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {file: {files: ['apache2.yaml']}};
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onChange();
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[0].props.children[2], [
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
        service={service}
        getYAMLConfig={getYAMLConfig}
        changeState={changeState}
        charm={charm} />, true);
    var instance = shallowRenderer.getMountedInstance();
    instance.refs = {file: {files: ['apache2.yaml']}};
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      instance.state.serviceConfig,
      {option1: 'string body value', option2: true});
    output.props.children[0].props.children[0].props.onChange();
    output = shallowRenderer.getRenderOutput();
    assert.deepEqual(
      instance.state.serviceConfig,
      {option1: 'string body value', option2: true});
  });
});
