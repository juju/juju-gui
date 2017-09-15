/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Lightbox = require('./lightbox');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Lightbox', function() {

  it('renders', () => {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Lightbox
        caption="Test caption"
        close={close}>
        Hi
      </Lightbox>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__content">
          <div className="lightbox__content-image">
            Hi
          </div>
          <div className="lightbox__content-caption">
            Test caption
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders without a caption', () => {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Lightbox
        close={close}>
        Hi
      </Lightbox>, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__content">
          <div className="lightbox__content-image">
            Hi
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

});
