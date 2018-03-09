/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentChangeItem = require('./change-item');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentChangeItem', function() {
  let change;

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
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change} />);
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
    expect(output).toEqualJSX(expected);
  });

  it('can display an svg icon', function() {
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change} />);
    const expected = (
      <div className="deployment-change-item">
        <span className="deployment-change-item__change">
          <img alt="" className="deployment-change-item__icon"
            src="my-icon.svg" />
          Django was added
          <span className="deployment-change-item__change-command">
            juju deploy cs:django
          </span>
        </span>
        <span className="deployment-change-item__time">
          {change.time}
        </span>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display without the time', function() {
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change}
        showTime={false} />);
    const expected = (
      <div className="deployment-change-item">
        <span className="deployment-change-item__change">
          <img alt="" className="deployment-change-item__icon"
            src="my-icon.svg" />
          Django was added
          <span className="deployment-change-item__change-command">
            juju deploy cs:django
          </span>
        </span>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
