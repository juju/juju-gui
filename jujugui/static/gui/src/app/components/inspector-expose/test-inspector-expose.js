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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorExpose', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-expose', function() { done(); });
  });

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
        <juju.components.InspectorExpose
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
              <juju.components.BooleanConfig
                disabled={false}
                key={toggle.key}
                ref={toggle.key}
                option={toggle}
                onChange={toggleItem.props.onChange}
                label="Expose application"
                config={false} />
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
        <juju.components.InspectorExpose
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
              <juju.components.BooleanConfig
                disabled={false}
                key={toggle.key}
                ref={toggle.key}
                option={toggle}
                onChange={toggleItem.props.onChange}
                label="Expose application"
                config={true} />
            </div>
            <p className="inspector-expose__warning">
              Exposing this application may make it publicly accessible from
              the web
            </p>
            <ul className="inspector-expose__units">
              <juju.components.InspectorExposeUnit
                key={unitList[0].id}
                action={output.props.children[2].props.children[0].props.action}
                unit={unitList[0]} />
              <juju.components.InspectorExposeUnit
                key={unitList[1].id}
                action={output.props.children[2].props.children[1].props.action}
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
        <juju.components.InspectorExpose
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
      sectionA: {
        component: 'inspector',
        metadata: {
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
        <juju.components.InspectorExpose
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
        <juju.components.InspectorExpose
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
        <juju.components.InspectorExpose
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
        <juju.components.InspectorExpose
          acl={acl}
          addNotification={sinon.stub()}
          changeState={sinon.stub()}
          exposeService={sinon.stub()}
          service={service}
          unexposeService={sinon.stub()}
          units={{}} />);
    var toggleItem = output.props.children[0].props.children;
    var expected = (
      <juju.components.BooleanConfig
        disabled={true}
        key={toggle.key}
        ref={toggle.key}
        option={toggle}
        onChange={toggleItem.props.onChange}
        label="Expose application"
        config={false} />);
    assert.deepEqual(output.props.children[0].props.children, expected);
  });
});
