/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentChangeItem extends React.Component {
  /**
    Generate the icon node.

    @method _generateIcon
    @param {String} icon The icon to display.
    @returns {Object} The icon node.
  */
  _generateIcon(icon) {
    var node;
    var className = 'deployment-change-item__icon';
    if (icon.indexOf('.svg') > -1) {
      node = <img src={icon} alt="" className={className} />;
    } else {
      node = (
        <SvgIcon name={icon}
          className={className}
          size="16" />);
    }
    return node;
  }

  /**
    Generate the time if required.

    @method _generateTime
    @returns {Object} The time markup.
  */
  _generateTime() {
    if (!this.props.showTime) {
      return;
    }
    return (
      <span className="deployment-change-item__time">
        {this.props.change.time}
      </span>);
  }

  render() {
    var change = this.props.change;
    return (
      <li className="deployment-change-item">
        <span className="deployment-change-item__change">
          {this._generateIcon(change.icon)}
          {change.description}
        </span>
        {this._generateTime()}
      </li>
    );
  }
};

DeploymentChangeItem.propTypes = {
  change: PropTypes.object.isRequired,
  showTime: PropTypes.bool
};

DeploymentChangeItem.defaultProps = {
  showTime: true
};

module.exports = DeploymentChangeItem;
