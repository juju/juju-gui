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
          setMVVisibility={sinon.stub()}
          changeState={changeState}
          hoverService={hoverService}
          hoveredId="mysql"
          getUnitStatusCounts={getUnitStatusCounts}
          panToService={panToService}
          services={services}/>, true);

    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();

    var expected = (
      <div className="inspector-view">
        <ul className="added-services-list inspector-view__list">
          <juju.components.AddedServicesListItem
            key={allServices[0].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            focusService={instance.focusService}
            unfocusService={instance.unfocusService}
            fadeService={instance.fadeService}
            unfadeService={instance.unfadeService}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[0].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[0]} />
          <juju.components.AddedServicesListItem
            key={allServices[1].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            focusService={instance.focusService}
            unfocusService={instance.unfocusService}
            fadeService={instance.fadeService}
            unfadeService={instance.unfadeService}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[1].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[1]} />
          <juju.components.AddedServicesListItem
            key={allServices[2].get()}
            changeState={changeState}
            getUnitStatusCounts={getUnitStatusCounts}
            focusService={instance.focusService}
            unfocusService={instance.unfocusService}
            fadeService={instance.fadeService}
            unfadeService={instance.unfadeService}
            hovered={false}
            ref={'AddedServicesListItem-' + allServices[2].get()}
            hoverService={hoverService}
            panToService={panToService}
            service={allServices[2]} />
        </ul>
      </div>);

    assert.deepEqual(output, expected);
  });

  function createModelList(models){
    return {
      each: (cb) => {
        models.forEach(cb);
      },
      getById: (id) => {
        var model;
        models.some((m) => {
          if (m.get('id') === id) {
            model = m;
            return true;
          }
        });
        return model;
      }
    };
  }

  it('performs the necessary work to focus a service', () => {
    var id = 'trusty/wordpress';
    var makeModel = jsTestUtils.makeModel;
    var allServices = [
      makeModel({id: id, fade: true, highlight: false}),
      makeModel({id: 'trusty/apache', fade: false, highlight: true}),
      makeModel({id: 'trusty/mysql', fade: false, highlight: false})
    ];
    var services = createModelList(allServices);
    var updateUnitFlags = sinon.stub();
    var findRelatedServices = sinon.stub();
    var relatedModelStub = sinon.stub();
    findRelatedServices.returns({
      each: (cb) => {
        cb({set: relatedModelStub});
      }
    });
    var findUnRelatedServices = sinon.stub();
    var unRelatedModelStub = sinon.stub();
    findUnRelatedServices.returns({
      each: (cb) => {
        cb({set: unRelatedModelStub});
      }
    });
    var setMVVisibility = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.AddedServicesList
          updateUnitFlags={updateUnitFlags}
          findRelatedServices={findRelatedServices}
          findUnrelatedServices={findUnRelatedServices}
          setMVVisibility={setMVVisibility}
          changeState={sinon.stub()}
          getUnitStatusCounts={sinon.stub()}
          services={services}/>, true);

    var instance = renderer.getMountedInstance();
    var unfadeService = sinon.spy(instance, 'unfadeService');
    // Because shallowRenderer doesn't support refs this fakes a refs property
    // on the instance which is needed for the final step in the focus process.
    function generateListItem() {
      return {props: {service: jsTestUtils.makeModel()}};
    }
    instance.refs = {
      'AddedServicesListItem-trusty/wordpress': generateListItem(),
      'AddedServicesListItem-trusty/apache': generateListItem(),
      'AddedServicesListItem-trusty/mysql': generateListItem()
    };
    // Call the focus method that was passed down into the list item.
    instance.focusService(id);
    // The service should unfade.
    assert.isTrue(unfadeService.calledWith(id));
    // It needs to update the unit flags on the service
    var focusedService = allServices[0];
    assert.equal(updateUnitFlags.callCount, 1);
    assert.deepEqual(updateUnitFlags.args[0], [
      focusedService,
      'highlight'
    ]);
    // We need to fetch the related and unrelated services and then set
    // the appropriate hide value.
    assert.equal(relatedModelStub.callCount, 1);
    assert.deepEqual(relatedModelStub.args[0], ['hide', false]);
    assert.equal(unRelatedModelStub.callCount, 1);
    assert.deepEqual(unRelatedModelStub.args[0], ['hide', true]);
    // Set the focus indicator on all other service models except the one that
    // the user had clicked on.
    // In this test the user clicked on 'wordpress' so the others need to be
    // set to false
    assert.equal(focusedService.get('highlight'), true);
    assert.equal(focusedService.get('fade'), false);
    assert.equal(allServices[1].get('highlight'), false);
    // It then has to set the proper values for the machine view visibility.
    assert.equal(setMVVisibility.callCount, 1);
  });

  it('performs the necessary work to unfocus a service', () => {
    var allServices = [
      jsTestUtils.makeModel({id: 'trusty/wordpress'}),
      jsTestUtils.makeModel({id: 'trusty/apache'}),
      jsTestUtils.makeModel({id: 'trusty/mysql'})
    ];
    var services = createModelList(allServices);
    var updateUnitFlags = sinon.stub();
    var findRelatedServices = sinon.stub();
    var relatedModelStub = sinon.stub();
    findRelatedServices.returns({
      each: (cb) => {
        cb({set: relatedModelStub});
      }
    });
    var findUnRelatedServices = sinon.stub();
    var unRelatedModelStub = sinon.stub();
    findUnRelatedServices.returns({
      each: (cb) => {
        cb({set: unRelatedModelStub});
      }
    });
    var setMVVisibility = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.AddedServicesList
          updateUnitFlags={updateUnitFlags}
          findRelatedServices={findRelatedServices}
          findUnrelatedServices={findUnRelatedServices}
          setMVVisibility={setMVVisibility}
          changeState={sinon.stub()}
          getUnitStatusCounts={sinon.stub()}
          services={services}/>, true);

    var instance = renderer.getMountedInstance();
    // Call the unfocus method that was passed down into the list item.
    instance.unfocusService('trusty/wordpress');
    // Check that the service highlight was set to false
    var unfocusedService = allServices[0];
    assert.equal(unfocusedService.get('highlight'), false);
    // It needs to update the unit flags on the service
    assert.equal(updateUnitFlags.callCount, 1);
    assert.deepEqual(updateUnitFlags.args[0], [
      unfocusedService,
      'highlight'
    ]);
    // We need to fetch the unrelated services and then set
    // the appropriate hide value.
    assert.equal(unRelatedModelStub.callCount, 1);
    assert.deepEqual(unRelatedModelStub.args[0], ['hide', false]);
    // It then has to set the proper values for the machine view visibility.
    assert.equal(setMVVisibility.callCount, 1);
  });

  it('performs the necessary work to fade a service', () => {
    var id = 'trusty/wordpress';
    var allServices = [
      jsTestUtils.makeModel({id: id, highlight: true, fade: false}),
      jsTestUtils.makeModel({id: 'trusty/apache'}),
      jsTestUtils.makeModel({id: 'trusty/mysql'})
    ];
    var services = createModelList(allServices);
    var renderer = jsTestUtils.shallowRender(
        <juju.components.AddedServicesList
          updateUnitFlags={sinon.stub()}
          findRelatedServices={sinon.stub()}
          findUnrelatedServices={sinon.stub()}
          setMVVisibility={sinon.stub()}
          changeState={sinon.stub()}
          getUnitStatusCounts={sinon.stub()}
          services={services}/>, true);

    var instance = renderer.getMountedInstance();
    var unfocusService = sinon.stub(instance, 'unfocusService');
    instance.fadeService(id);
    // Set the fade switch appropriately.
    assert.equal(allServices[0].get('fade'), true);
    // Unfocused the service.
    assert.isTrue(unfocusService.calledWith(id));
  });

  it('performs the necessary work to unfade a service', () => {
    var id = 'trusty/wordpress';
    var allServices = [
      jsTestUtils.makeModel({id: id, highlight: false, fade: true}),
      jsTestUtils.makeModel({id: 'trusty/apache'}),
      jsTestUtils.makeModel({id: 'trusty/mysql'})
    ];
    var services = createModelList(allServices);
    var renderer = jsTestUtils.shallowRender(
        <juju.components.AddedServicesList
          updateUnitFlags={sinon.stub()}
          findRelatedServices={sinon.stub()}
          findUnrelatedServices={sinon.stub()}
          setMVVisibility={sinon.stub()}
          changeState={sinon.stub()}
          getUnitStatusCounts={sinon.stub()}
          services={services}/>, true);

    var instance = renderer.getMountedInstance();
    instance.unfadeService(id);
    // Set the fade switch appropriately.
    assert.equal(allServices[0].get('fade'), false);
  });
});
