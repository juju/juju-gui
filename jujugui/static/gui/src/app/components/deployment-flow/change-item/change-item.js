/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
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
      node = <img alt="" className={className} src={icon} />;
    } else {
      node = (
        <SvgIcon className={className}
          name={icon}
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
      <div className="deployment-change-item">
        <span className="deployment-change-item__change">
          {this._generateIcon(change.icon)}
          {change.description}
          <span className="deployment-change-item__change-command">
            {change.command}
          </span>
        </span>
        {this._generateTime()}
      </div>
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
