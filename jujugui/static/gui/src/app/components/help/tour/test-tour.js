/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Tour = require('./tour');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Tour', () => {
  it('renders', () => {
    const renderer = jsTestUtils.shallowRender(
      <Tour close={sinon.stub()} endTour={sinon.stub()} />,
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
    assert.isDefined(slides[0]);
    assert.deepEqual(slides[0].props.className, 'tour__slide');
    assert.isDefined(slides[1]);
    assert.deepEqual(slides[1].props.className, 'tour__slide');
    assert.isDefined(slides[2]);
    assert.deepEqual(slides[2].props.className, 'tour__slide');
    assert.isDefined(slides[3]);
    assert.deepEqual(slides[3].props.className, 'tour__slide');
    assert.isDefined(slides[4]);
    assert.deepEqual(slides[4].props.className, 'tour__slide');
    assert.isDefined(slides[5]);
    assert.deepEqual(slides[5].props.className, 'tour__slide');
    assert.isDefined(slides[6]);
    assert.deepEqual(slides[6].props.className, 'tour__slide');
  });
});
