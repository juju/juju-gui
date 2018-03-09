/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

const SvgIcon = require('../svg-icon/svg-icon');

/**
  Renders a modal like overlay with a darkened background.
  A caption is displayed in white below the content if present.
*/
class Lightbox extends React.Component {
  constructor() {
    super();

    this.state = {
      activeSlide: 0,
      lastSlide: null
    };
  }

  componentWillMount() {
    if (this.props.children.map) {
      this.setState({
        lastSlide: this.props.children.length - 1
      });
    }
  }

  _goToSlide(delta) {
    let newIndex = this.state.activeSlide + delta;

    if (newIndex < 0) {
      newIndex = 0;
    }

    if (newIndex > this.state.lastSlide) {
      newIndex = this.state.lastSlide;
    }

    this.setState({
      activeSlide: newIndex
    });
  }

  _generateNavigation() {
    if (!this.state.lastSlide) {
      return;
    }

    const bullets = [];

    for(let i = 0, ii = this.state.lastSlide; i <= ii; i += 1) {
      const classes = classNames(
        'lightbox__navigation-bullet',
        {
          'is-active': this.state.activeSlide === i
        }
      );

      bullets.push(
        <li
          className={classes}
          key={i}
          onClick={this.setState.bind(this, {activeSlide: i})}>&bull;</li>);
    }

    return (
      <div className="lightbox__navigation">
        <button
          className="lightbox__navigation-previous"
          disabled={this.state.activeSlide === 0}
          onClick={this._goToSlide.bind(this, -1)}>
          <SvgIcon name="chevron_down_16" width="16" />
        </button>
        <button
          className="lightbox__navigation-next"
          disabled={this.state.activeSlide === this.state.lastSlide}
          onClick={this._goToSlide.bind(this, 1)}>
          <SvgIcon name="chevron_down_16" width="16" />
        </button>
        <ul className="lightbox__navigation-bullets">
          {bullets}
        </ul>
      </div>
    );
  }

  _generateContent() {
    if (!this.state.lastSlide) {
      return this.props.children;
    }

    return this.props.children.map((child, index) => {
      const classes = classNames(
        'lightbox__slide',
        {
          'is-active': this.state.activeSlide === index
        }
      );
      return (
        <div className={classes} key={index}>{child}</div>
      );
    });
  }

  _handleClose(evt) {
    this.props.close();
  }

  _stopPropagation(evt) {
    evt.stopPropagation();
  }

  render() {
    let caption;

    if (this.props.caption) {
      caption = (
        <div className="lightbox__caption">
          {this.props.caption}
        </div>
      );
    }

    let classes = classNames(
      'lightbox',
      this.props.extraClasses
    );

    return (
      <div className={classes} onClick={this._handleClose.bind(this)}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={this._stopPropagation}>
          <div className="lightbox__content">
            {this._generateNavigation()}
            {this._generateContent()}
          </div>
          {caption}
        </div>
      </div>
    );
  }
};

Lightbox.propTypes = {
  caption: PropTypes.string,
  children: PropTypes.node,
  close: PropTypes.func.isRequired,
  extraClasses: PropTypes.array
};

module.exports = Lightbox;
