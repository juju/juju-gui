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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

describe('AddedServicesList', function() {
  var listItemStub;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('added-services-list', function() { done(); });
  });

  it('generates a list of added services list items', function() {
    var services = [{get: () => 1}, {get: () => 2}, {get: () => 3}];
    var changeState = 'changeStateCallable';

    var shallowRenderer = testUtils.createRenderer();
    var getUnitStatusCounts = sinon.stub();
    shallowRenderer.render(
        <juju.components.AddedServicesList
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts}
          services={services}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children,
      <ul className="added-services-list inspector-view__list">
        <juju.components.AddedServicesListItem
          key={services[0].get()}
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts}
          service={services[0]} />
        <juju.components.AddedServicesListItem
          key={services[1].get()}
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts}
          service={services[1]} />
        <juju.components.AddedServicesListItem
          key={services[2].get()}
          changeState={changeState}
          getUnitStatusCounts={getUnitStatusCounts}
          service={services[2]} />
      </ul>);
  });
});
