/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentChangeItem = require('./change-item');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('DeploymentChangeItem', function() {
  let change;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentChangeItem
      change={options.change || change}
      showTime={options.showTime} />
  );

  beforeEach(() => {
    change = {
      icon: 'my-icon.svg',
      command: 'juju deploy cs:django',
      description: 'Django was added',
      time: '10:12 am'
    };
  });

  it('can display a sprite icon', function() {
    change.icon = 'my-icon';
    const wrapper = renderComponent({ change });
    const expected = (
      <div className="deployment-change-item">
        <span className="deployment-change-item__change">
          <SvgIcon className="deployment-change-item__icon"
            name="my-icon"
            size="16" />
          Django was added
          <span className="deployment-change-item__change-command">
            juju deploy cs:django
          </span>
        </span>
        <span className="deployment-change-item__time">
          {change.time}
        </span>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display an svg icon', function() {
    const wrapper = renderComponent();
    const expected = (
      <img alt="" className="deployment-change-item__icon"
        src="my-icon.svg" />);
    assert.compareJSX(wrapper.find('.deployment-change-item__icon'), expected);
  });

  it('can display without the time', function() {
    const wrapper = renderComponent({ showTime: false });
    assert.equal(wrapper.find('.deployment-change-item__time').length, 0);
  });
});
