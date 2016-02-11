/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('AddedServicesList', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('added-services-list', () => { done(); });
  });

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
        <juju.components.AddedServicesList
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
          <juju.components.AddedServicesListItem
            key={allServices[0].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[0].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[0]} />
          <juju.components.AddedServicesListItem
            key={allServices[1].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[1].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[1]} />
          <juju.components.AddedServicesListItem
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
