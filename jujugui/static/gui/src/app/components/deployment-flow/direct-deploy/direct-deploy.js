/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../generic-button/generic-button');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const EntityContentDescription = require('../../entity-details/content/description/description'); //eslint-disable-line max-len
const DeploymentSection = require('../section/section');

class DeploymentDirectDeploy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isBundle: this.props.ddData.id.indexOf('bundle') !== -1
    };
  }

  /**
    Change the state to close the deployment flow.
  */
  _handleClose() {
    this.props.changeState({
      gui: {deploy: null},
      profile: null,
      special: {dd: null}
    });
  }

  /**
    Generate the entity link.

    @returns {Object} The link markup or null.
  */
  _generateLink() {
    const ddEntityId = this.props.ddData.id;
    let url;
    try {
      url = window.jujulib.URL.fromLegacyString(ddEntityId);
    } catch(_) {
      url = window.jujulib.URL.fromString(ddEntityId);
    }
    url = this.props.generatePath({
      store: url.path()
    });
    return (
      <a className="link"
        href={url}
        target="_blank">
        Learn more about this {this.state.isBundle ? 'bundle' : 'charm'}.
      </a>);
  }

  /**
    Generate the entity diagram or icon.

    @returns {Object} The markup.
  */
  _generateImage() {
    if (this.state.isBundle) {
      return (
        <EntityContentDiagram
          diagramUrl={this.props.getDiagramURL(this.props.ddData.id)} />);
    } else {
      const entity = this.props.entityModel.toEntity();
      return (
        <div className="deployment-direct-deploy__image-block">
          <img alt={entity.displayName}
            className="deployment-direct-deploy__image-block-icon"
            src={entity.iconPath}
            width="96" />
        </div>);
    }
  }

  /**
    Navigate to the store state.
  */
  _handleStoreClick() {
    this.props.changeState({
      gui: {deploy: null},
      profile: null,
      store: '',
      special: {dd: null}
    });
  }

  render() {
    let content = null;
    const entityModel = this.props.entityModel;
    if (!entityModel) {
      content = (
        <div className="deployment-direct-deploy__content">
          This {this.state.isBundle ? 'bundle' : 'charm'} could not be found.
          Visit the&nbsp;
          <span className="link"
            onClick={this._handleStoreClick.bind(this)}
            role="button"
            tabIndex="0">
            store
          </span>&nbsp;
          to find more charms and bundles.
        </div>);
    } else {
      const entity = entityModel.toEntity();
      const machineNumber = this.state.isBundle ? entity.machineCount : 1;
      content = (
        <div className="deployment-direct-deploy__content">
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              {entity.displayName}
            </h2>
            <EntityContentDescription
              entityModel={entityModel}
              renderMarkdown={this.props.renderMarkdown} />
            <ul>
              <li>
                It will run on {machineNumber}&nbsp;
                machine{machineNumber === 1 ? '' : 's'} in your cloud.
              </li>
            </ul>
            {this._generateLink()}
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              {this._generateImage()}
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <GenericButton
                action={this._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </GenericButton>
            </div>
          </div>
        </div>);
    }
    return (
      <DeploymentSection
        instance="deployment-direct-deploy">
        {content}
      </DeploymentSection>);
  }
};

DeploymentDirectDeploy.propTypes = {
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  ddData: PropTypes.object.isRequired,
  entityModel: PropTypes.object,
  generatePath: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func.isRequired,
  renderMarkdown: PropTypes.func.isRequired
};

module.exports = DeploymentDirectDeploy;
