/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSection = require('../section/section');
const ExpertBlock = require('../../expert-block/expert-block');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const SvgIcon = require('../../svg-icon/svg-icon');
const DeploymentExpertIntro = require('./expert-intro');

describe('DeploymentExpertIntro', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertIntro
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      ddData={options.ddData || {
        id: 'apache2'
      }}
      entityModel={options.ddEntity || {}}
      generatePath={options.generatePath || sinon.stub()}
      getDiagramURL={options.getDiagramURL || sinon.stub()}
      renderMarkdown={options.renderMarkdown || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      staticURL={options.staticURL || '/static/url'} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
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
                sendAnalytics={sinon.stub()}
                staticURL="/static/url" />
            </div>
          </div>
        </div>
      </DeploymentSection>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render', () => {
    const wrapper = renderComponent({
      ddData: {
        id: 'bundle/kubernetes'
      },
      getDiagramURL: sinon.stub().returns('/diagram/url')
    });
    const expected = (
      <div className="deployment-expert-intro__diagram">
        <EntityContentDiagram
          diagramUrl="/diagram/url" />
      </div>);
    assert.compareJSX(wrapper.find('.deployment-expert-intro__diagram'), expected);
  });
});
