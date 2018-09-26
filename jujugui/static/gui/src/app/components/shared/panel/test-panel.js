/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Panel = require('./panel');

describe('PanelComponent', function() {

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <Panel
        clickAction={options.clickAction}
        focus={options.focus}
        instanceName={options.instanceName || 'custom-instance-name'}
        visible={options.visible === undefined ? true : options.visible}>
        {options.children || (<div>child</div>)}
      </Panel>,
      { disableLifecycleMethods: true }
    );
    const instance = wrapper.instance();
    instance.refs = {
      content: {
        focus: sinon.stub()
      }
    };
    instance.componentDidMount();
    return wrapper;
  };

  it('generates a visible panel when visible flag is provided', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="panel-component custom-instance-name"
        onClick={wrapper.prop('onClick')}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={wrapper.find('.panel-component__inner').prop('onClick')}>
          <div>child</div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('generates a hidden panel if visible flag is falsey', function() {
    const wrapper = renderComponent({ visible: false });
    assert.equal(wrapper.prop('className').includes('hidden'), true);
  });

  it('can call a function on click if provided', function() {
    var clickAction = sinon.stub();
    const wrapper = renderComponent({ clickAction });
    wrapper.simulate('click');
    assert.equal(clickAction.callCount, 1);
  });

  it('does not bubble clicks from the children', function() {
    var clickAction = sinon.stub();
    var stopPropagation = sinon.stub();
    const wrapper = renderComponent({ clickAction });
    wrapper.find('.panel-component__inner').simulate('click', {
      stopPropagation: stopPropagation
    });
    assert.equal(stopPropagation.callCount, 1);
    assert.equal(clickAction.callCount, 0);
  });

  it('sets the keyboard focus when it loads', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.refs.content.focus.callCount, 1);
  });

  it('can not set the keyboard focus on load', function() {
    const wrapper = renderComponent({ focus: false });
    const instance = wrapper.instance();
    assert.equal(instance.refs.content.focus.callCount, 0);
  });
});
