/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

const React = require('react');

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

  _goToSlide(index) {
    if (index < 0) {
      index = 0;
    }
    if (index > this.state.lastSlide) {
      index = this.state.lastSlide;
    }
    this.setState({
      activeSlide: index
    });
  }

  _nextSlide() {
    const nextSlide = this.state.activeSlide + 1;
    if (nextSlide <= this.state.lastSlide) {
      this._goToSlide(nextSlide);
    }
  }

  _previousSlide() {
    const nextSlide = this.state.activeSlide - 1;
    if (nextSlide >= 0) {
      this._goToSlide(nextSlide);
    }
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
          onClick={this._goToSlide.bind(this, i)}>&bull;</li>);
    }

    const previousButtonClasses = classNames(
      'lightbox__navigation-previous',
      {
        'is-disabled': this.state.activeSlide === 0
      }
    );

    const nextButtonClasses = classNames(
      'lightbox__navigation-next',
      {
        'is-disabled': this.state.activeSlide === this.state.lastSlide
      }
    );

    return (
      <div className="lightbox__navigation">
        <button
          onClick={this._previousSlide.bind(this)}
          className={previousButtonClasses}>
          Previous
        </button>
        <button
          onClick={this._nextSlide.bind(this)}
          className={nextButtonClasses}>
          Next
        </button>
        <ul className="lightbox__navigation-bullets">
          {bullets}
        </ul>
      </div>
    );
  }

  _generateContent() {
    if (!this.props.children.map) {
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
      )
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

    let classes = ['lightbox'];

    if (this.props.extraClasses) {
      classes = classes.concat(this.props.extraClasses);
    }

    return (
      <div className={classes.join(' ')} onClick={this._handleClose.bind(this)}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={this._stopPropagation.bind(this)}>
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
