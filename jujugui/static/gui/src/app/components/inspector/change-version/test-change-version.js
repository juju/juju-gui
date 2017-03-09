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

describe('InspectorChangeVersion', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-change-version', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display a loading spinner', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            django
          </div>
        </div>
        <div className="inspector-spinner">
          <juju.components.Spinner />
        </div>
      </div>);
  });

  it('can display an empty versions list', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    getAvailableVersions.callsArgWith(1, null, ['cs:django']);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            django
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <li className="inspector-change-version__none">
            No other versions found.
          </li>
        </ul>
      </div>);
  });

  it('can display list of versions', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    var list = output.props.children[1];
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            django/5
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <juju.components.InspectorChangeVersionItem
            acl={acl}
            key="cs:django-4"
            downgrade={true}
            itemAction={list.props.children[0].props.itemAction}
            buttonAction={list.props.children[0].props.buttonAction}
            url={window.jujulib.URL.fromString('django/4')}
          />
          <juju.components.InspectorChangeVersionItem
            acl={acl}
            key="cs:django-6"
            downgrade={false}
            itemAction={list.props.children[1].props.itemAction}
            buttonAction={list.props.children[1].props.buttonAction}
            url={window.jujulib.URL.fromString('django/6')}
          />
        </ul>
      </div>);
  });

  it('can display a message if there is a get versions failure', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArg(1, 'bad wolf', []);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            django
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <li className="inspector-change-version__none">
            No other versions found.
          </li>
        </ul>
      </div>);
  });

  it('can navigate to the current charm version details', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'django/5'
    });
  });

  it('can navigate to another charm version details', function() {
    var changeState = sinon.stub();
    var service = {};
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.itemAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'django/4'
    });
  });

  it('can change charm version', function() {
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var getMacaroon = sinon.stub().returns('macaroon');
    var addCharm = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub().callsArgWith(4, 'cs:django-4');
    var getCharm = sinon.stub().callsArgWith(1, 'cs:django-4');
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          getMacaroon={getMacaroon}
          addCharm={addCharm}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.buttonAction();
    // The charm needs to be added to the model first.
    assert.equal(addCharm.callCount, 1);
    assert.equal(addCharm.args[0][0], 'cs:django-4');
    assert.equal(addCharm.args[0][1], null);
    // Call the callback
    addCharm.args[0][2]({});
    assert.equal(serviceSet.callCount, 1);
    assert.equal(serviceSet.args[0][1], 'cs:django-4');
  });

  it('adds a notification if it can not add a charm', function() {
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var getMacaroon = sinon.stub().returns('macaroon');
    var setCharm = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var addCharm = sinon.stub().callsArgWith(2, {err: 'error'});
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          changeState={changeState}
          charmId="cs:django-5"
          getMacaroon={getMacaroon}
          addCharm={addCharm}
          service={service}
          addNotification={addNotification}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.buttonAction();
    assert.equal(addNotification.callCount, 1);
  });

  it('adds a notification if it can not set a charm', function() {
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var getMacaroon = sinon.stub().returns('macaroon');
    var addCharm = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub().callsArgWith(4, {err: 'error'});
    var getCharm = sinon.stub().callsArgWith(1);
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          addNotification={addNotification}
          getMacaroon={getMacaroon}
          addCharm={addCharm}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.buttonAction();
    // call the addCharm callback
    addCharm.args[0][2]({});
    assert.equal(addNotification.callCount, 1);
  });

  it('adds a notification if it can not get a charm', function() {
    var addNotification = sinon.stub();
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var getMacaroon = sinon.stub().returns('macaroon');
    var addCharm = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub().callsArgWith(4, {});
    var getCharm = sinon.stub().callsArgWith(1, {err: 'error'});
    var getAvailableVersions = sinon.stub().callsArgWith(1, null, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          addNotification={addNotification}
          getMacaroon={getMacaroon}
          addCharm={addCharm}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.buttonAction();
    // call the addCharm callback
    addCharm.args[0][2]({});
    assert.equal(addNotification.callCount, 1);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().returns({abort: abort});
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          acl={acl}
          addCharm={sinon.stub()}
          addNotification={sinon.stub()}
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions}
          getMacaroon={sinon.stub()} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    shallowRenderer.unmount();
    assert.equal(abort.callCount, 1);
  });
});
