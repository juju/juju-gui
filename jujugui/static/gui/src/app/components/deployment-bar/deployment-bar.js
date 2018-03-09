/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const DeploymentBarNotification = require('./notification/notification');
const GenericButton = require('../generic-button/generic-button');

class DeploymentBar extends React.Component {
  constructor() {
    super();
    this.previousNotifications = [];
    this.state = {
      latestChangeDescription: null
    };
  }

  componentWillReceiveProps(nextProps) {
    this._updateLatestChange(nextProps.currentChangeSet);
  }

  /**
    Update the state with the latest change if it has changed.

    @method _updateLatestChange
    @param {Object} changeSet The collection of ecs changes.
  */
  _updateLatestChange(changeSet) {
    var keys = Object.keys(changeSet);
    var latestChange = keys[keys.length - 1];
    var previousIndex = this.previousNotifications.indexOf(latestChange);
    if (latestChange && previousIndex === -1) {
      var change = changeSet[latestChange];
      this.previousNotifications.push(latestChange);
      this.setState({
        latestChangeDescription: this.props.generateChangeDescription(change)
      });
    }
  }

  /**
    Get the label for the deploy button.

    @method _getDeployButtonLabel
    @returns {String} the label for the deploy button
  */
  _getDeployButtonLabel() {
    var label = this.props.modelCommitted ? 'Commit changes'
      : 'Deploy changes';
    return label + ' (' +
      Object.keys(this.props.currentChangeSet).length + ')';
  }

  /**
    Display the deployment summary when the deploy button is clicked.

    @method _deployAction
  */
  _deployAction() {
    this.props.sendAnalytics(
      'Deployment Flow',
      'Button click',
      'deploy'
    );
    this.props.changeState({
      gui: {
        deploy: ''
      }
    });
  }

  /**
    Generate the deploy button or read-only notice.

    @method _generateButton
  */
  _generateButton() {
    var changeCount = Object.keys(this.props.currentChangeSet).length;
    if (this.props.acl.isReadOnly()) {
      return (
        <div className="deployment-bar__read-only">
          Read only
        </div>);
    }
    return (
      <div className="deployment-bar__deploy">
        <GenericButton
          action={this._deployAction.bind(this)}
          disabled={changeCount === 0}
          type="inline-deployment">
          {this._getDeployButtonLabel()}
        </GenericButton>
      </div>);
  }

  render() {
    return (
      <div className="deployment-bar">
        <DeploymentBarNotification
          change={this.state.latestChangeDescription} />
        {this._generateButton()}
      </div>
    );
  }
};

DeploymentBar.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  currentChangeSet: PropTypes.object.isRequired,
  generateChangeDescription: PropTypes.func.isRequired,
  hasEntities: PropTypes.bool.isRequired,
  modelCommitted: PropTypes.bool.isRequired,
  sendAnalytics: PropTypes.func.isRequired
};

module.exports = DeploymentBar;
