/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../../svg-icon/svg-icon');

class OverviewAction extends React.Component {
  constructor() {
    super();
    this.baseClass = 'overview-action';
  }

  /**
    Returns the supplied classes with the 'hidden' class applied if the
    value is falsey.
    @method _valueClasses
    @returns {String} The collection of class names.
  */
  _valueClasses() {
    return classNames(
      this.baseClass + '__value',
      this.props.valueType ?
        this.baseClass + '__value--type-' + this.props.valueType : '',
      {
        hidden: !this.props.value
      }
    );
  }

  /**
    Returns the supplied classes with the 'hidden' class applied if the
    value is falsey.
    @method _linkClasses
    @returns {String} The collection of class names.
  */
  _linkClasses() {
    return classNames(
      this.baseClass + '__link',
      {
        hidden: !this.props.linkAction
      }
    );
  }

  /**
    Call the supplied link action

    @method _handleLinkClick
    @param {Object} e The click event.
  */
  _handleLinkClick(e) {
    e.stopPropagation();
    this.props.linkAction();
  }

  /**
    Call the supplied link action

    @method _handleLinkClick
    @param {Object} e The click event.
  */
  _generateIcon(e) {
    var icon = this.props.icon;
    if (!icon) {
      return;
    }
    return (
      <span className="overview-action__icon">
        <SvgIcon name={icon}
          size="16" />
      </span>
    );
  }

  render() {
    var titleClass = this.baseClass + '__title';
    return (
      <li className={this.baseClass}
        onClick={this.props.action}
        role="button" tabIndex="0" title={this.props.title}>
        {this._generateIcon()}
        <span className={titleClass}>
          {this.props.title}
        </span>
        <span className={this._linkClasses()}
          onClick={this._handleLinkClick.bind(this)}>
          {this.props.linkTitle}
        </span>
        <span className={this._valueClasses()}>
          {this.props.value}
        </span>
      </li>
    );
  }
};

OverviewAction.propTypes = {
  action: PropTypes.func.isRequired,
  icon: PropTypes.string,
  linkAction: PropTypes.func,
  linkTitle: PropTypes.string,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  valueType: PropTypes.string
};

module.exports = OverviewAction;
