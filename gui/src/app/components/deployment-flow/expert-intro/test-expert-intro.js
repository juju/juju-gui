/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('test/fake-analytics');
const DeploymentExpertIntro = require('./expert-intro');

describe('DeploymentExpertIntro', () => {
  let charm;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertIntro
      addNotification={options.addNotification || sinon.stub()}
      analytics={Analytics}
      changeState={options.changeState || sinon.stub()}
      ddData={options.ddData || {
        id: 'cs:apache-21'
      }}
      entityModel={options.entityModel === undefined ? {
        toEntity: sinon.stub().returns(charm)
      } : options.entityModel}
      generatePath={options.generatePath || sinon.stub()}
      getDiagramURL={options.getDiagramURL || sinon.stub()}
      staticURL={options.staticURL || '/static/url'} />
  );

  beforeEach(() => {
    charm = {
      description: 'Description',
      supportedDescription: '#### supported description',
      price: '8',
      displayName: 'Apache 2',
      iconPath: 'http://example.com/icon.svg',
      owner: 'spinach'
    };
  });

  it('can render for without an entity', () => {
    const wrapper = renderComponent({
      entityModel: null
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('can render for a charm', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
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
    expect(wrapper).toMatchSnapshot();
  });

  it('can render without a description', () => {
    delete charm.supportedDescription;
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
