/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Tour = require('./tour');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Tour', () => {
  it('renders', () => {
    const renderer = jsTestUtils.shallowRender(
      <Tour close={sinon.stub()} endTour={sinon.stub()} staticURL="" />,
      true
    );

    const output = renderer.getRenderOutput();

    expect(output.props.children[0]).toEqualJSX(
      <span className="back-to-help"
        onClick={sinon.stub()}>
        <SvgIcon
          className="back-to-help__icon"
          name="chevron_down_16"
          size="16"
        />
        Back to GUI help
      </span>
    );

    assert.deepEqual(output.props.children[1].props.extraClasses, ['tour']);

    // Slides
    const slides = output.props.children[1].props.children;
    assert.isDefined(slides);
    assert.equal(slides.length, 7);
    slides.forEach((slide) => {
      assert.deepEqual(slide.props.className, 'tour__slide');
    });
  });
});
