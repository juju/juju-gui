/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class Panel extends React.Component {
  componentDidMount() {
    // Set the keyboard focus on the component so it can be scrolled with the
    // keyboard. Requires tabIndex to be set on the element.
    if (this.props.focus) {
      this.refs.content.focus();
    }
  }

  /**
    Returns the supplied classes with the 'active' class applied if the
    component is the one which is active.

    @method _generateClasses
    @param {String} section The section you want to check if it needs to be
      active.
    @returns {String} The collection of class names.
  */
  _genClasses(section) {
    return classNames(
      'panel-component',
      this.props.instanceName,
      this.props.extraClasses || null,
      {
        hidden: !this.props.visible
      }
    );
  }

  /**
    Call a click action if it exists.

    @method _handleClick
  */
  _handleClick() {
    var clickAction = this.props.clickAction;
    if (clickAction) {
      clickAction();
    }
  }

  /**
    Don't bubble the click event to the parent.

    @method _stopBubble
    @param {Object} The click event.
  */
  _stopBubble(e) {
    if (this.props.clickAction) {
      e.stopPropagation();
    }
  }

  render() {
    return (
      <div className={this._genClasses()}
        onClick={this._handleClick.bind(this)}
        ref="content"
        tabIndex="0">
        <div className="panel-component__inner"
          onClick={this._stopBubble.bind(this)}>
          {this.props.children}
        </div>
      </div>
    );
  }
};

Panel.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  clickAction: PropTypes.func,
  extraClasses: PropTypes.string,
  focus: PropTypes.bool,
  instanceName: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired
};

Panel.defaultProps = {
  focus: true
};

module.exports = Panel;
