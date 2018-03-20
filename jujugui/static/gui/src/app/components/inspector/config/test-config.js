/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Configuration = require('./config');

describe('Configuration', function() {
  var acl, charm, service;

  const renderComponent = (options = {}) => {
    const linkify = sinon.stub();
    linkify.onCall(0).returns('description 1');
    linkify.onCall(1).returns('description 2');
    const wrapper = enzyme.shallow(
      <Configuration
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        changeState={options.changeState || sinon.stub()}
        charm={options.charm || charm}
        getServiceByName={options.getServiceByName || sinon.stub()}
        getYAMLConfig={options.getYAMLConfig || sinon.stub()}
        linkify={options.linkify || linkify}
        service={options.service || service}
        serviceRelations={options.serviceRelations || []}
        setConfig={options.setConfig || sinon.stub()}
        unplaceServiceUnits={options.unplaceServiceUnits || sinon.stub()}
        updateServiceUnitsDisplayname={
          options.updateServiceUnitsDisplayname || sinon.stub()} />
    );
    const instance = wrapper.instance();
    instance.refs = {
      file: {files: ['apache2.yaml'], click: sinon.stub()},
      'file-form': {reset: sinon.stub()},
      ServiceName: {getValue: sinon.stub().returns('mysql2')},
      'Config-option1': {
        getKey: sinon.stub().returns('option1'),
        getValue: sinon.stub().returns('new value')
      },
      'Config-option2': {
        getKey: sinon.stub().returns('option2'),
        getValue: sinon.stub().returns(false)
      }
    };
    return wrapper;
  };

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    const option1 = { key: 'option1key', type: 'string' };
    const option2 = { key: 'option2key', type: 'boolean' };
    const option1key = 'string body value';
    const option2key = true;
    const charmGet = sinon.stub();
    charmGet.withArgs('options').returns({ option1: option1, option2: option2 });
    charmGet.withArgs('name').returns('apache2');
    charm = {
      get: charmGet
    };
    const serviceGet = sinon.stub();
    serviceGet.withArgs('id').returns('cs:trusty/ghost');
    serviceGet.withArgs('name').returns('ghost');
    serviceGet.withArgs('series').returns('trusty');
    serviceGet.withArgs('config').returns(
      { option1: option1key, option2: option2key });
    service = {
      get: serviceGet,
      set: sinon.stub()
    };
  });

  it('renders binary and string config inputs', function() {
    const wrapper = renderComponent();
    const stringConfig = wrapper.find('StringConfig');
    const booleanConfig = wrapper.find('BooleanConfig');
    assert.equal(stringConfig.length, 1);
    assert.equal(booleanConfig.length, 1);
    assert.equal(stringConfig.prop('config'), 'string body value');
    assert.deepEqual(stringConfig.prop('option'), {
      description: 'description 1',
      key: 'option1',
      type: 'string'
    });
    assert.strictEqual(booleanConfig.prop('config'), true);
    assert.deepEqual(booleanConfig.prop('option'), {
      description: 'description 2',
      key: 'option2',
      type: 'boolean'
    });
  });

  it('displays the save button when there are changes', function() {
    const hiddenClass = 'inspector-config__buttons--hidden';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.inspector-config__buttons').prop('className').includes(
        hiddenClass),
      true);
    wrapper.find('BooleanConfig').props().onChange();
    wrapper.update();
    assert.equal(
      wrapper.find('.inspector-config__buttons').prop('className').includes(
        hiddenClass),
      false);
  });

  it('can handle changes with null values', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs['Config-option1'].getValue.returns(null);
    instance.refs['Config-option2'].getValue.returns(null);
    wrapper.find('BooleanConfig').props().onChange();
    wrapper.update();
    assert.equal(
      wrapper.find('.inspector-config__buttons').prop('className').includes(
        'inspector-config__buttons--hidden'),
      false);
  });

  it('renders message when no config available', function() {
    charm.get.withArgs('options').returns(null);
    service.get.withArgs('config').returns({});
    const wrapper = renderComponent();
    const expected = (
      <div className="inspector-config--no-config">
        No configuration options.
      </div>);
    assert.compareJSX(wrapper.find('.inspector-config--no-config'), expected);
  });

  it('saves the config when save config is clicked', function() {
    var setConfig = sinon.stub();
    var changeState = sinon.stub();
    const wrapper = renderComponent({
      changeState,
      getServiceByName: sinon.stub().returns(null),
      setConfig
    });
    wrapper.find('StringConfig').props().onChange();
    wrapper.find('BooleanConfig').props().onChange();
    wrapper.find('.inspector-config__buttons ButtonRow').prop('buttons')[1].action();
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
    var updateUnit = sinon.stub();
    var getServiceByName = sinon.stub().returns(null);
    const wrapper = renderComponent({
      getServiceByName,
      updateServiceUnitsDisplayname: updateUnit
    });
    service.get.withArgs('id').returns('abc123$');
    wrapper.find('StringConfig').at(0).props().onChange();
    wrapper.find('.inspector-config__buttons ButtonRow').prop('buttons')[1].action();
    assert.equal(service.set.callCount, 1);
    assert.deepEqual(service.set.args[0], ['name', 'mysql2']);
    // Calls to update then unit names.
    assert.equal(updateUnit.callCount, 1);
    assert.equal(updateUnit.args[0][0], 'abc123$');
    // Calls to check to see if a service exists.
    assert.equal(getServiceByName.callCount, 1);
    assert.equal(getServiceByName.args[0][0], 'mysql2');
  });

  it('allows you to modify the series of multi-series charms', function() {
    charm.get.withArgs('series').returns(['precise', 'trusty']);
    service.get.withArgs('pending').returns(true);
    const wrapper = renderComponent();
    var expected = (
      <div className="inspector-config__series-select">
        <span>Choose Series</span>
        <select
          className="inspector-config__select"
          disabled={false}
          onChange={wrapper.find('.inspector-config__select').prop('onChange')}
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
    assert.compareJSX(wrapper.find('.inspector-config__series-select'), expected);
  });

  it('disables the series select if there are existing relations', function() {
    charm.get.withArgs('series').returns(['precise', 'trusty']);
    service.get.withArgs('pending').returns(true);
    const wrapper = renderComponent({
      serviceRelations: ['one']
    });
    assert.equal(wrapper.find('.inspector-config__select').prop('disabled'), true);
  });

  it('does not allow you to change series if app is deployed', function() {
    charm.get.withArgs('series').returns(['precise', 'trusty']);
    service.get.withArgs('pending').returns(false);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.inspector-config__series-select').length, 0);
  });

  it('can handle changing of series', function() {
    var unplaceServiceUnits = sinon.stub().returns([{}, {}]);
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    charm.get.withArgs('series').returns(['precise', 'trusty']);
    service.get.withArgs('pending').returns(true);
    const wrapper = renderComponent({
      addNotification,
      changeState,
      unplaceServiceUnits
    });
    const instance = wrapper.instance();
    instance._handleSeriesChange({
      currentTarget: {
        value: 'xenial'
      }
    });
    assert.equal(service.set.callCount, 1);
    assert.deepEqual(service.set.args[0], ['series', 'xenial']);
    assert.equal(unplaceServiceUnits.callCount, 1);
    assert.equal(unplaceServiceUnits.args[0][0], 'cs:trusty/ghost');
    assert.equal(addNotification.callCount, 1);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        machines: ''
      }});
  });

  it('stops setting changes if service name already exists', function() {
    var updateUnit = sinon.stub();
    var getServiceByName = sinon.stub().returns(true);
    var addNotification = sinon.stub();
    service.get.withArgs('id').returns('abc123$');
    const wrapper = renderComponent({
      addNotification,
      getServiceByName,
      updateUnit
    });
    wrapper.find('StringConfig').at(0).props().onChange();
    wrapper.find('.inspector-config__buttons ButtonRow').prop('buttons')[1].action();
    // Make sure it emits a notification if the name exists.
    assert.equal(addNotification.callCount, 1);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);
  });

  it('stops setting changes if service name is invalid', () => {
    const updateUnit = sinon.stub();
    const getServiceByName = sinon.stub().returns(false);
    const addNotification = sinon.stub();
    service.get.withArgs('id').returns('abc123$');
    const wrapper = renderComponent({
      addNotification,
      getServiceByName,
      updateUnit
    });
    const save = wrapper.find('.inspector-config__buttons ButtonRow').prop('buttons')[1];
    const stringConfig = wrapper.find('StringConfig').at(0).props();
    const instance = wrapper.instance();
    instance.refs.ServiceName.getValue.returns('');
    stringConfig.onChange();
    save.action();
    // Make sure it emits a notification if the name is empty.
    assert.equal(addNotification.callCount, 1);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);
    instance.refs.ServiceName.getValue.returns('!@#$%');
    stringConfig.onChange();
    save.action();
    // Make sure it emits a notification if the name is invalid.
    assert.equal(addNotification.callCount, 2);
    // Make sure the service name and config wasn't updated.
    assert.equal(service.set.callCount, 0);
    // Make sure that the unit names weren't updated.
    assert.equal(updateUnit.callCount, 0);
  });

  it('not able to change the service name on deployed services', function() {
    service.get.withArgs('id').returns('apache2');
    const wrapper = renderComponent();
    const stringConfig = wrapper.find('StringConfig');
    // There should still be one string config option from the service.
    assert.equal(stringConfig.length, 1);
    // Double check that the returned config is not for the service name.
    assert.notEqual(stringConfig.prop('config'), 'apache2');
  });

  it('can handle cancelling the changes', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('.inspector-config__buttons ButtonRow').prop('buttons')[0].action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'cs:trusty/ghost',
          activeComponent: undefined
        }}});
  });

  it('can open the file dialog when the button is clicked', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    const instance = wrapper.instance();
    wrapper.find('.inspector-config__config-file ButtonRow').prop('buttons')[0].action();
    assert.equal(instance.refs.file.click.callCount, 1);
  });

  it('can get a YAML file when a file is selected', function() {
    var getYAMLConfig = sinon.stub();
    const wrapper = renderComponent({
      getYAMLConfig
    });
    wrapper.find('input').simulate('change');
    const instance = wrapper.instance();
    assert.equal(getYAMLConfig.callCount, 1);
    assert.equal(getYAMLConfig.args[0][0], 'apache2.yaml');
    assert.equal(instance.refs['file-form'].reset.callCount, 1);
  });

  it('can apply the uploaded config', function() {
    var getYAMLConfig = sinon.stub().callsArgWith(1, {
      apache2: {option1: 'my apache2', option2: false}
    });
    const wrapper = renderComponent({ getYAMLConfig });
    wrapper.find('input').simulate('change');
    wrapper.update();
    assert.equal(wrapper.find('StringConfig').prop('config'), 'my apache2');
    assert.strictEqual(wrapper.find('BooleanConfig').prop('config'), false);
  });

  it('does not try to apply the config for the wrong charm', function() {
    var getYAMLConfig = sinon.stub().callsArgWith(1, {
      postgresql: {option1: 'my apache2', option2: false}
    });
    const wrapper = renderComponent({ getYAMLConfig });
    wrapper.find('input').simulate('change');
    wrapper.update();
    assert.equal(wrapper.find('StringConfig').prop('config'), 'string body value');
    assert.strictEqual(wrapper.find('BooleanConfig').prop('config'), true);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    service.get.withArgs('id').returns('abc123$');
    const wrapper = renderComponent();
    assert.strictEqual(wrapper.find('StringConfig').at(0).prop('disabled'), true);
    assert.strictEqual(wrapper.find('StringConfig').at(1).prop('disabled'), true);
    assert.strictEqual(wrapper.find('BooleanConfig').prop('disabled'), true);
    assert.strictEqual(wrapper.find('input').prop('disabled'), true);
  });
});
