/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const GenericButton = require('../../generic-button/generic-button');

/**
  Display extra info for a charm or bundle in a user profile.
*/
class ProfileExpandedContent extends React.Component {
  /**
    Prevents click event passing through and closing the expanding row.
    @param evt {Object} The click event.
  */
  _stopPropagation(evt) {
    evt.stopPropagation();
  }

  /**
    Navigate to a user profile.
    @param username {String} A username.
  */
  _navigateToProfile(username) {
    this.props.changeState({
      hash: null,
      profile: username
    });
  }

  /**
    Handle deploying an entity.
    @param entityId {String} A charm or bundle id.
  */
  _handleDeploy(entityId) {
    this.props.deployTarget(entityId);
    this.props.changeState({
      hash: null,
      profile: null
    });
  }

  /**
    Generate a list of permissions.
    @param permissions {Array} The list of permissions.
    @returns {Object} The list as JSX.
  */
  _generatePermissions(permissions) {
    let items = permissions.map(username => {
      if (username === 'everyone') {
        return (
          <li className="profile-expanded-content__permission"
            key={username}>
            {username}
          </li>);
      }
      return (
        <li className="profile-expanded-content__permission link"
          key={username}
          onClick={this._navigateToProfile.bind(this, username)}
          role="button"
          tabIndex="0">
          {username}
        </li>);
    });
    if (items.length === 0) {
      items = (
        <li className="profile-expanded-content__permission"
          key="none">
          None
        </li>);
    }
    return (
      <ul className="profile-expanded-content__permissions">
        {items}
      </ul>);
  }

  render() {
    const entity = this.props.entity;
    const getDiagramURL = this.props.getDiagramURL;
    const modelName = this.props.getModelName();
    const title = `Add to ${modelName || 'model'}`;
    const type = getDiagramURL ? 'bundle' : 'charm';
    return (
      <div className="profile-expanded-content">
        {this.props.topRow}
        <div className="six-col">
          <p>{entity.description}</p>
          {getDiagramURL ? (
            <EntityContentDiagram
              diagramUrl={getDiagramURL(entity.id)} />) : null}
        </div>
        <div className="six-col last-col">
          <div>
            <a href={entity.bugUrl}
              onClick={this._stopPropagation.bind(this)}
              target="_blank">
              Bugs
            </a>
          </div>
          <div>
            <a href={entity.homepage}
              onClick={this._stopPropagation.bind(this)}
              target="_blank">
              Homepage
            </a>
          </div>
          <p className="profile-expanded-content__permissions-title">
            Writeable:
          </p>
          {this._generatePermissions(entity.perm.write)}
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          {this._generatePermissions(entity.perm.read)}
        </div>
        <div className="three-col prepend-nine last-col">
          <GenericButton
            action={this._handleDeploy.bind(this, entity.id)}
            disabled={this.props.acl.isReadOnly()}
            tooltip={
              `Add this ${type} to ${modelName ? 'your current' : 'a new'} model`}
            type="positive">
            {title}
          </GenericButton>
        </div>
      </div>);
  }
};

ProfileExpandedContent.propTypes = {
  acl: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  deployTarget: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  getDiagramURL: PropTypes.func,
  getModelName: PropTypes.func.isRequired,
  topRow: PropTypes.object.isRequired
};

module.exports = ProfileExpandedContent;
