/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const AccordionSection = require('./accordion-section');
const SvgIcon = require('../svg-icon/svg-icon');

describe('AccordionSection', () => {
  const renderComponent = (options = {}) => enzyme.shallow(
    <AccordionSection
      startOpen={
        options.startOpen === undefined ? false : options.startOpen}
      title={options.title || 'My title!'}>
      {options.children === undefined ? (<span>Hello</span>) : options.children}
    </AccordionSection>
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="accordion-section">
        <div className="accordion-section__title"
          onClick={wrapper.find('.accordion-section__title').prop('onClick')}
          role="button">
          <span className="accordion-section__title-content">My title!</span>
          <SvgIcon
            className="right"
            name="chevron_down_16"
            size="16" />
        </div>
        <div className="accordion-section__content" ref="content"
          style={{maxHeight: 0}}><span>Hello</span></div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('toggles open and closed when the heading is clicked', () => {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      content: {scrollHeight: 100}
    };
    instance._toggle();
    const expected = (
      <div className="accordion-section__content" ref="content"
        style={{maxHeight: '100px'}}>
        <span>Hello</span>
      </div>);
    assert.compareJSX(wrapper.find('.accordion-section__content'), expected);
  });

  it('does not show chevron or content when there are no children', () => {
    const wrapper = renderComponent({ children: null });
    const expected = (
      <div className="accordion-section__content" ref="content"
        style={{maxHeight: '100px'}}>
        {null}
      </div>);
    assert.compareJSX(wrapper.find('.accordion-section__content'), expected);
  });
});
