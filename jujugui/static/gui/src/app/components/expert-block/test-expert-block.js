/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ExpertBlock = require('../expert-block/expert-block');

describe('ExpertBlock', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ExpertBlock
      classes={options.classes}
      title={options.title || 'Expert Title'}>
      <span>Content</span>
    </ExpertBlock>
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="expert-block">
        <div className="expert-block__top-title">
          Expert Title
        </div>
        <span>Content</span>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can have custom classes supplied', () => {
    const wrapper = renderComponent({classes: ['foo']});
    assert.equal(wrapper.prop('className').includes('foo'), true);
  });
});
