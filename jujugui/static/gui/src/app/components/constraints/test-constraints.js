/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Constraints = require('./constraints');

describe('Constraints', function() {
  const series = ['precise', 'trusty', 'xenial', 'win8', 'centos7'];
  const seriesOptions = [
    <option key={'precise'} value={'precise'}>{'precise'}</option>,
    <option key={'trusty'} value={'trusty'}>{'trusty'}</option>,
    <option key={'xenial'} value={'xenial'}>{'xenial'}</option>,
    <option key={'win8'} value={'win8'}>{'win8'}</option>,
    <option key={'centos7'} value={'centos7'}>{'centos7'}</option>
  ];

  const renderComponent = (options = {}) => enzyme.shallow(
    <Constraints
      constraints={options.constraints}
      containerType={options.containerType || ''}
      currentSeries={options.currentSeries}
      disabled={options.disabled === undefined ? false : options.disabled}
      hasUnit={options.hasUnit === undefined ? false : options.hasUnit}
      providerType={options.providerType || ''}
      series={series}
      valuesChanged={options.valuesChanged || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent({});
    const selects = wrapper.find('.constraints__select');
    const inputs = wrapper.find('.constraints__input');
    const expected = (
      <div className="constraints">
        <select
          className="constraints__select"
          defaultValue={undefined}
          disabled={false}
          id="series-constraint"
          key="seriesConstraintSelect"
          name="series-constraint"
          onChange={selects.at(0).prop('onChange')}
          ref="seriesConstraintSelect">
          <option key="default" value="">Optionally choose a series</option>
          {seriesOptions}
        </select>
        {[
          <select
            className="constraints__select"
            defaultValue={undefined}
            disabled={false}
            id="arch-constraint"
            key="archConstraintSelect"
            name="arch-constraint"
            onChange={selects.at(1).prop('onChange')}
            ref="archConstraintSelect">
            <option key="default" value="">
              Optionally choose an architecture
            </option>
            <option key="amd64" value="amd64">amd64</option>
            <option key="i386" value="i386">i386</option>
          </select>,
          <div key="cpu-constraint-div">
            <label className="constraints__label" htmlFor="cpu-constraint">
              CPU (GHZ)
            </label>
            <input className="constraints__input"
              defaultValue={undefined}
              disabled={false}
              id="cpu-constraint"
              name="cpu-constraint"
              onChange={inputs.at(0).prop('onChange')}
              ref="cpuConstraintInput"
              type="text" />
          </div>,
          <div key="cores-constraint-div">
            <label className="constraints__label" htmlFor="cores-constraint">
              Cores
            </label>
            <input className="constraints__input"
              defaultValue={undefined}
              disabled={false}
              id="cores-constraint"
              name="cores-constraint"
              onChange={inputs.at(1).prop('onChange')}
              ref="coresConstraintInput"
              type="text" />
          </div>,
          <div key="mem-constraint-div">
            <label className="constraints__label" htmlFor="mem-constraint">
              Ram (MB)
            </label>
            <input className="constraints__input"
              defaultValue={undefined}
              disabled={false}
              id="mem-constraint"
              name="mem-constraint"
              onChange={inputs.at(2).prop('onChange')}
              ref="memConstraintInput"
              type="text" />
          </div>,
          <div key="disk-constraint-div">
            <label className="constraints__label" htmlFor="disk-constraint">
              Disk (MB)
            </label>
            <input className="constraints__input"
              defaultValue={undefined}
              disabled={false}
              id="disk-constraint"
              name="disk-constraint"
              onChange={inputs.at(3).prop('onChange')}
              ref="diskConstraintInput"
              type="text" />
          </div>
        ]}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render with existing values', function() {
    const wrapper = renderComponent({
      constraints: {
        arch: 'amd64',
        'cpu-cores': 2,
        'cpu-power': 1000,
        'root-disk': 2048,
        mem: 1024
      },
      currentSeries: 'zesty'
    });
    assert.equal(wrapper.find('#series-constraint').prop('defaultValue'), 'zesty');
    assert.equal(wrapper.find('#arch-constraint').prop('defaultValue'), 'amd64');
    assert.equal(wrapper.find('#cpu-constraint').prop('defaultValue'), 1000);
    assert.equal(wrapper.find('#cores-constraint').prop('defaultValue'), 2);
    assert.equal(wrapper.find('#mem-constraint').prop('defaultValue'), 1024);
    assert.equal(wrapper.find('#disk-constraint').prop('defaultValue'), 2048);
  });

  it('can render with a unit on azure', function() {
    const wrapper = renderComponent({hasUnit: true, providerType: 'azure'});
    assert.equal(wrapper.find('#series-constraint').length, 0);
    assert.equal(wrapper.find('#arch-constraint').length, 0);
    assert.equal(wrapper.find('#cpu-constraint').length, 0);
    assert.equal(wrapper.find('#cores-constraint').length, 1);
    assert.equal(wrapper.find('#mem-constraint').length, 1);
    assert.equal(wrapper.find('#disk-constraint').length, 1);
  });

  it('can render on lxd', function() {
    const wrapper = renderComponent({providerType: 'lxd'});
    assert.equal(wrapper.find('#series-constraint').length, 1);
    assert.equal(wrapper.find('#arch-constraint').length, 0);
    assert.equal(wrapper.find('#cpu-constraint').length, 0);
    assert.equal(wrapper.find('#cores-constraint').length, 0);
    assert.equal(wrapper.find('#mem-constraint').length, 0);
    assert.equal(wrapper.find('#disk-constraint').length, 0);
  });

  it('can render with a unit on ec2 for a container', function() {
    const wrapper = renderComponent({
      containerType: 'lxd',
      hasUnit: true,
      providerType: 'ec2'
    });
    assert.equal(wrapper.find('#series-constraint').length, 0);
    assert.equal(wrapper.find('#arch-constraint').length, 0);
    assert.equal(wrapper.find('#cpu-constraint').length, 0);
    assert.equal(wrapper.find('#cores-constraint').length, 0);
    assert.equal(wrapper.find('#mem-constraint').length, 0);
    assert.equal(wrapper.find('#disk-constraint').length, 0);
  });

  it('can render with inputs disabled', function() {
    const wrapper = renderComponent({disabled: true});
    assert.equal(wrapper.find('#series-constraint').prop('disabled'), true);
    assert.equal(wrapper.find('#arch-constraint').prop('disabled'), true);
    assert.equal(wrapper.find('#cpu-constraint').prop('disabled'), true);
    assert.equal(wrapper.find('#cores-constraint').prop('disabled'), true);
    assert.equal(wrapper.find('#mem-constraint').prop('disabled'), true);
    assert.equal(wrapper.find('#disk-constraint').prop('disabled'), true);
  });

  it('calls the provided method when the component is mounted', function() {
    const valuesChanged = sinon.stub();
    renderComponent({ valuesChanged });
    assert.equal(valuesChanged.callCount, 1, 'valuesChanged.callCount');
    const args = valuesChanged.args[0];
    assert.equal(args.length, 1, 'args.length');
    assert.deepEqual(args[0], {
      arch: null,
      'cpu-power': null,
      'cpu-cores': null,
      mem: null,
      'root-disk': null,
      series: null
    });
  });

  it('calls the provided method when the values changed', function() {
    const valuesChanged = sinon.stub();
    const wrapper = renderComponent({ valuesChanged });
    const instance = wrapper.instance();
    const refs = {};
    refs.seriesConstraintSelect = { value: 'xenial' };
    refs.archConstraintSelect = { value: 'i386' };
    refs.cpuConstraintInput = { value: '1024' };
    refs.coresConstraintInput = { value: '2' };
    refs.memConstraintInput = { value: '2048' };
    refs.diskConstraintInput = { value: '4096' };
    instance.refs = refs;
    wrapper.find('#cpu-constraint').simulate('change', refs.cpuConstraintInput);
    assert.equal(valuesChanged.callCount, 2, 'valuesChanged.callCount');
    const args = valuesChanged.args[1];
    assert.equal(args.length, 1, 'args.length');
    assert.deepEqual(args[0], {
      arch: 'i386',
      'cpu-power': '1024',
      'cpu-cores': '2',
      mem: '2048',
      'root-disk': '4096',
      series: 'xenial'
    });
  });

});
