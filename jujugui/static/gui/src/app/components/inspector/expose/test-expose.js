/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorExpose = require('./expose');
const BooleanConfig = require('../../boolean-config/boolean-config');
const InspectorExposeUnit = require('./unit/unit');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorExpose', function() {
  var acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render correctly if not exposed', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(false);
    var service = {get: getStub};
    var toggle = {key: 'expose-toggle'};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        exposeService={sinon.stub()}
        service={service}
        unexposeService={sinon.stub()}
        units={{}} />);
    var toggleItem = output.props.children[0].props.children;
    assert.deepEqual(output,
      <div className="inspector-expose">
        <div className="inspector-expose__control">
          <BooleanConfig
            config={false}
            disabled={false}
            key={toggle.key}
            label="Expose application"
            onChange={toggleItem.props.onChange}
            option={toggle}
            ref={toggle.key} />
        </div>
        <p className="inspector-expose__warning">
              Exposing this application may make it publicly accessible from
              the web
        </p>
        {undefined}
      </div>);
  });

  it('can render correctly if exposed', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(true);
    var service = {get: getStub};
    var toggle = {key: 'expose-toggle'};
    var unitList = [
      {id: 'django/1'},
      {id: 'django/2'}
    ];
    var units = {toArray: sinon.stub().returns(unitList)};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        exposeService={sinon.stub()}
        service={service}
        unexposeService={sinon.stub()}
        units={units} />);
    var toggleItem = output.props.children[0].props.children;
    assert.deepEqual(output,
      <div className="inspector-expose">
        <div className="inspector-expose__control">
          <BooleanConfig
            config={true}
            disabled={false}
            key={toggle.key}
            label="Expose application"
            onChange={toggleItem.props.onChange}
            option={toggle}
            ref={toggle.key} />
        </div>
        <p className="inspector-expose__warning">
              Exposing this application may make it publicly accessible from
              the web
        </p>
        <ul className="inspector-expose__units">
          <InspectorExposeUnit
            action={output.props.children[2].props.children[0].props.action}
            key={unitList[0].id}
            unit={unitList[0]} />
          <InspectorExposeUnit
            action={output.props.children[2].props.children[1].props.action}
            key={unitList[1].id}
            unit={unitList[1]} />
        </ul>
      </div>);
  });

  it('can navigate to a unit', function() {
    var changeState = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(true);
    var service = {get: getStub};
    var unitList = [{id: 'django/1'}];
    var units = {toArray: sinon.stub().returns(unitList)};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        exposeService={sinon.stub()}
        service={service}
        unexposeService={sinon.stub()}
        units={units} />);
    output.props.children[2].props.children[0].props.action({
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
    var changeState = sinon.stub();
    var exposeService = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(false);
    var service = {get: getStub};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        exposeService={exposeService}
        service={service}
        unexposeService={sinon.stub()}
        units={{}} />);
    output.props.children[0].props.children.props.onChange();
    assert.equal(exposeService.callCount, 1);
    assert.deepEqual(exposeService.args[0][0], 'demo');
  });

  it('can unexpose the service', function() {
    var changeState = sinon.stub();
    var unexposeService = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(true);
    var service = {get: getStub};
    var unitList = [{id: 'django/1'}];
    var units = {toArray: sinon.stub().returns(unitList)};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={changeState}
        exposeService={sinon.stub()}
        service={service}
        unexposeService={unexposeService}
        units={units} />);
    output.props.children[0].props.children.props.onChange();
    assert.equal(unexposeService.callCount, 1);
    assert.deepEqual(unexposeService.args[0][0], 'demo');
  });

  it('can display a notification if there is an error', function() {
    var changeState = sinon.stub();
    var exposeService = sinon.stub().callsArgWith(1, {err: 'error'});
    var addNotification = sinon.stub();
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(false);
    var service = {get: getStub};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={addNotification}
        changeState={changeState}
        exposeService={exposeService}
        service={service}
        unexposeService={sinon.stub()}
        units={{}} />);
    output.props.children[0].props.children.props.onChange();
    assert.equal(addNotification.callCount, 1);
    assert.equal(addNotification.args[0][0].title, 'Exposing charm failed');
  });

  it('can disable the toggle when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(false);
    var service = {get: getStub};
    var toggle = {key: 'expose-toggle'};
    var output = jsTestUtils.shallowRender(
      <InspectorExpose
        acl={acl}
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        exposeService={sinon.stub()}
        service={service}
        unexposeService={sinon.stub()}
        units={{}} />);
    var toggleItem = output.props.children[0].props.children;
    var expected = (
      <BooleanConfig
        config={false}
        disabled={true}
        key={toggle.key}
        label="Expose application"
        onChange={toggleItem.props.onChange}
        option={toggle}
        ref={toggle.key} />);
    assert.deepEqual(output.props.children[0].props.children, expected);
  });
});
