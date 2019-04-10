/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentDirectDeploy = require('./direct-deploy');
const Button = require('../../shared/button/button');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const EntityContentDescription = require('../../entity-details/content/description/description'); //eslint-disable-line max-len

describe('DirectDeploy', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentDirectDeploy
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      ddData={options.ddData}
      entityModel={options.entityModel}
      generatePath={options.generatePath || sinon.stub()}
      getDiagramURL={options.getDiagramURL || sinon.stub()} />
  );

  it('can show a message for an invalid bundle', () => {
    const wrapper = renderComponent({
      ddData: {id: 'cs:bundle/kubernetes-core-8'}
    });
    const expected = (
      <div className="deployment-direct-deploy__content">
        This {'bundle'} could not be found.
        Visit the&nbsp;
        <span
          className="link"
          onClick={wrapper.find('.link').prop('onClick')}
          role="button"
          tabIndex="0">
          store
        </span>&nbsp;
        to find more charms and bundles.
      </div>);
    assert.compareJSX(wrapper.find('.deployment-direct-deploy__content'), expected);
  });

  it('can show a message for an invalid charm', () => {
    const wrapper = renderComponent({
      ddData: {id: 'cs:apache-21'}
    });
    const expected = (
      <div className="deployment-direct-deploy__content">
        This {'charm'} could not be found.
        Visit the&nbsp;
        <span
          className="link"
          onClick={wrapper.find('.link').prop('onClick')}
          role="button"
          tabIndex="0">
          store
        </span>&nbsp;
        to find more charms and bundles.
      </div>);
    assert.compareJSX(wrapper.find('.deployment-direct-deploy__content'), expected);
  });

  it('renders the Direct deploy for a charm', () => {
    const charm = {
      toEntity: sinon.stub().returns({
        description: 'Description',
        displayName: 'Apache 2',
        iconPath: 'http://example.com/icon.svg'
      })
    };
    const wrapper = renderComponent({
      ddData: {id: 'cs:apache-21'},
      entityModel: charm,
      generatePath: sinon.stub().returns('http://example.com/')
    });
    const expected = (
      <div className="deployment-direct-deploy__content">
        <div className="deployment-direct-deploy__description six-col">
          <h4>You are about to deploy:</h4>
          <h2 className="deployment-direct-deploy__title">
            Apache 2
          </h2>
          <EntityContentDescription
            description="Description" />
          <ul>
            <li>
              It will run on {1}&nbsp;
              machine{''} in your cloud.
            </li>
          </ul>
          <a
            className="link"
            href="http://example.com/"
            target="_blank">
            Learn more about this {'charm'}.
          </a>
        </div>
        <div className="six-col last-col no-margin-bottom">
          <div className="deployment-direct-deploy__image">
            <div className="deployment-direct-deploy__image-block">
              <img
                alt="Apache 2"
                className="deployment-direct-deploy__image-block-icon"
                src="http://example.com/icon.svg"
                width="96" />
            </div>
          </div>
          <div className="deployment-direct-deploy__edit-model">
            <Button
              action={wrapper.find('Button').prop('action')}
              type="inline-neutral">
              Edit model
            </Button>
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-direct-deploy__content'), expected);
  });

  it('renders the Direct Deploy for a bundle', () => {
    const bundle = {
      toEntity: sinon.stub().returns({
        description: 'Description',
        displayName: 'Kubernetes core',
        machineCount: 4
      })
    };
    const getDiagramURL = sinon.stub().returns('imageLink');
    const wrapper = renderComponent({
      ddData: {id: 'cs:bundle/kubernetes-core-8'},
      entityModel: bundle,
      generatePath: sinon.stub().returns('http://example.com/'),
      getDiagramURL
    });
    const expected = (
      <div className="deployment-direct-deploy__content">
        <div className="deployment-direct-deploy__description six-col">
          <h4>You are about to deploy:</h4>
          <h2 className="deployment-direct-deploy__title">
            Kubernetes core
          </h2>
          <EntityContentDescription
            description="Description" />
          <ul>
            <li>
              It will run on {4}&nbsp;
              machine{'s'} in your cloud.
            </li>
          </ul>
          <a
            className="link"
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
            <Button
              action={wrapper.find('Button').prop('action')}
              type="inline-neutral">
              Edit model
            </Button>
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.deployment-direct-deploy__content'), expected);
  });
});
