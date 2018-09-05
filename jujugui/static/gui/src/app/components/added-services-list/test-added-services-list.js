/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const AddedServicesList = require('./added-services-list');

describe('AddedServicesList', () => {
  let serviceModule;

  const renderComponent = (options = {}) => enzyme.shallow(
    <AddedServicesList
      changeState={options.changeState || sinon.stub()}
      hoveredId={options.hoveredId || 'mysql'}
      serviceModule={options.serviceModule || serviceModule}
      services={options.services || sinon.stub()} />
  );

  beforeEach(() => {
    serviceModule = {
      hoverService: sinon.stub(),
      panToService: sinon.stub(),
      reshape: shapeup.reshapeFunc
    };
  });

  it('generates a list of added services list items', () => {
    const allServices = [{get: () => 1}, {get: () => 2}, {get: () => 3}];
    const services = {each: cb => allServices.forEach(cb)};
    const component = renderComponent({ services });
    expect(component).toMatchSnapshot();
  });

  it('adds a label to services with bundleURL annotations', () => {
    const allServices = [{get: () => 1}, {get: key => {
      if (key === 'annotations') {
        return {bundleURL: 'elasticsearch-cluster/bundle/17'};
      }
      if (key === 'name') {
        return 'elasticsearch-cluser/bundle/17';
      }
    }}, {get: () => 3}];
    const services = {each: cb => allServices.forEach(cb)};
    const component = renderComponent({ services });
    expect(component).toMatchSnapshot();
  });
});
