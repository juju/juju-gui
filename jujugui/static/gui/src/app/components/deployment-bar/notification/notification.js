/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const classNames = require('classnames');

class DeploymentBarNotification extends React.Component {
  constructor() {
    super();
    this.timeout = null;
    this.state = {
      visible: false
    };
  }
  /**
    Fade out the notification.

    @method _hideNotification
  */
  _hideNotification() {
    this.setState({ visible: false });
  }

  componentDidMount() {
    this._showNotification(null);
  }

  componentDidUpdate(prevProps, prevState) {
    this._showNotification(prevProps);
  }

  /**
    Show the notification with the supplied change.

    @method _showNotification
    @param {Object} prevProps The previous props for the component.
  */
  _showNotification(prevProps) {
    if (this.props.change) {
      var newId = this.props.change.id;
      var oldId = prevProps && prevProps.change ? prevProps.change.id : null;
      // Only show the notification if we've received a new id.
      if (newId !== oldId) {
        this.setState({ visible: true });
        this.timeout = window.setTimeout(
          this._hideNotification.bind(this), 4000);
      }
    }
  }

  /**
    Hide the notification when clicked

    @method _handleClick
  */
  _handleClick() {
    window.clearTimeout(this.timeout);
    this._hideNotification();
  }

  render() {
    var description;
    if (this.props.change) {
      description = this.props.change.description;
    }
    const classes = classNames('deployment-bar__notification', {
      'deployment-bar__notification--visible': this.state.visible
    });
    return (
      <div className={classes}
        onClick={this._handleClick.bind(this)}>
        {description}
      </div>
    );
  }
};

DeploymentBarNotification.propTypes = {
  change: PropTypes.object
};

module.exports = DeploymentBarNotification;
