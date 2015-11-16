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

describe('LocalInspector', function() {
  var series;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('local-inspector', function() { done(); });
  });

  beforeEach(function() {
    series = juju.components.LocalInspector.prototype.SERIES;
    juju.components.LocalInspector.prototype.SERIES = ['vivid', 'wily'];
  });

  afterEach(function() {
    juju.components.LocalInspector.prototype.SERIES = series;
  });

  it('can display the new service view', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var services = sinon.spy();
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.LocalInspector
        file={file}
        localType="new"
        services={services}
        uploadLocalCharm={uploadLocalCharm}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        changeState={changeState} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: instance._close
    }, {
      title: 'Upload',
      action: instance._handleUpload,
      type: 'confirm'
    }];
    var options = output.props.children[1].props.children[0].props.children;
    var expected = (
      <div className="inspector-view">
        <juju.components.InspectorHeader
          backCallback={instance._close}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <ul className="local-inspector__list">
            <li>
              <label>
                <input type="radio" name="action"
                  defaultChecked={true}
                  onChange={
                    options[0].props.children.props.children[0]
                      .props.onChange} />
                Deploy new charm
              </label>
            </li>
            <li>
              <label>
                <input type="radio" name="action"
                  defaultChecked={false}
                  onChange={
                    options[1].props.children.props.children[0]
                      .props.onChange} />
                Upgrade existing charm(s)
              </label>
            </li>
          </ul>
          <div>
            <p>
              File: {"apache2.zip"}{' '}
              <span className="local-inspector__size">
                ({"2.00"}kb)
              </span>
            </p>
            <p>Deploy with series:</p>
            <select ref="series" defaultValue="trusty">
              <option value="vivid" key="vivid">vivid</option>
              <option value="wily" key="wily">wily</option>
            </select>
          </div>
        </div>
        <juju.components.ButtonRow
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display the update service view', function() {
    var file = {
      name: 'apache2.zip',
      size: '2048'
    };
    var serviceStubs = [
      {get: sinon.stub()},
      {get: sinon.stub()}
    ];
    serviceStubs[0].get.withArgs('id').returns('apache2-2');
    serviceStubs[0].get.withArgs('name').returns('apache2');
    serviceStubs[1].get.withArgs('id').returns('mysql-1');
    serviceStubs[1].get.withArgs('name').returns('mysql');
    var services = {toArray: sinon.stub().returns(serviceStubs)};
    var uploadLocalCharm = sinon.spy();
    var upgradeServiceUsingLocalCharm = sinon.spy();
    var changeState = sinon.spy();
    var shallowRenderer = jsTestUtils.shallowRender(
      <juju.components.LocalInspector
        file={file}
        localType="update"
        services={services}
        uploadLocalCharm={uploadLocalCharm}
        upgradeServiceUsingLocalCharm={upgradeServiceUsingLocalCharm}
        changeState={changeState} />, true);
    var instance = shallowRenderer.getMountedInstance();
    var output = shallowRenderer.getRenderOutput();
    var buttons = [{
      title: 'Cancel',
      action: instance._close
    }, {
      title: 'Upgrade',
      action: instance._handleUpdate,
      type: 'confirm'
    }];
    var options = output.props.children[1].props.children[0].props.children;
    var expected = (
      <div className="inspector-view">
        <juju.components.InspectorHeader
          backCallback={instance._close}
          title="Local charm" />
        <div className="inspector-content local-inspector__section">
          <ul className="local-inspector__list">
            <li>
              <label>
                <input type="radio" name="action"
                  defaultChecked={false}
                  onChange={
                    options[0].props.children.props.children[0]
                      .props.onChange} />
                Deploy new charm
              </label>
            </li>
            <li>
              <label>
                <input type="radio" name="action"
                  defaultChecked={true}
                  onChange={
                    options[1].props.children.props.children[0]
                      .props.onChange} />
                Upgrade existing charm(s)
              </label>
            </li>
          </ul>
          <ul className="local-inspector__list">
            <li key="apache2-2">
              <label>
                <input type="checkbox" data-id="apache2-2"
                  ref="service-apache2-2" />
                apache2
              </label>
            </li>
            <li key="mysql-1">
              <label>
                <input type="checkbox" data-id="mysql-1"
                  ref="service-mysql-1" />
                mysql
              </label>
            </li>
          </ul>
        </div>
        <juju.components.ButtonRow
          buttons={buttons} />
      </div>);
    assert.deepEqual(output, expected);
  });
});
