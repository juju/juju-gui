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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorChangeVersion', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-change-version', function() { done(); });
  });

  it('can display a loading spinner', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub();
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            cs:django
          </div>
        </div>
        <div className="inspector-spinner">
          <juju.components.Spinner />
        </div>
      </div>);
  });

  it('can display an empty versions list', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, ['cs:django']);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output,
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            role="button" tabIndex="0"
            onClick={output.props.children[0].props.children[1].props.onClick}>
            cs:django
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <li className="inspector-change-version__none">
            No other versions.
          </li>
        </ul>
      </div>);
  });

  it('can display list of versions', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
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
            cs:django-5
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <juju.components.InspectorChangeVersionItem
            key="cs:django-4"
            downgrade={true}
            itemAction={list.props.children[0].props.itemAction}
            buttonAction={list.props.children[0].props.buttonAction}
            id="cs:django-4" />
          <juju.components.InspectorChangeVersionItem
            key="cs:django-6"
            downgrade={false}
            itemAction={list.props.children[1].props.itemAction}
            buttonAction={list.props.children[1].props.buttonAction}
            id="cs:django-6" />
        </ul>
      </div>);
  });

  it('can navigate to the current charm version details', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'entity-details',
          id: 'django-5'
        }
      }
    });
  });

  it('can navigate to another charm version details', function() {
    var changeState = sinon.stub();
    var service = sinon.stub();
    var setCharm = sinon.stub();
    var getCharm = sinon.stub();
    var getAvailableVersions = sinon.stub().callsArgWith(1, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.itemAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'entity-details',
          id: 'django-4'
        }
      }
    });
  });

  it('can change charm version', function() {
    var changeState = sinon.stub();
    var serviceSet = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub().callsArgWith(3, 'cs:django-4');
    var getCharm = sinon.stub().callsArgWith(1, 'cs:django-4');
    var getAvailableVersions = sinon.stub().callsArgWith(1, [
      'cs:django-4', 'cs:django-5', 'cs:django-6'
    ]);
    var shallowRenderer = jsTestUtils.shallowRender(
        <juju.components.InspectorChangeVersion
          changeState={changeState}
          charmId="cs:django-5"
          service={service}
          setCharm={setCharm}
          getCharm={getCharm}
          getAvailableVersions={getAvailableVersions} />, true);
    shallowRenderer.getMountedInstance().componentDidMount();
    var output = shallowRenderer.getRenderOutput();
    output.props.children[1].props.children[0].props.buttonAction();
    assert.equal(serviceSet.callCount, 1);
    assert.equal(serviceSet.args[0][1], 'cs:django-4');
  });
});
