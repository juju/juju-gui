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
      activeSlide: 0
    };
  }

  _goToSlide(index) {
    this.setState({
      activeSlide: index
    });
  }

  _nextSlide() {
    this.setState({
      activeSlide: this.state.activeSlide += 1
    });
  }

  _previousSlide() {
    this.setState({
      activeSlide: this.state.activeSlide -= 1
    });
  }

  _generateNavigation() {
    if (this.props.children.length === 0) {
      return;
    }

    const bullets = [];

    for(let i = 0, ii = this.props.children.length; i < ii; i += 1) {
      const classes = classNames(
        'lightbox__navigation-bullet',
        {
          'is-active': this.state.activeSlide === i
        }
      );

      bullets.push(<li className={classes} key={i}>&bull;</li>);
    }

    return (
      <div className="lightbox__navigation">
        <span role="button" className="lightbox__navigation-previous">
          Previous
        </span>
        <span role="button" className="lightbox__navigation-next">
          Next
        </span>
        <ul className="lightbox__navigation-bullets">
          {bullets}
        </ul>
      </div>
    );
  }

  _generateContent() {
    if (this.props.children.length === 1) {
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

    return (
      <div className="lightbox" onClick={this._handleClose.bind(this)}>
        <button className="lightbox__close">
          <SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__wrapper" onClick={this._stopPropagation.bind(this)}>
          <div className="lightbox__content">
            {this._generateContent()}
            {this._generateNavigation()}
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
  close: PropTypes.func.isRequired
};

module.exports = Lightbox;
