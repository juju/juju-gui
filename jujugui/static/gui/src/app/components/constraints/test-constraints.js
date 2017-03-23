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
  const series = ['precise', 'trusty', 'xenial', 'win8', 'centos7'];
  const seriesOptions = [
    <option key={'precise'} value={'precise'}>{'precise'}</option>,
    <option key={'trusty'} value={'trusty'}>{'trusty'}</option>,
    <option key={'xenial'} value={'xenial'}>{'xenial'}</option>,
    <option key={'win8'} value={'win8'}>{'win8'}</option>,
    <option key={'centos7'} value={'centos7'}>{'centos7'}</option>
  ];
  let valuesChanged;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('constraints', function() { done(); });
  });

  beforeEach(() => {
    valuesChanged = sinon.stub();
  });

  // Render the component and return the instance and the output.
  const render = args => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Constraints
        containerType={args.containerType || ''}
        disabled={args.disabled || false}
        hasUnit={args.hasUnit || false}
        providerType={args.providerType || ''}
        series={series}
        valuesChanged={valuesChanged}
      />, true);
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  };

  it('can render', function() {
    const comp = render({});
    const expectedOutput = (
      <div className="constraints">
        <select
          className="constraints__select"
          ref="seriesConstraintSelect"
          disabled={false}
          key="seriesConstraintSelect"
          id="series-constraint"
          name="series-constraint"
          onChange={comp.instance._handleValueChanged}>
          <option key="default" value="">Optionally choose a series</option>
          {seriesOptions}
        </select>
        {[
          <select
            className="constraints__select"
            ref="archConstraintSelect"
            disabled={false}
            key="archConstraintSelect"
            id="arch-constraint"
            name="arch-constraint"
            onChange={comp.instance._handleValueChanged}>
            <option key="default" value="">
              Optionally choose an architecture
            </option>
            <option key="amd64" value="amd64">amd64</option>
            <option key="i386" value="i386">i386</option>
          </select>,
          <div key="cpu-constraint-div">
            <label htmlFor="cpu-constraint" className="constraints__label">
              CPU (GHZ)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="cpu-constraint"
              name="cpu-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="cpuConstraintInput"
            />
          </div>,
          <div key="cores-constraint-div">
            <label htmlFor="cores-constraint" className="constraints__label">
              Cores
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="cores-constraint"
              name="cores-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="coresConstraintInput"
            />
          </div>,
          <div key="mem-constraint-div">
            <label htmlFor="mem-constraint" className="constraints__label">
              Ram (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="mem-constraint"
              name="mem-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="memConstraintInput"
            />
          </div>,
          <div key="disk-constraint-div">
            <label htmlFor="disk-constraint" className="constraints__label">
              Disk (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="disk-constraint"
              name="disk-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="diskConstraintInput"
            />
          </div>
        ]}
      </div>);
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('can render with a unit on azure', function() {
    const comp = render({hasUnit: true, providerType: 'azure'});
    const expectedOutput = (
      <div className="constraints">
        {undefined}
        {[
          <div key="cores-constraint-div">
            <label htmlFor="cores-constraint" className="constraints__label">
              Cores
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="cores-constraint"
              name="cores-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="coresConstraintInput"
            />
          </div>,
          <div key="mem-constraint-div">
            <label htmlFor="mem-constraint" className="constraints__label">
              Ram (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="mem-constraint"
              name="mem-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="memConstraintInput"
            />
          </div>,
          <div key="disk-constraint-div">
            <label htmlFor="disk-constraint" className="constraints__label">
              Disk (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={false}
              id="disk-constraint"
              name="disk-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="diskConstraintInput"
            />
          </div>
        ]}
      </div>);
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('can render on lxd', function() {
    const comp = render({providerType: 'lxd'});
    const expectedOutput = (
      <div className="constraints">
        <select
          className="constraints__select"
          ref="seriesConstraintSelect"
          disabled={false}
          key="seriesConstraintSelect"
          id="series-constraint"
          name="series-constraint"
          onChange={comp.instance._handleValueChanged}>
          <option key="default" value="">Optionally choose a series</option>
          {seriesOptions}
        </select>
        {[]}
      </div>);
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('can render with a unit on ec2 for a container', function() {
    const comp = render({
      containerType: 'lxd',
      hasUnit: true,
      providerType: 'ec2'
    });
    const expectedOutput = (
      <div className="constraints">
        {undefined}
        {[]}
      </div>);
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('can render with inputs disabled', function() {
    const comp = render({disabled: true});
    const expectedOutput = (
      <div className="constraints">
        <select
          className="constraints__select"
          ref="seriesConstraintSelect"
          disabled={true}
          key="seriesConstraintSelect"
          id="series-constraint"
          name="series-constraint"
          onChange={comp.instance._handleValueChanged}>
          <option key="default" value="">Optionally choose a series</option>
          {seriesOptions}
        </select>
        {[
          <select
            className="constraints__select"
            ref="archConstraintSelect"
            disabled={true}
            key="archConstraintSelect"
            id="arch-constraint"
            name="arch-constraint"
            onChange={comp.instance._handleValueChanged}>
            <option key="default" value="">
              Optionally choose an architecture
            </option>
            <option key="amd64" value="amd64">amd64</option>
            <option key="i386" value="i386">i386</option>
          </select>,
          <div key="cpu-constraint-div">
            <label htmlFor="cpu-constraint" className="constraints__label">
              CPU (GHZ)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={true}
              id="cpu-constraint"
              name="cpu-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="cpuConstraintInput"
            />
          </div>,
          <div key="cores-constraint-div">
            <label htmlFor="cores-constraint" className="constraints__label">
              Cores
            </label>
            <input type="text"
              className="constraints__input"
              disabled={true}
              id="cores-constraint"
              name="cores-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="coresConstraintInput"
            />
          </div>,
          <div key="mem-constraint-div">
            <label htmlFor="mem-constraint" className="constraints__label">
              Ram (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={true}
              id="mem-constraint"
              name="mem-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="memConstraintInput"
            />
          </div>,
          <div key="disk-constraint-div">
            <label htmlFor="disk-constraint" className="constraints__label">
              Disk (MB)
            </label>
            <input type="text"
              className="constraints__input"
              disabled={true}
              id="disk-constraint"
              name="disk-constraint"
              onChange={comp.instance._handleValueChanged}
              ref="diskConstraintInput"
            />
          </div>
        ]}
      </div>);
    assert.deepEqual(comp.output, expectedOutput);
  });

  it('calls the provided method when the component is mounted', function() {
    // We need to render the full component here as the shallowRenderer does
    // not yet support simulating change events.
    testUtils.renderIntoDocument(
      <juju.components.Constraints
        valuesChanged={valuesChanged}
        series={series}
      />
    );
    assert.equal(valuesChanged.callCount, 1, 'valuesChanged.callCount');
    const args = valuesChanged.args[0];
    assert.equal(args.length, 1, 'args.length');
    assert.deepEqual(args[0], {
      arch: '',
      'cpu-power': '',
      cores: '',
      mem: '',
      'root-disk': '',
      series: ''
    });
  });

  it('calls the provided method when the values changed', function() {
    // We need to render the full component here as the shallowRenderer does
    // not yet support simulating change events.
    const output = testUtils.renderIntoDocument(
      <juju.components.Constraints
        valuesChanged={valuesChanged}
        series={series}
      />
    );
    const refs = output.refs;
    refs.seriesConstraintSelect.value = 'xenial';
    refs.archConstraintSelect.value = 'i386';
    refs.cpuConstraintInput.value = '1024';
    refs.coresConstraintInput.value = '2';
    refs.memConstraintInput.value = '2048';
    refs.diskConstraintInput.value = '4096';
    testUtils.Simulate.change(refs.cpuConstraintInput);
    assert.equal(valuesChanged.callCount, 2, 'valuesChanged.callCount');
    const args = valuesChanged.args[1];
    assert.equal(args.length, 1, 'args.length');
    assert.deepEqual(args[0], {
      arch: 'i386',
      'cpu-power': '1024',
      cores: '2',
      mem: '2048',
      'root-disk': '4096',
      series: 'xenial'
    });
  });

});
