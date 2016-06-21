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

describe('Constraints', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('constraints', function() { done(); });
  });

  it('can render', function() {
    var valuesChanged = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Constraints
        valuesChanged={valuesChanged} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="constraints">
        <label htmlFor="cpu-constraint"
          className="constraints__label">
          CPU (GHZ)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={false}
          id="cpu-constraint"
          name="cpu-constraint"
          onChange={instance._handleValueChanged}
          ref="cpuConstraintInput"/>
        <label htmlFor="cores-constraint"
          className="constraints__label">
          Cores
        </label>
        <input type="text"
          className="constraints__input"
          disabled={false}
          id="cores-constraint"
          name="cores-constraint"
          onChange={instance._handleValueChanged}
          ref="coresConstraintInput"/>
        <label htmlFor="mem-constraint"
          className="constraints__label">
          Ram (MB)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={false}
          id="mem-constraint"
          name="mem-constraint"
          onChange={instance._handleValueChanged}
          ref="memConstraintInput"/>
        <label htmlFor="disk-constraint"
          className="constraints__label">
          Disk (MB)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={false}
          id="disk-constraint"
          name="disk-constraint"
          onChange={instance._handleValueChanged}
          ref="diskConstraintInput"/>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable the inputs', function() {
    var valuesChanged = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Constraints
        disabled={true}
        valuesChanged={valuesChanged} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="constraints">
        <label htmlFor="cpu-constraint"
          className="constraints__label">
          CPU (GHZ)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={true}
          id="cpu-constraint"
          name="cpu-constraint"
          onChange={instance._handleValueChanged}
          ref="cpuConstraintInput"/>
        <label htmlFor="cores-constraint"
          className="constraints__label">
          Cores
        </label>
        <input type="text"
          className="constraints__input"
          disabled={true}
          id="cores-constraint"
          name="cores-constraint"
          onChange={instance._handleValueChanged}
          ref="coresConstraintInput"/>
        <label htmlFor="mem-constraint"
          className="constraints__label">
          Ram (MB)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={true}
          id="mem-constraint"
          name="mem-constraint"
          onChange={instance._handleValueChanged}
          ref="memConstraintInput"/>
        <label htmlFor="disk-constraint"
          className="constraints__label">
          Disk (MB)
        </label>
        <input type="text"
          className="constraints__input"
          disabled={true}
          id="disk-constraint"
          name="disk-constraint"
          onChange={instance._handleValueChanged}
          ref="diskConstraintInput"/>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('calls the provided method when the component is mounted', function() {
    var valuesChanged = sinon.stub();
    testUtils.renderIntoDocument(
      <juju.components.Constraints
        valuesChanged={valuesChanged} />);
    assert.equal(valuesChanged.callCount, 1);
    assert.deepEqual(valuesChanged.args[0][0], {
      cpu: '',
      cores: '',
      mem: '',
      disk: ''
    });
  });

  it('calls the provided method when the values changed', function() {
    var valuesChanged = sinon.stub();
    // We need to render the full component here as the shallowRenderer
    // does not yet support simulating change events.
    var output = testUtils.renderIntoDocument(
      <juju.components.Constraints
        valuesChanged={valuesChanged} />);
    var cpu = output.refs.cpuConstraintInput;
    cpu.value = '1024';
    var cores = output.refs.coresConstraintInput;
    cores.value = '2';
    var mem = output.refs.memConstraintInput;
    mem.value = '2048';
    var disk = output.refs.diskConstraintInput;
    disk.value = '4096';
    testUtils.Simulate.change(cpu);
    assert.equal(valuesChanged.callCount, 2);
    assert.deepEqual(valuesChanged.args[1][0], {
      cpu: '1024',
      cores: '2',
      mem: '2048',
      disk: '4096'
    });
  });

});
