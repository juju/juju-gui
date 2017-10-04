/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

class DeploymentBarNotification extends React.Component {
  constructor() {
    super();
    this.timeout = null;
  }
  /**
    Fade out the notification.

    @method _hideNotification
  */
  _hideNotification() {
    var node;
    try {
      // This will throw a warning that it can't be found sometimes, that's
      // fine to ignore.
      node = this.refs.deploymentBarNotificationContainer;
      // Fade out the notification.
      node.classList.remove('deployment-bar__notification--visible');
    } catch (e) {
      // The notification has already been removed.
    }
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
        var node = ReactDOM.findDOMNode(this);
        // Fade in the notification.
        if (node) {
          node.classList.add('deployment-bar__notification--visible');
          window.clearTimeout(this.timeout);
          this.timeout = window.setTimeout(
            this._hideNotification.bind(this), 4000);
        }
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
    return (
      <div className="deployment-bar__notification"
        onClick={this._handleClick.bind(this)}
        ref="deploymentBarNotificationContainer">
        {description}
      </div>
    );
  }
};

DeploymentBarNotification.propTypes = {
  change: PropTypes.object
};

module.exports = DeploymentBarNotification;
