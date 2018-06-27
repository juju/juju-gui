/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const InspectorExpose = require('./expose');
const BooleanConfig = require('../../boolean-config/boolean-config');
const InspectorExposeUnit = require('./unit/unit');

describe('InspectorExpose', function() {
  var acl, service, modelAPI, units;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorExpose
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      modelAPI={options.modelAPI || modelAPI}
      service={options.service || service}
      units={options.units || units} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(true);
    service = {get: getStub};
    var unitList = [{id: 'django/1'}];
    units = {toArray: sinon.stub().returns(unitList)};
    modelAPI = shapeup.addReshape({
      exposeService: sinon.stub(),
      unexposeService: sinon.stub()
    });
  });

  it('can render correctly if not exposed', function() {
    var toggle = {key: 'expose-toggle'};
    service.get.withArgs('exposed').returns(false);
    const wrapper = renderComponent();
    const expected = (
      <div className="inspector-expose">
        <div className="inspector-expose__control">
          <BooleanConfig
            config={false}
            disabled={false}
            key={toggle.key}
            label="Expose application"
            onChange={wrapper.find('BooleanConfig').prop('onChange')}
            option={toggle}
            ref={toggle.key} />
        </div>
        <p className="inspector-expose__warning">
          Exposing this application may make it publicly accessible from
          the web
        </p>
        {undefined}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render correctly if exposed', function() {
    var unitList = [
      {id: 'django/1'},
      {id: 'django/2'}
    ];
    var units = {toArray: sinon.stub().returns(unitList)};
    const wrapper = renderComponent({ units });
    const expected = (
      <ul className="inspector-expose__units">
        <InspectorExposeUnit
          action={wrapper.find('InspectorExposeUnit').at(0).prop('action')}
          key={unitList[0].id}
          unit={unitList[0]} />
        <InspectorExposeUnit
          action={wrapper.find('InspectorExposeUnit').at(1).prop('action')}
          key={unitList[1].id}
          unit={unitList[1]} />
      </ul>);
    assert.compareJSX(wrapper.find('.inspector-expose__units'), expected);
  });

  it('can navigate to a unit', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('InspectorExposeUnit').at(0).props().action({
      currentTarget: {
        getAttribute: sinon.stub().returns('django/1')
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'demo',
          unit: '1',
          activeComponent: 'unit'
        }
      }
    });
  });

  it('can expose the service', function() {
    service.get.withArgs('exposed').returns(false);
    const wrapper = renderComponent();
    wrapper.find('BooleanConfig').props().onChange();
    assert.equal(modelAPI.exposeService.callCount, 1);
    assert.deepEqual(modelAPI.exposeService.args[0][0], 'demo');
  });

  it('can unexpose the service', function() {
    const wrapper = renderComponent();
    wrapper.find('BooleanConfig').props().onChange();
    assert.equal(modelAPI.unexposeService.callCount, 1);
    assert.deepEqual(modelAPI.unexposeService.args[0][0], 'demo');
  });

  it('can display a notification if there is an error', function() {
    modelAPI.exposeService.callsArgWith(1, {err: 'error'});
    var addNotification = sinon.stub();
    service.get.withArgs('exposed').returns(false);
    const wrapper = renderComponent({ addNotification });
    wrapper.find('BooleanConfig').props().onChange();
    assert.equal(addNotification.callCount, 1);
    assert.equal(addNotification.args[0][0].title, 'Exposing charm failed');
  });

  it('can disable the toggle when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent();
    assert.equal(wrapper.find('BooleanConfig').prop('disabled'), true);
  });
});
