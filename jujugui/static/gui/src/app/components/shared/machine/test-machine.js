/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Machine = require('./machine');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const GenericButton = require('../../generic-button/generic-button');
const MachineUnit = require('../machine-unit/machine-unit');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('Machine', () => {
  let machine, units;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Machine
      classes={options.classes}
      hardware={options.hardware}
      isContainer={options.isContainer}
      machine={options.machine || machine}
      menuItems={options.menuItems}
      onClick={options.onClick}
      sshAction={options.sshAction}
      sshLabel={options.sshLabel}
      units={options.units}>
      {options.children}
    </Machine>
  );

  beforeEach(() => {
    machine = {
      name: 'new0',
      root: false,
      region: 'antarctica-east',
      series: 'spotty',
      status: 'chillaxing'
    };
    units = [{
      icon: 'smalldata.svg',
      id: 'new0/0',
      name: 'new0/0',
      status: 'upper-middle'
    }];
  });

  it('can render for a machine', () => {
    const wrapper = renderComponent({
      hardware: [{
        label: 'disk',
        value: 'floppy'
      }, {
        label: 'memory',
        value: 'goldfish-like'
      }],
      menuItems: [{
        label: 'Delete',
        action: sinon.stub()
      }],
      units
    });
    const expected = (
      <div className="machine machine--machine"
        onClick={undefined}
        role="button"
        tabIndex="0">
        <ButtonDropdown
          classes={['machine__dropdown']}
          listItems={[{
            label: 'Delete',
            action: sinon.stub()
          }]} />
        <ul className="machine__details">
          <li className="machine__detail">
            <span className="machine__name">
              new0
            </span>
            chillaxing
          </li>
          <li className="machine__detail">
            antarctica-east
          </li>
          <li className="machine__detail">
            spotty
          </li>
        </ul>
        <ul className="machine__hardware">
          <li className="machine__hardware-item"
            key="diskfloppy0">
            <span className="machine__hardware-item-label">
              {'disk'}:
            </span>
            <span className="machine__hardware-item-value">
              floppy
            </span>
          </li>
          <li className="machine__hardware-item"
            key="memorygoldfish-like1">
            <span className="machine__hardware-item-label">
              {'memory'}:
            </span>
            <span className="machine__hardware-item-value">
              goldfish-like
            </span>
          </li>
        </ul>
        <ul className="machine__units">
          <MachineUnit
            icon="smalldata.svg"
            key="new0/0"
            menuItems={null}
            name="new0/0"
            status="upper-middle" />
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render for a container', () => {
    const wrapper = renderComponent({
      isContainer: true,
      units
    });
    assert.equal(wrapper.prop('className').includes('machine--container'), true);
    assert.deepEqual(wrapper.find('MachineUnit').prop('menuItems'), [{
      label: 'Destroy',
      action: wrapper.find('MachineUnit').prop('menuItems')[0].action
    }]);
  });

  it('can render without hardware', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.machine__hardware').length, 0);
  });

  it('can render without units', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.machine__units').length, 0);
  });

  it('can render without a menu', () => {
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonDropdown').length, 0);
  });

  it('can display a terminal action', () => {
    const wrapper = renderComponent({
      sshAction: sinon.stub(),
      sshLabel: '1.1.1.1'
    });
    const expected = (
      <li className="machine__detail machine__terminal-action">
        <SvgIcon
          className="machine__ssh-icon"
          name="code-snippet_24"
          size="16" />
        <GenericButton
          action={sinon.stub()}
          type="inline-base link machine__ssh-action">
          1.1.1.1
        </GenericButton>
      </li>);
    assert.compareJSX(wrapper.find('.machine__terminal-action'), expected);
  });

  it('can render for a root container', () => {
    machine.root = true;
    const wrapper = renderComponent();
    assert.equal(wrapper.prop('className').includes('machine--root'), true);
  });

  it('can render with additional classes', () => {
    const wrapper = renderComponent({
      classes: ['doughnuts']
    });
    assert.equal(wrapper.prop('className').includes('doughnuts'), true);
  });

  it('can display children', () => {
    const wrapper = renderComponent({
      children: (<span className="kids">content</span>)
    });
    assert.equal(wrapper.find('.kids').length, 1);
  });
});
