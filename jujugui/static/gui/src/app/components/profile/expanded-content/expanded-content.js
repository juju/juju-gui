/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const GenericButton = require('../../generic-button/generic-button');
const Link = require('../../link/link');

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
    this.props.addToModel(entityId);
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
    let items = permissions.map((username, i) => {
      let content;
      if (username === 'everyone') {
        content = username;
      } else {
        content = (
          <Link changeState={this.props.changeState}
            clickState={{
              hash: null,
              profile: username
            }}
            generatePath={this.props.generatePath}>
            {username}
          </Link>);
      }
      return (
        <li className="profile-expanded-content__permission"
          key={username + i}>
          {content}
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
          {entity.description ? (
            <p className="profile-expanded-content__entity-desc">{entity.description}</p>
          ): null}
          {getDiagramURL ? (
            <EntityContentDiagram
              diagramUrl={getDiagramURL(entity.id)} />) : null}
        </div>
        <div className="six-col last-col">
          {entity.bugUrl ? (
            <div>
              <a href={entity.bugUrl}
                onClick={this._stopPropagation.bind(this)}
                target="_blank">
                Bugs
              </a>
            </div>) : null}
          {entity.homepage ? (
            <div>
              <a href={entity.homepage}
                onClick={this._stopPropagation.bind(this)}
                target="_blank">
                Homepage
              </a>
            </div>) : null}
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
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  addToModel: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  generatePath: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func,
  getModelName: PropTypes.func.isRequired,
  topRow: PropTypes.object.isRequired
};

module.exports = ProfileExpandedContent;
