/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class SvgIcon extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this._generateDimensions(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._generateDimensions(nextProps));
  }

  /**
    Generate the width and height based on the supplied props.

    @param {Object} props The component props.
    @returns {Object} The object of dimensions.
  */
  _generateDimensions(props) {
    var size = props.size || this.props.size || 16;
    return {
      width: props.width || this.props.width || size,
      height: props.height || this.props.height || size
    };
  }

  /**
    Generates the classes for the icon based on the supplied props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var className = this.props.className;
    return classNames(
      'svg-icon',
      className ? className : ''
    );
  }

  /**
    Generates the styles for the icon based on the supplied props.

    @method _generateStyles
    @returns {Object} The object of styles.
  */
  _generateStyles() {
    return {
      width: this.state.width + 'px',
      height: this.state.height + 'px'
    };
  }

  /**
    Generates the viewbox for the icon based on the supplied props.

    @method _generateViewbox
    @returns {String} The viewbox.
  */
  _generateViewbox() {
    return '0 0 ' + this.state.width + ' ' + this.state.height;
  }

  render() {
    return (
      <svg className={this._generateClasses()}
        style={this._generateStyles()}
        viewBox={this._generateViewbox()}>
        <use xlinkHref={'#' + this.props.name} />
      </svg>
    );
  }
};

SvgIcon.propTypes = {
  className: PropTypes.string,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

module.exports = SvgIcon;
