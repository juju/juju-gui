/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSection = require('./section');
const ButtonRow = require('../../button-row/button-row');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('DeploymentSection', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentSection
      buttons={options.buttons}
      completed={options.completed}
      disabled={options.disabled}
      extra={options.extra}
      instance={options.instance}
      showCheck={options.showCheck}
      title={options.title || 'Model changes'}>
      {options.children || (<span>content</span>)}
    </DeploymentSection>
  );

  it('can render', function() {
    const wrapper = renderComponent();
    // var renderer = jsTestUtils.shallowRender(
    //   <DeploymentSection
    //     disabled={false}
    //     title="Model changes">
    //     <span>content</span>
    //   </DeploymentSection>, true);
    // var output = renderer.getRenderOutput();
    var expected = (
      <div className="deployment-section twelve-col deployment-section--active">
        <div className="inner-wrapper">
          <div className="twelve-col deployment-section__content">
            {undefined}
            <h3 className="deployment-section__title">
              {undefined}
              Model changes
            </h3>
            <span>content</span>
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render with extra props', function() {
    var buttons = [{
      action: sinon.stub(),
      title: 'Add credential',
      type: 'neutral'
    }];
    const wrapper = renderComponent({
      buttons: buttons,
      completed: true,
      disabled: true,
      extra: (<span>extra</span>),
      instance: 'section-instance',
      showCheck: true
    });
    var expected = (
      <div className={
        'deployment-section twelve-col deployment-section--completed ' +
        'section-instance'}>
        <div className="inner-wrapper">
          <div className="twelve-col deployment-section__content">
            <div className="deployment-section__actions">
              <div className="deployment-section__extra">
                <span>extra</span>
              </div>
              <ButtonRow
                buttons={buttons} />
            </div>
            <h3 className="deployment-section__title">
              <SvgIcon
                className="deployment-section__title-checkmark"
                name="complete"
                size="24" />
              Model changes
            </h3>
            <span>content</span>
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
