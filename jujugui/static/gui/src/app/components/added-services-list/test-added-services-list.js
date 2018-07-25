/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');
const shapeup = require('shapeup');

const AddedServicesList = require('./added-services-list');
const AddedServicesListItem = require('./item/item');

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
    var allServices = [{get: () => 1}, {get: () => 2}, {get: () => 3}];
    var services = {
      each: cb => {
        allServices.forEach(cb);
      }
    };
    const wrapper = renderComponent({ services });
    const instance = wrapper.instance();
    const expected = (
      <div className="inspector-view">
        <ul className="added-services-list inspector-view__list">
          <AddedServicesListItem
            changeState={instance.props.changeState}
            hovered={false}
            key={allServices[0].get()}
            ref={'AddedServicesListItem-' + allServices[0].get()}
            service={allServices[0]}
            serviceModule={serviceModule} />
          <AddedServicesListItem
            changeState={instance.props.changeState}
            hovered={false}
            key={allServices[1].get()}
            ref={'AddedServicesListItem-' + allServices[1].get()}
            service={allServices[1]}
            serviceModule={serviceModule} />
          <AddedServicesListItem
            changeState={instance.props.changeState}
            hovered={false}
            key={allServices[2].get()}
            ref={'AddedServicesListItem-' + allServices[2].get()}
            service={allServices[2]}
            serviceModule={serviceModule} />
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
