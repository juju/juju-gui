/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentBarNotification = require('./notification');

describe('DeploymentBarNotification', function() {
  var clearTimeout, setTimeout;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentBarNotification
      change={options.change || {
        id: 'service-added-1',
        description: 'Django added'
      }} />
  );

  beforeEach(function() {
    clearTimeout = window.clearTimeout;
    window.clearTimeout = sinon.stub();
    setTimeout = window.setTimeout;
    window.setTimeout = sinon.stub();
  });

  afterEach(function() {
    window.clearTimeout = clearTimeout;
    window.setTimeout = setTimeout;
  });

  it('can render a notification', function() {
    var change = {
      description: 'Django added'
    };
    const wrapper = renderComponent({ change });
    const expected = (
      <div className="deployment-bar__notification deployment-bar__notification--visible"
        onClick={wrapper.prop('onClick')}>
          Django added
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can hide the notification when it is clicked', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.prop('className').includes('deployment-bar__notification--visible'), true);
    wrapper.simulate('click');
    wrapper.update();
    assert.equal(
      wrapper.prop('className').includes('deployment-bar__notification--visible'), false);
    assert.equal(window.clearTimeout.callCount, 1);
  });

  it('does not show a notification more than once', function() {
    const change = {
      id: 'service-added-1',
      description: 'Django added'
    };
    const wrapper = renderComponent({ change });
    assert.equal(
      wrapper.prop('className').includes('deployment-bar__notification--visible'), true);
    wrapper.simulate('click');
    wrapper.update();
    assert.equal(window.setTimeout.callCount, 1);
    assert.equal(
      wrapper.prop('className').includes('deployment-bar__notification--visible'), false);
    wrapper.setProps({ change });
    assert.equal(window.setTimeout.callCount, 1);
    assert.equal(
      wrapper.prop('className').includes('deployment-bar__notification--visible'), false);
  });
});
