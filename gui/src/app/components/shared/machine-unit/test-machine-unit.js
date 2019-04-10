/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const MachineUnit = require('./machine-unit');


describe('MachineUnit', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <MachineUnit
      classes={options.classes}
      icon={options.icon || 'smalldata.svg'}
      menuItems={options.menuItems}
      name={options.name || 'bigmoney/99'}
      status={options.status || 'upper-middle'} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <li className="machine-unit machine-unit--upper-middle">
        <span className="machine-unit__icon">
          <img
            alt="bigmoney/99"
            className="machine-unit__icon-img"
            src="smalldata.svg"
            title="bigmoney/99" />
        </span>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render with a menu', () => {
    const menuItems = [{
      label: 'Destroy',
      action: sinon.stub()
    }];
    const wrapper = renderComponent({
      menuItems
    });
    const name = (
      <span className="machine-unit__name">
        bigmoney/99
      </span>);
    assert.compareJSX(wrapper.find('.machine-unit__name'), name);
    const menu = (
      <ButtonDropdown
        classes={['machine-unit__dropdown']}
        listItems={menuItems} />);
    assert.compareJSX(wrapper.find('ButtonDropdown'), menu);
  });

  it('can render with additional classes', () => {
    const wrapper = renderComponent({
      classes: ['doughnuts']
    });
    assert.equal(wrapper.prop('className').includes('doughnuts'), true);
  });
});
