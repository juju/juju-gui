/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Tour = require('./tour');
const SvgIcon = require('../../svg-icon/svg-icon');

describe('Tour', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Tour
      close={options.close || sinon.stub()}
      endTour={options.endTour || sinon.stub()}
      staticURL={options.staticURL || '/static/'} />
  );

  it('renders', () => {
    const wrapper = renderComponent();
    const expected = (
      <span className="back-to-help"
        onClick={wrapper.find('.back-to-help').prop('onClick')}>
        <SvgIcon
          className="back-to-help__icon"
          name="chevron_down_16"
          size="16" />
        Back to GUI help
      </span>
    );
    assert.compareJSX(wrapper.find('.back-to-help'), expected);
    assert.deepEqual(wrapper.find('Lightbox').prop('extraClasses'), ['tour']);
    // Slides
    assert.equal(wrapper.find('.tour__slide').length, 7);
  });
});
