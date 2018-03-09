/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const DeploymentDirectDeploy = require('./direct-deploy');
const GenericButton = require('../../generic-button/generic-button');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const EntityContentDescription = require('../../entity-details/content/description/description'); //eslint-disable-line max-len
const DeploymentSection = require('../section/section');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('DirectDeploy', function() {

  it('can show a message for an invalid bundle', () => {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentDirectDeploy
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        entityModel={null}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          This {'bundle'} could not be found.
          Visit the&nbsp;
          <span className="link"
            onClick={output.props.children.props.children[3].props.onClick}
            role="button"
            tabIndex="0">
            store
          </span>&nbsp;
          to find more charms and bundles.
        </div>
      </DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('can show a message for an invalid charm', () => {
    const renderer = jsTestUtils.shallowRender(
      <DeploymentDirectDeploy
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        ddData={{id: 'cs:apache-21'}}
        entityModel={null}
        generatePath={sinon.stub()}
        getDiagramURL={sinon.stub()}
        renderMarkdown={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          This {'charm'} could not be found.
          Visit the&nbsp;
          <span className="link"
            onClick={output.props.children.props.children[3].props.onClick}
            role="button"
            tabIndex="0">
            store
          </span>&nbsp;
          to find more charms and bundles.
        </div>
      </DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct deploy for a charm', () => {
    const charm = {
      toEntity: sinon.stub().returns({
        displayName: 'Apache 2',
        iconPath: 'http://example.com/icon.svg'
      })
    };
    const renderMarkdown = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <DeploymentDirectDeploy
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        ddData={{id: 'cs:apache-21'}}
        entityModel={charm}
        generatePath={sinon.stub().returns('http://example.com/')}
        getDiagramURL={sinon.stub()}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              Apache 2
            </h2>
            <EntityContentDescription
              entityModel={charm}
              renderMarkdown={renderMarkdown} />
            <ul>
              <li>
                It will run on {1}&nbsp;
                machine{''} in your cloud.
              </li>
            </ul>
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Learn more about this {'charm'}.
            </a>
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              <div className="deployment-direct-deploy__image-block">
                <img alt="Apache 2"
                  className="deployment-direct-deploy__image-block-icon"
                  src="http://example.com/icon.svg"
                  width="96" />
              </div>
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <GenericButton
                action={instance._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </GenericButton>
            </div>
          </div>
        </div>
      </DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });

  it('renders the Direct Deploy for a bundle', () => {
    const bundle = {
      toEntity: sinon.stub().returns({
        displayName: 'Kubernetes core',
        machineCount: 4
      })
    };
    const renderMarkdown = sinon.stub();
    const getDiagramURL = sinon.stub().returns('imageLink');
    const renderer = jsTestUtils.shallowRender(
      <DeploymentDirectDeploy
        addNotification={sinon.stub()}
        changeState={sinon.stub()}
        ddData={{id: 'cs:bundle/kubernetes-core-8'}}
        entityModel={bundle}
        generatePath={sinon.stub().returns('http://example.com/')}
        getDiagramURL={getDiagramURL}
        renderMarkdown={renderMarkdown} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <DeploymentSection
        instance="deployment-direct-deploy">
        <div>
          <div className="deployment-direct-deploy__description six-col">
            <h4>You are about to deploy:</h4>
            <h2 className="deployment-direct-deploy__title">
              Kubernetes core
            </h2>
            <EntityContentDescription
              entityModel={bundle}
              renderMarkdown={renderMarkdown} />
            <ul>
              <li>
                It will run on {4}&nbsp;
                machine{'s'} in your cloud.
              </li>
            </ul>
            <a className="link"
              href="http://example.com/"
              target="_blank">
              Learn more about this {'bundle'}.
            </a>
          </div>
          <div className="six-col last-col no-margin-bottom">
            <div className="deployment-direct-deploy__image">
              <EntityContentDiagram
                diagramUrl="imageLink" />
            </div>
            <div className="deployment-direct-deploy__edit-model">
              <GenericButton
                action={instance._handleClose.bind(this)}
                type="inline-neutral">
                Edit model
              </GenericButton>
            </div>
          </div>
        </div>
      </DeploymentSection>);
    expect(output).toEqualJSX(expected);
  });
});
