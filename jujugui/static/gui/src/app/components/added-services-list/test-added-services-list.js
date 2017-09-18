/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const AddedServicesList = require('./added-services-list');
const AddedServicesListItem = require('./item/item');

const jsTestUtils = require('../../utils/component-test-utils');

describe('AddedServicesList', () => {

  it('generates a list of added services list items', () => {
    var allServices = [{get: () => 1}, {get: () => 2}, {get: () => 3}];
    var services = {
      each: (cb) => {
        allServices.forEach(cb);
      }
    };

    var changeState = sinon.stub();
    var getUnitStatusCounts = sinon.stub();
    var hoverService = sinon.stub();
    var panToService = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <AddedServicesList
        updateUnitFlags={sinon.stub()}
        findRelatedServices={sinon.stub()}
        findUnrelatedServices={sinon.stub()}
        changeState={changeState}
        hoverService={hoverService}
        hoveredId="mysql"
        getUnitStatusCounts={getUnitStatusCounts}
        panToService={panToService}
        services={services}/>, true);

    var output = renderer.getRenderOutput();

    var expected = (
      <div className="inspector-view">
        <ul className="added-services-list inspector-view__list">
          <AddedServicesListItem
            key={allServices[0].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[0].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[0]} />
          <AddedServicesListItem
            key={allServices[1].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[1].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[1]} />
          <AddedServicesListItem
            key={allServices[2].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[2].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[2]} />
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });
});
