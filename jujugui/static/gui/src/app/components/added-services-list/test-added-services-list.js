/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const AddedServicesList = require('./added-services-list');
const AddedServicesListItem = require('./item/item');

describe('AddedServicesList', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <AddedServicesList
      changeState={options.changeState || sinon.stub()}
      findRelatedServices={options.findRelatedServices || sinon.stub()}
      findUnrelatedServices={options.findUnrelatedServices || sinon.stub()}
      getUnitStatusCounts={options.getUnitStatusCounts || sinon.stub()}
      hoveredId={options.hoveredId || 'mysql'}
      hoverService={options.hoverService || sinon.stub()}
      panToService={options.panToService || sinon.stub()}
      services={options.services || sinon.stub()}
      updateUnitFlags={options.updateUnitFlags || sinon.stub()} />
  );

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
            getUnitStatusCounts={instance.props.getUnitStatusCounts}
            hovered={false}
            hoverService={instance.props.hoverService}
            key={allServices[0].get()}
            panToService={instance.props.panToService}
            ref={'AddedServicesListItem-' + allServices[0].get()}
            service={allServices[0]} />
          <AddedServicesListItem
            changeState={instance.props.changeState}
            getUnitStatusCounts={instance.props.getUnitStatusCounts}
            hovered={false}
            hoverService={instance.props.hoverService}
            key={allServices[1].get()}
            panToService={instance.props.panToService}
            ref={'AddedServicesListItem-' + allServices[1].get()}
            service={allServices[1]} />
          <AddedServicesListItem
            changeState={instance.props.changeState}
            getUnitStatusCounts={instance.props.getUnitStatusCounts}
            hovered={false}
            hoverService={instance.props.hoverService}
            key={allServices[2].get()}
            panToService={instance.props.panToService}
            ref={'AddedServicesListItem-' + allServices[2].get()}
            service={allServices[2]} />
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
