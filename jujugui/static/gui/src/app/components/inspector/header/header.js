/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

class InspectorHeader extends React.Component {
  /**
    Returns the supplied classes with the type class applied if it
    is truthy.

    @method _headerClasses
    @returns {String} The collection of class names.
  */
  _headerClasses() {
    return classNames(
      'inspector-header',
      this.props.type ? 'inspector-header--type-' + this.props.type : ''
    );
  }

  /**
    Use the post update call to animate the header on change.

    @param {Object} prevProps The props which were sent to the component.
    @param {Object} prevState The state that was sent to the component.
  */
  componentDidUpdate(prevProps, prevState) {
    // Only animate when switching between components.
    if (this.props.activeComponent !== prevProps.activeComponent) {
      var node = ReactDOM.findDOMNode(this);
      node.classList.remove('fade-in');
      // Animate the header change.
      window.requestAnimationFrame(function() {
        node.classList.add('fade-in');
      });
    }
  }

  render() {
    var backIconGrey = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="6px" height="16px" viewBox="0 0 6 16"><path fillrule="evenodd" class="inspector-list__header-back-image" d="M 1.29 10.18C 1.84 11.01 2.46 11.86 3.15 12.74 3.84 13.62 4.58 14.48 5.37 15.34 5.58 15.56 5.79 15.78 6 16 6 16 6 13.53 6 13.53 5.57 13.05 5.14 12.54 4.73 12.02 4.25 11.41 3.8 10.79 3.37 10.15 2.95 9.51 2.43 8.61 2.1 8 2.43 7.39 2.95 6.49 3.37 5.85 3.8 5.22 4.25 4.59 4.73 3.98 5.14 3.46 5.57 2.95 6 2.47 6 2.47 6 0 6 0 5.79 0.22 5.58 0.44 5.37 0.67 4.58 1.52 3.84 2.38 3.15 3.26 2.46 4.14 1.84 4.99 1.29 5.82 0.75 6.65 0.32 7.38 0 8 0.32 8.62 0.75 9.35 1.29 10.18" fill="rgb(131,147,149)"></path></svg>'; // eslint-disable-line max-len
    var backIconWhite = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="6px" height="16px" viewBox="0 0 6 16"><path fillrule="evenodd" class="inspector-list__header-back-image" d="M 1.29 10.18C 1.84 11.01 2.46 11.86 3.15 12.74 3.84 13.62 4.58 14.48 5.37 15.34 5.58 15.56 5.79 15.78 6 16 6 16 6 13.53 6 13.53 5.57 13.05 5.14 12.54 4.73 12.02 4.25 11.41 3.8 10.79 3.37 10.15 2.95 9.51 2.43 8.61 2.1 8 2.43 7.39 2.95 6.49 3.37 5.85 3.8 5.22 4.25 4.59 4.73 3.98 5.14 3.46 5.57 2.95 6 2.47 6 2.47 6 0 6 0 5.79 0.22 5.58 0.44 5.37 0.67 4.58 1.52 3.84 2.38 3.15 3.26 2.46 4.14 1.84 4.99 1.29 5.82 0.75 6.65 0.32 7.38 0 8 0.32 8.62 0.75 9.35 1.29 10.18" fill="rgb(255,255,255)"></path></svg>'; // eslint-disable-line max-len
    var type = this.props.type;
    var backIcon = type && type !== 'started' ? backIconWhite : backIconGrey;

    return (
      <div className={this._headerClasses()}
        onClick={this.props.backCallback} tabIndex="0" role="button">
        <span dangerouslySetInnerHTML={{__html: backIcon}}
          className="inspector-header__back" />
        <span className="inspector-header__title">
          {this.props.title}
        </span>
        <span className="inspector-header__icon-container">
          <img src={this.props.icon}
            className="inspector-header__service-icon" />
        </span>
      </div>
    );
  }
};

InspectorHeader.propTypes = {
  activeComponent: PropTypes.string,
  backCallback: PropTypes.func.isRequired,
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  type: PropTypes.string
};

module.exports = InspectorHeader;
