/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const DeploymentSection = require('../section/section');
const ExpertBlock = require('../../expert-block/expert-block');
const EntityContentDescription = require('../../entity-details/content/description/description'); //eslint-disable-line max-len
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const Link = require('../../link/link');

class DeploymentExpertIntro extends React.Component {
  constructor(props) {
    super(props);
    this.isBundle = this.props.ddData.id.includes('bundle');
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

  /**
    Generate the entity diagram or icon.
    @returns {Object} The markup.
  */
  _generateImage() {
    if (this.isBundle) {
      return (
        <div className="deployment-expert-intro__diagram">
          <EntityContentDiagram
            diagramUrl={this.props.getDiagramURL(this.props.ddData.id)} />
        </div>);
    }
  }

  render() {
    const { entityModel } = this.props;
    let content;
    if (!entityModel) {
      content = (
        <div className="deployment-expert-intro__not-found">
          This {this.isBundle ? 'bundle' : 'charm'} could not be found.
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
      const machineNumber = this.isBundle ? entity.machineCount : 1;
      const price = `From $${entity.price} per month`;
      const supportedDescription = this.props.renderMarkdown(entity.supportedDescription);
      content = (
        <div className="deployment-expert-intro">
          <div className="twelve-col">
            <div className="eight-col">
              <div className="deployment-expert-intro__section-title">
                You are about to deploy:
              </div>
              <h2>
                {entity.displayName}
              </h2>
              <div className="six-col">
                <EntityContentDescription
                  description={entity.description}
                  renderMarkdown={this.props.renderMarkdown} />
                {this._generateImage()}
              </div>
              <div className="twelve-col">
                <div className="deployment-expert-intro__section-title">
                  you will need:
                </div>
                <ul>
                  <li>
                    Your&nbsp;
                    <a href="https://jujucharms.com/docs/stable/credentials"
                      target="_blank">
                      cloud credentials
                    </a>.&nbsp;
                    <span className="deployment-expert-intro__machine-count">
                      {machineNumber}
                    </span>
                    &nbsp;machine-instances will be created at your cloud provider
                  </li>
                  <li>
                    A valid credit credit card
                  </li>
                </ul>
              </div>
            </div>
            <div className="four-col last-col">
              <ExpertBlock
                title="Juju expert partners">
                <div className="deployment-expert-intro__plan-details">
                  <h3>
                    {price}
                  </h3>
                  <div className="deployment-expert-intro__plan-description">
                    Default plan with essential support
                  </div>
                  <div
                    className="deployment-expert-intro__description"
                    dangerouslySetInnerHTML={{__html: supportedDescription}}></div>
                  <Link changeState={this.props.changeState}
                    clickState={{ hash: 'support-level' }}
                    generatePath={this.props.generatePath}>
                    View other support options
                  </Link>
                </div>
              </ExpertBlock>
              <ExpertContactCard
                expert={entity.owner}
                sendAnalytics={this.props.sendAnalytics}
                staticURL={this.props.staticURL} />
            </div>
          </div>
        </div>);
    }
    return (
      <DeploymentSection
        instance="deployment-expert-intro-section">
        {content}
      </DeploymentSection>
    );
  }
};

DeploymentExpertIntro.propTypes = {
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  ddData: PropTypes.object.isRequired,
  entityModel: PropTypes.object,
  generatePath: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func.isRequired,
  renderMarkdown: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  staticURL: PropTypes.string
};

module.exports = DeploymentExpertIntro;
