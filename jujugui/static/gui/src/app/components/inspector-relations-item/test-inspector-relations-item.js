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

  it('can render the relation', function() {
    var relation = {
      near: {
        name: 'pgsql',
        role: 'primary'
      },
      far: {
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelationsItem
          relation={relation} />);
    assert.deepEqual(output,
      <li className="inspector-relations-item">
        <span className="inspector-relations-item__service"
          role="button" tabIndex="0"
          onClick={output.props.children[0].props.onClick}>
          <span className="inspector-relations-item__status">
            <juju.components.SvgIcon name="unit-running"
              size="16" />
          </span>
          django
        </span>
        <span className="inspector-relations-item__details">
          <p className="inspector-relations-item__property">
            Interface: {"postgresql"}
          </p>
          <p className="inspector-relations-item__property">
            Name: {"pgsql"}
          </p>
          <p className="inspector-relations-item__property">
            Role: {"primary"}
          </p>
          <p className="inspector-relations-item__property">
            Scope: {"global"}
          </p>
        </span>
      </li>);
  });

  it('navigates to the service when it is clicked', function() {
    var changeState = sinon.stub();
    var relation = {
      near: {
        name: 'pgsql',
        role: 'primary'
      },
      far: {
        service: 'django',
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorRelationsItem
          changeState={changeState}
          relation={relation} />);
    output.props.children[0].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionA: {
        component: 'inspector',
        metadata: {
          id: 'django',
          activeComponent: undefined
        }}});
  });
});
