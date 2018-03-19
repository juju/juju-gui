/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');
const enzyme = require('enzyme');

const ExpandingRow = require('./expanding-row');

describe('ExpandingRow', () => {

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <ExpandingRow
        classes={options.classes}
        clickable={options.clickable}
        expanded={options.expanded}
        style={options.style}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>,
      { disableLifecycleMethods: true }
    );
    const instance = wrapper.instance();
    // Mock the ref. The MutationObserver needs a real DOM node.
    instance.refs = { inner: document.createElement('div') };
    instance.componentDidMount();
    wrapper.update();
    return wrapper;
  };

  it('can render', () => {
    const wrapper = renderComponent({
      classes: {extraClass: true}
    });
    var expected = (
      <li className={
        'expanding-row twelve-col extraClass expanding-row--clickable'}
      onClick={wrapper.prop('onClick')}
      style={undefined}>
        <div className="expanding-row__initial twelve-col no-margin-bottom">
          <span>closed</span>
        </div>
        <div className="expanding-row__expanded twelve-col"
          style={{height: '0px', opacity: 0}}>
          <div className="twelve-col no-margin-bottom"
            ref="inner">
            <span>open</span>
          </div>
        </div>
      </li>);
    assert.compareJSX(wrapper, expected);
  });

  it('can toggle to the expanded view', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
    wrapper.simulate('click');
    wrapper.update();
    assert.equal(
      wrapper.prop('className').includes('expanding-row--expanded'), true);
    assert.deepEqual(
      wrapper.find('.expanding-row__expanded').prop('style'),
      {height: '10px', opacity: 1});
  });

  it('can initially be expanded', () => {
    const wrapper = renderComponent({
      expanded: true
    });
    assert.equal(
      wrapper.prop('className').includes('expanding-row--expanded'), true);
  });

  it('can update to be expanded', () => {
    const node = document.createElement('div');
    const component = ReactDOM.render(
      <ExpandingRow
        expanded={false}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, node);

    ReactDOM.render(
      <ExpandingRow
        expanded={true}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, node);

    assert.doesNotThrow(
      function() {
        ReactTestUtils.findRenderedDOMComponentWithClass(
          component,
          'expanding-row twelve-col expanding-row--expanded expanding-row--clickable');
      });
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(component).parentNode);
  });

  it('can be not clickable', () => {
    const wrapper = renderComponent({
      clickable: false
    });
    assert.equal(
      wrapper.prop('className').includes('expanding-row--clickable'), false);
    assert.strictEqual(wrapper.prop('onClick'), undefined);
  });

  it('can stop observing the DOM when unmounted', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.isNotNull(instance.observer);
    instance.observer.disconnect = sinon.stub();
    wrapper.unmount();
    assert.equal(instance.observer.disconnect.callCount, 1);
  });

  it('can pass through styles', () => {
    const style = { zIndex: 5 };
    const wrapper = renderComponent({ style });
    assert.deepEqual(wrapper.prop('style'), style);
  });
});
