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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorRelationsItem', function() {
  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relations-item', function() { done(); });
  });

  it('can render peer relations', function() {
    var relation = {
      far: {
        name: 'db',
        serviceName: 'wordpress'
      }
    };

    var renderer = jsTestUtils.shallowRender(
        <juju.components.InspectorRelationsItem
          relation={relation} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (<li className="inspector-relations-item">
      <span className="inspector-relations-item__service"
        onClick={instance._handleRelationClick}
        tabIndex="0" role="button">
        {"wordpress"}:{"db"}
      </span>
    </li>);
    assert.deepEqual(output, expected);
  });

  it('navigates to the details when it is clicked', function() {
    var changeState = sinon.stub();
    var index = 0;
    var relation = {
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
        <juju.components.InspectorRelationsItem
          changeState={changeState}
          relation={relation}
          index={index} />);
    output.props.children.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          activeComponent: 'relation',
          unit: '0'
        }}});
  });
});
