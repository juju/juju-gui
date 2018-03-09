/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class CheckListItem extends React.Component {
  constructor() {
    super();
    this.state = {
      checked: false
    };
  }
  /**
    Returns the classes for the item based on the provided props.

    @method _valueClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var className = this.props.className;
    return classNames(
      'check-list-item',
      className ? 'check-list-item--' + className : '',
      {'check-list-item--nav': this.props.action},
      {'check-list-item--extra-info': this.props.extraInfo}
    );
  }

  /**
    Returns the id if the item is not a navigation element.

    @method _valueClasses
    @param {String} id The id of the checkbox.
    @returns {String} The id of the element or a blank string.
  */
  _generateId(id) {
    // Firefox does not link empty htmlFor properties so set it to undefined so
    // the property does not get set.
    return this.props.action ? undefined : id;
  }

  /**
    Handles the checkbox change action by either calling the parent supplied
    whenChanged method and by setting the local checked state.

    @method _handleChange
    @param {Object} The change event from the checkbox.
  */
  _handleChange(e) {
    var whenChanged = this.props.whenChanged;
    var checked = e.currentTarget.checked;
    this.setState({checked: checked}, () => {
      // When whenChanged is set by the list parent and is used to (de)select
      // all checkboxes. It is called in the setState callback so that the
      // updated state is available if we inspect it from whenChanged.
      if (whenChanged) {
        whenChanged(checked);
      }
    });
  }

  /**
    Toggle the checkbox when the hit area is clicked.

    @param evt {Object} The click event from the hit area.
  */
  _hitAreaClick(evt) {
    // If there is no action to be triggered by clicking on the list item then
    // we don't need to capture and pass the event to the checkbox.
    if (!this.props.action) {
      return;
    }
    this._stopBubble(evt);
    // Simulate the click on the checkbox.
    this._handleChange({currentTarget: {checked: !this.state.checked}});
  }

  /**
    Don't bubble the click event to the parent.

    @method _stopBubble
    @param {Object} The click event from the checkbox.
  */
  _stopBubble(e) {
    e.stopPropagation();
  }

  /**
    Display the aside if it is available.

    @method _generateAside
  */
  _generateAside() {
    var aside = this.props.aside;
    if (aside) {
      return (
        <span className="check-list-item__aside">
          {aside}
        </span>);
    }
  }

  _generateExtraInfo(extraInfo) {
    if (!extraInfo || extraInfo === '') {
      return;
    }
    return (
      <span className="check-list-item__extra-info"
        title={this.props.extraInfo}>
        {this.props.extraInfo}
      </span>);
  }

  render() {
    var id = this.props.label + '-item';
    return (
      <li className={this._generateClasses()}
        data-id={this.props.id}
        onClick={this.props.action} role="button" tabIndex="0">
        <label htmlFor={this._generateId(id)}>
          <div className="check-list-item__hit-area"
            onClick={this._hitAreaClick.bind(this)}>
            <input
              checked={this.state.checked}
              disabled={this.props.disabled}
              id={id}
              onChange={this._handleChange.bind(this)}
              onClick={this._stopBubble.bind(this)}
              type="checkbox" />
          </div>
          <span className="check-list-item__label">
            {this.props.label}
          </span>
          {this._generateExtraInfo(this.props.extraInfo)}
          {this._generateAside()}
        </label>
      </li>
    );
  }
};

CheckListItem.propTypes = {
  action: PropTypes.func,
  aside: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  extraInfo: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  whenChanged: PropTypes.func.isRequired
};

module.exports = CheckListItem;
