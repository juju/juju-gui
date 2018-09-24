/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentSection = require('../section/section');
const ExpertBlock = require('../../expert-block/expert-block');
const EntityContentDescription = require('../../entity-details/content/description/description'); //eslint-disable-line max-len
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const Link = require('../../link/link');
const DeploymentExpertIntro = require('./expert-intro');

describe('DeploymentExpertIntro', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertIntro
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      ddData={options.ddData || {
        id: 'cs:apache-21'
      }}
      entityModel={options.entityModel === undefined ? {
        toEntity: sinon.stub().returns({
          description: 'Description',
          supportedDescription: '#### supported description',
          price: '8',
          displayName: 'Apache 2',
          iconPath: 'http://example.com/icon.svg',
          owner: 'spinach'
        })
      } : options.entityModel}
      generatePath={options.generatePath || sinon.stub()}
      getDiagramURL={options.getDiagramURL || sinon.stub()}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      staticURL={options.staticURL || '/static/url'} />
  );

  it('can render for without an entity', () => {
    const wrapper = renderComponent({
      entityModel: null
    });
    const expected = (
      <div className="deployment-expert-intro__not-found">
        This {'charm'} could not be found.
        Visit the&nbsp;
        <span
          className="link"
          onClick={wrapper.find('.deployment-expert-intro__not-found .link').prop('onClick')}
          role="button"
          tabIndex="0">
          store
        </span>&nbsp;
        to find more charms and bundles.
      </div>);
    assert.compareJSX(wrapper.find('.deployment-expert-intro__not-found'), expected);
  });

  it('can render for a charm', () => {
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
                Apache 2
              </h2>
              <div className="six-col">
                <EntityContentDescription
                  description="Description" />
              </div>
              <div className="twelve-col">
                <div className="deployment-expert-intro__section-title">
                  you will need:
                </div>
                <ul>
                  <li>
                    Your&nbsp;
                    <a
                      href="https://jujucharms.com/docs/stable/credentials"
                      target="_blank">
                      cloud credentials
                    </a>.&nbsp;
                    <span className="deployment-expert-intro__machine-count">
                      {1}
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
                    From $8 per month
                  </h3>
                  <div className="deployment-expert-intro__plan-description">
                    Default plan with essential support
                  </div>
                  <div
                    className="deployment-expert-intro__description"
                    dangerouslySetInnerHTML={{_html: 'md'}} />
                  <Link
                    changeState={sinon.stub()}
                    clickState={{hash: 'support-level'}}
                    generatePath={sinon.stub()}>
                    View other support options
                  </Link>
                </div>
              </ExpertBlock>
              <ExpertContactCard
                expert="spinach"
                sendAnalytics={sinon.stub()}
                staticURL="/static/url" />
            </div>
          </div>
        </div>
      </DeploymentSection>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render for a bundle', () => {
    const bundle = {
      toEntity: sinon.stub().returns({
        description: 'Description',
        supportedDescription: '#### supported description',
        displayName: 'Kubernetes core',
        machineCount: 4,
        owner: 'spinach'
      })
    };
    const wrapper = renderComponent({
      ddData: {
        id: 'cs:bundle/kubernetes-core-8'
      },
      entityModel: bundle,
      getDiagramURL: sinon.stub().returns('/diagram/url')
    });
    const expectedDiagram = (
      <div className="deployment-expert-intro__diagram">
        <EntityContentDiagram
          diagramUrl="/diagram/url" />
      </div>);
    const expectedMachineCount = (
      <span className="deployment-expert-intro__machine-count">
        {4}
      </span>);
    assert.compareJSX(wrapper.find('.deployment-expert-intro__diagram'), expectedDiagram);
    assert.compareJSX(
      wrapper.find('.deployment-expert-intro__machine-count'),
      expectedMachineCount);
  });
});
