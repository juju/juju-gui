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
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            Hi
          </div>
          <div className="lightbox__caption">
            Test caption
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders with extra classes', () => {
    const close = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Lightbox
        caption="Test caption"
        close={close}
        extraClasses={['testing']}>
        Hi
      </Lightbox>, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="lightbox testing" onClick={close}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            Hi
          </div>
          <div className="lightbox__caption">
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
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="lightbox" onClick={close}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            Hi
          </div>
        </div>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  describe('slides', () => {
    let renderer, output, instance, slide1, slide2, slide3;
    const close = sinon.stub();

    beforeAll(() => {
      renderer = jsTestUtils.shallowRender(
        <Lightbox close={close}>
          <p>Slide 1</p>
          <p>Slide 2</p>
          <p>Slide 3</p>
        </Lightbox>, true);
      output = renderer.getRenderOutput();
      instance = renderer.getMountedInstance();

      slide1 = (<div
        className="lightbox"
        onClick={instance._handleClose}>
        <button className="lightbox__close">
          <SvgIcon
            name="close_16_white"
            width="16" />
        </button>
        <div className="lightbox__wrapper"
          onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            <div className="lightbox__navigation">
              <button className="lightbox__navigation-previous"
                disabled
                onClick={instance._goToSlide.bind(instance, -1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <button className="lightbox__navigation-next"
                onClick={instance._goToSlide.bind(instance, 1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <ul className="lightbox__navigation-bullets">
                <li className="lightbox__navigation-bullet is-active"
                  onClick={instance.setState.bind(instance, {activeSlide: 0})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 1})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 2})}>
                  &bull;
                </li>
              </ul>
            </div>
            <div className="lightbox__slide is-active">
              <p>Slide 1</p>
            </div>
            <div className="lightbox__slide">
              <p>Slide 2</p>
            </div>
            <div className="lightbox__slide">
              <p>Slide 3</p>
            </div>
          </div>
        </div>
      </div>);

      slide2 = (<div
        className="lightbox"
        onClick={instance._handleClose}>
        <button className="lightbox__close">
          <SvgIcon
            name="close_16_white"
            width="16" />
        </button>
        <div className="lightbox__wrapper"
          onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            <div className="lightbox__navigation">
              <button className="lightbox__navigation-previous"
                onClick={instance._goToSlide.bind(instance, -1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <button className="lightbox__navigation-next"
                onClick={instance._goToSlide.bind(instance, 1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <ul className="lightbox__navigation-bullets">
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 0})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet is-active"
                  onClick={instance.setState.bind(instance, {activeSlide: 1})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 2})}>
                  &bull;
                </li>
              </ul>
            </div>
            <div className="lightbox__slide">
              <p>Slide 1</p>
            </div>
            <div className="lightbox__slide is-active">
              <p>Slide 2</p>
            </div>
            <div className="lightbox__slide">
              <p>Slide 3</p>
            </div>
          </div>
        </div>
      </div>);

      slide3 = (<div
        className="lightbox"
        onClick={instance._handleClose}>
        <button className="lightbox__close">
          <SvgIcon
            name="close_16_white"
            width="16" />
        </button>
        <div className="lightbox__wrapper"
          onClick={instance._stopPropagation}>
          <div className="lightbox__content">
            <div className="lightbox__navigation">
              <button className="lightbox__navigation-previous"
                onClick={instance._goToSlide.bind(instance, -1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <button className="lightbox__navigation-next"
                disabled
                onClick={instance._goToSlide.bind(instance, 1)}>
                <SvgIcon name="chevron_down_16" width="16" />
              </button>
              <ul className="lightbox__navigation-bullets">
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 0})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet"
                  onClick={instance.setState.bind(instance, {activeSlide: 1})}>
                  &bull;
                </li>
                <li className="lightbox__navigation-bullet is-active"
                  onClick={instance.setState.bind(instance, {activeSlide: 2})}>
                  &bull;
                </li>
              </ul>
            </div>
            <div className="lightbox__slide">
              <p>Slide 1</p>
            </div>
            <div className="lightbox__slide">
              <p>Slide 2</p>
            </div>
            <div className="lightbox__slide is-active">
              <p>Slide 3</p>
            </div>
          </div>
        </div>
      </div>);
    });

    it('renders with multiple slides', () => {
      expect(output).toEqualJSX(
        slide1
      );
    });

    it('moves to the next slide when _nextSlide is called', () => {
      instance._goToSlide(1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide2
      );
    });

    it('disables the next slide button when the last slide is active', () => {
      instance._goToSlide(1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide3
      );
    });

    it('does not move past the final slide', () => {
      instance._goToSlide(1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide3
      );
    });

    it('moves to the prev slide when _previousSlide is called', () => {
      instance._goToSlide(-1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide2
      );
    });

    it('disables the prev slide button when the first slide is active', () => {
      instance._goToSlide(-1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide1
      );
    });

    it('does not move past the first slide', () => {
      instance._goToSlide(-1);
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide1
      );
    });

    it('moves to the nth slide when _goToSlide is called', () => {
      instance.setState({
        activeSlide: 1
      });
      output = renderer.getRenderOutput();
      expect(output).toEqualJSX(
        slide2
      );
    });
  });
});
