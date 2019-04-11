/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Lightbox = require('./lightbox');
const SvgIcon = require('../svg-icon/svg-icon');

describe('Lightbox', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Lightbox
      caption={options.caption === undefined ? 'Test caption' : options.caption}
      close={options.close || sinon.stub()}
      extraClasses={options.extraClasses}>
      {options.children || 'Hi'}
    </Lightbox>
  );

  it('renders', () => {
    const wrapper = renderComponent();
    const expected = (
      <div
        className="lightbox"
        onClick={wrapper.prop('onClick')}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div
          className="lightbox__wrapper"
          onClick={wrapper.find('.lightbox__wrapper').prop('onClick')}>
          <div className="lightbox__content">
            Hi
          </div>
          <div className="lightbox__caption">
            Test caption
          </div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('renders with extra classes', () => {
    const wrapper = renderComponent({
      extraClasses: ['testing']
    });
    assert.equal(wrapper.prop('className').includes('testing'), true);
  });

  it('renders without a caption', () => {
    const wrapper = renderComponent({
      caption: null
    });
    assert.equal(wrapper.find('.lightbox__caption').length, 0);
  });

  describe('slides', () => {
    let slideList;

    beforeEach(() => {
      slideList = [
        (<p key="1">Slide 1</p>),
        (<p key="2">Slide 2</p>),
        (<p key="3">Slide 3</p>)
      ];
    });

    it('renders with multiple slides', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const expected = (
        <div className="lightbox__content">
          <div className="lightbox__navigation">
            <button
              className="lightbox__navigation-previous"
              disabled={true}
              onClick={wrapper.find('.lightbox__navigation-previous').prop('onClick')}>
              <SvgIcon name="chevron_down_16" width="16" />
            </button>
            <button
              className="lightbox__navigation-next"
              disabled={false}
              onClick={wrapper.find('.lightbox__navigation-next').prop('onClick')}>
              <SvgIcon name="chevron_down_16" width="16" />
            </button>
            <ul className="lightbox__navigation-bullets">
              <li
                className="lightbox__navigation-bullet is-active"
                onClick={wrapper.find('.lightbox__navigation-bullet').at(0).prop('onClick')}>
                &bull;
              </li>
              <li
                className="lightbox__navigation-bullet"
                onClick={wrapper.find('.lightbox__navigation-bullet').at(1).prop('onClick')}>
                &bull;
              </li>
              <li
                className="lightbox__navigation-bullet"
                onClick={wrapper.find('.lightbox__navigation-bullet').at(2).prop('onClick')}>
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
        </div>);
      assert.compareJSX(wrapper.find('.lightbox__content'), expected);
    });

    it('moves to the next slide when _nextSlide is called', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const instance = wrapper.instance();
      instance._goToSlide(1);
      wrapper.update();
      assert.equal(
        wrapper.find('.lightbox__navigation-previous').prop('disabled'), false);
      const bullets = wrapper.find('.lightbox__navigation-bullet');
      assert.equal(
        bullets.at(0).prop('className').includes('is-active'), false);
      assert.equal(
        bullets.at(1).prop('className').includes('is-active'), true);
      const slides = wrapper.find('.lightbox__slide');
      assert.equal(
        slides.at(0).prop('className').includes('is-active'), false);
      assert.equal(
        slides.at(1).prop('className').includes('is-active'), true);
    });

    it('disables the next slide button when the last slide is active', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const instance = wrapper.instance();
      instance._goToSlide(2);
      wrapper.update();
      assert.equal(
        wrapper.find('.lightbox__navigation-previous').prop('disabled'), false);
      assert.equal(
        wrapper.find('.lightbox__navigation-next').prop('disabled'), true);
    });

    it('does not move past the final slide', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const instance = wrapper.instance();
      instance._goToSlide(5);
      wrapper.update();
      assert.equal(
        wrapper.find('.lightbox__navigation-next').prop('disabled'), true);
      const bullets = wrapper.find('.lightbox__navigation-bullet');
      assert.equal(
        bullets.at(2).prop('className').includes('is-active'), true);
      const slides = wrapper.find('.lightbox__slide');
      assert.equal(
        slides.at(2).prop('className').includes('is-active'), true);
    });

    it('moves to the prev slide when _previousSlide is called', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const instance = wrapper.instance();
      instance._goToSlide(2);
      instance._goToSlide(-1);
      wrapper.update();
      assert.equal(
        wrapper.find('.lightbox__navigation-previous').prop('disabled'), false);
      const bullets = wrapper.find('.lightbox__navigation-bullet');
      assert.equal(
        bullets.at(0).prop('className').includes('is-active'), false);
      assert.equal(
        bullets.at(1).prop('className').includes('is-active'), true);
      const slides = wrapper.find('.lightbox__slide');
      assert.equal(
        slides.at(0).prop('className').includes('is-active'), false);
      assert.equal(
        slides.at(1).prop('className').includes('is-active'), true);
    });

    it('does not move past the first slide', () => {
      const wrapper = renderComponent({
        children: slideList
      });
      const instance = wrapper.instance();
      instance._goToSlide(-1);
      wrapper.update();
      assert.equal(
        wrapper.find('.lightbox__navigation-previous').prop('disabled'), true);
      const bullets = wrapper.find('.lightbox__navigation-bullet');
      assert.equal(
        bullets.at(0).prop('className').includes('is-active'), true);
      const slides = wrapper.find('.lightbox__slide');
      assert.equal(
        slides.at(0).prop('className').includes('is-active'), true);
    });
  });
});
