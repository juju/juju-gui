/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const EnvSwitcher = require('../env-switcher/env-switcher');

// Define the name of the uncommitted model.
const NO_MODEL = 'untitled-model';

// This component handles the GUI header, in which the breadcrumb is
// displayed, including information about the current model and all other
// available models.
class HeaderBreadcrumb extends React.Component {
  /**
    Returns the classes for the button based on the provided props.
    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames('header-breadcrumb', {
      'header-breadcrumb--loading-model': this.props.loadingModel
    });
  }

  /**
    Renders the markup for the Env Switcher if the showEnvSwitcher prop is
    truthy.

    @method _renderEnvSwitcher
  */
  _renderEnvSwitcher() {
    const props = this.props;
    if (!props.showEnvSwitcher) {
      return null;
    }
    return (
      <li className="header-breadcrumb__list-item">
        <EnvSwitcher
          acl={this.props.acl}
          addNotification={this.props.addNotification}
          changeState={this.props.changeState}
          environmentName={this.props.modelName}
          humanizeTimestamp={this.props.humanizeTimestamp}
          listModelsWithInfo={this.props.listModelsWithInfo}
          modelCommitted={this.props.modelCommitted}
          setModelName={this.props.setModelName}
          switchModel={this.props.switchModel}
          user={this.props.user} />
      </li>);
  }

  /**
    Handles clicks on the profile link. Does not navigate to the profile
    if we aren't showing the model switcher.

    @method _handleProfileClick
    @param {String} username The name of the profile.
    @param {Object} evt The click event.
  */
  _handleProfileClick(username, evt) {
    evt.preventDefault();
    if (!this.props.showEnvSwitcher) {
      // Nothing to be done: we are already in the profile view.
      return;
    }
    this.props.showProfile(username);
  }

  /**
    Generate the model owner link. If there is no model or if the owner is
    not available yet, fall back to showing the current logged in user.

    TODO frankban: this requires a better UX. We can no longer assume that
    the second part of the breadcrumb is the logged in user, and so we need a
    new element showing who currently you are.

    @method _generateOwnerLink
  */
  _generateOwnerLink() {
    const currentState = this.props.appState.current;
    if (currentState && currentState.profile) {
      return this._buildProfile(currentState.profile);
    }
    const modelOwner = this.props.modelOwner;
    const modelName = this.props.modelName;
    if (!modelOwner || !modelName || modelName === NO_MODEL) {
      // There are no models so just render the current user instead.
      return this._generateUserLink();
    }
    return this._buildProfile(modelOwner.split('@')[0]);
  }

  /**
    Generate the user link. If we aren't showing the model switcher then the
    link to the profile does not turn the users cursor to a pointer because
    we disable the profile functionality in that case.

    @method _generateUserLink
  */
  _generateUserLink() {
    const user = this.props.user;
    if (user) {
      return this._buildProfile(user.displayName);
    }
    return null;
  }

  /**
    Build a link for the given user name.

    @method _buildProfile
    @param {String} username The name of the profile.
  */
  _buildProfile(username) {
    const props = this.props;
    const linkClasses = classNames('header-breadcrumb--link', {
      'profile-disabled': !props.showEnvSwitcher
    });
    const onClick = this._handleProfileClick.bind(this, username);
    const profileUrl = props.appState.generatePath({profile: username});
    return (
      <li className="header-breadcrumb__list-item">
        <a className={linkClasses}
          href={profileUrl}
          onClick={onClick}
          title={username}>
          {username}
        </a>
      </li>
    );
  }

  render() {
    const props = this.props;
    const userItem = this._generateOwnerLink();
    const user = props.user;
    return (
      <div className={this._generateClasses()}>
        <div className="header-breadcrumb__loading">Loading model</div>
        <ul className="header-breadcrumb__list"
          // This attribute is required by uitests.
          data-username={user && user.displayName}>
          {userItem}
          {this._renderEnvSwitcher()}
        </ul>
      </div>
    );
  }
};

HeaderBreadcrumb.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  appState: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  humanizeTimestamp: PropTypes.func.isRequired,
  listModelsWithInfo: PropTypes.func,
  loadingModel: PropTypes.bool,
  modelCommitted: PropTypes.bool,
  modelName: PropTypes.string,
  modelOwner: PropTypes.string,
  setModelName: PropTypes.func.isRequired,
  showEnvSwitcher: PropTypes.bool.isRequired,
  showProfile: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  user: PropTypes.object
};

HeaderBreadcrumb.defaultProps = {
  loadingModel: false
};

module.exports = HeaderBreadcrumb;
