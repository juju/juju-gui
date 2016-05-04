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

describe('InspectorRelationDetails', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relation-details', function() { done(); });
  });

  it('shows the relation properties', function() {
    var fakeRelation = {
      near: {
        name: 'pgsql',
        role: 'primary'
      },
      far: {
        name: 'django',
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelationDetails
        relation={fakeRelation} />);
    var expected = (<div className='inspector-relation-details__properties'>
      <p className='inspector-relation-details__property'>
        Interface: {fakeRelation.interface}
      </p>
      <p className='inspector-relation-details__property'>
        Name: {fakeRelation.near.name}
      </p>
      <p className='inspector-relation-details__property'>
        Role: {fakeRelation.near.role}
      </p>
      <p className='inspector-relation-details__property'>
        Scope: {fakeRelation.scope}
      </p>
    </div>);
    assert.deepEqual(output.props.children, expected);
  });
});
