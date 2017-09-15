/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentChangeItem = require('./change-item');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DeploymentChangeItem', function() {

  it('can display a sprite icon', function() {
    var change = {
      icon: 'my-icon',
      description: 'Django was added',
      time: '10:12 am'
    };
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change} />);
    assert.deepEqual(output,
      <li className="deployment-change-item">
        <span className="deployment-change-item__change">
          <SvgIcon name="my-icon"
            className="deployment-change-item__icon"
            size="16" />
          Django was added
        </span>
        <span className="deployment-change-item__time">
          {change.time}
        </span>
      </li>);
  });

  it('can display an svg icon', function() {
    var change = {
      icon: 'my-icon.svg',
      description: 'Django was added',
      time: '10:12 am'
    };
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change} />);
    assert.deepEqual(output,
      <li className="deployment-change-item">
        <span className="deployment-change-item__change">
          <img src="my-icon.svg" alt=""
            className="deployment-change-item__icon" />
          Django was added
        </span>
        <span className="deployment-change-item__time">
          {change.time}
        </span>
      </li>);
  });

  it('can display without the time', function() {
    var change = {
      icon: 'my-icon.svg',
      description: 'Django was added',
      time: '10:12 am'
    };
    var output = jsTestUtils.shallowRender(
      <DeploymentChangeItem
        change={change}
        showTime={false} />);
    assert.deepEqual(output,
      <li className="deployment-change-item">
        <span className="deployment-change-item__change">
          <img src="my-icon.svg" alt=""
            className="deployment-change-item__icon" />
          Django was added
        </span>
        {undefined}
      </li>);
  });
});
