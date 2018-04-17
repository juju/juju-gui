/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const DeploymentSection = require('../section/section');
const ExpertBlock = require('../../expert-block/expert-block');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentExpertIntro extends React.Component {

  /**
    Generate the entity diagram or icon.
    @returns {Object} The markup.
  */
  _generateImage() {
    if (this.props.ddData.id.includes('bundle')) {
      return (
        <div className="deployment-expert-intro__diagram">
          <EntityContentDiagram
            diagramUrl={this.props.getDiagramURL(this.props.ddData.id)} />
        </div>);
    }
  }

  render() {
    return (
      <DeploymentSection
        instance="deployment-expert-intro-section">
        <div className="deployment-expert-intro">
          <div className="twelve-col">
            <div className="eight-col">
              <div className="deployment-expert-intro__section-title">
                You are about to deploy:
              </div>
              <h2>
                Saiku Drill
              </h2>
              <div className="six-col">
                <p>
                  Get faster insights with less effort. Apache Drill is a
                  schema-free SQL Query Engine.
                </p>
                <p>
                  Saiku-Drill combines traditional SQL queries on modern,
                  nontraditional datastores with the power of Saiku’s Business
                  Intelligence engine.
                </p>
                <p>
                  You can access multiple non-relational datastores directly,
                  connecting to Hadoop, NoSQL or Cloud Storage.
                </p>
                {this._generateImage()}
              </div>
              <div className="twelve-col">
                <div className="deployment-expert-intro__section-title">
                  you will need:
                </div>
                <ul>
                  <li>
                    Your <span className="link">cloud credentials</span>.
                    6 machines-instances will be created at your cloud provider
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
                    From $3577 per month
                  </h3>
                  <div className="deployment-expert-intro__plan-description">
                    Default plan with standard support
                  </div>
                  <p>
                    Ideal for enterprise teams processing large to very large data sets.
                  </p>
                  <ul className="deployment-expert-intro__features">
                    <li className="deployment-expert-intro__feature">
                      <SvgIcon
                        name="bullet"
                        size="14" />
                      Up to 50 users
                    </li>
                    <li className="deployment-expert-intro__feature">
                      <SvgIcon
                        name="bullet"
                        size="14" />
                      8 nodes x 64 GB RAM
                    </li>
                    <li className="deployment-expert-intro__feature">
                      <SvgIcon
                        name="bullet"
                        size="14" />
                      Drag and drop dashboard
                    </li>
                  </ul>
                  <span className="link">
                    View other support options
                  </span>
                </div>
              </ExpertBlock>
              <ExpertContactCard
                expert="spicule"
                sendAnalytics={this.props.sendAnalytics}
                staticURL={this.props.staticURL} />
            </div>
          </div>
        </div>
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
