/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('InspectorRelateTo', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relate-to', function() { done(); });
  });

  it('can render properly', () => {
    var applications = [{
      getAttrs: () => ({ id: 'id', name: 'name', icon: 'icon'})
    }];
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateTo
        application={{}}
        changeState={sinon.stub()}
        relatableApplications={applications} /> );
    var expected = (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          {[<li className="inspector-view__list-item"
            data-id="id"
            key="id0"
            onClick={output.props.children.props.children[0].props.onClick}
            tabIndex="0"
            role="button">
              <img src="icon" className="inspector-view__item-icon" />
              name
          </li>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can render when there are no relatable endpoints', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateTo
        application={{}}
        changeState={sinon.stub()}
        relatableApplications={[]} /> );
    var expected = (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          <div className="unit-list__message">
            No relatable endpoints available.
          </div>
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can navigate to relate-to-endpoint', () => {
    var applications = [{
      getAttrs: () => ({ id: 'id', name: 'name', icon: 'icon'})
    }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateTo
        application={{
          get: () => 'my-id'
        }}
        changeState={changeState}
        relatableApplications={applications} /> );
    // Trigger a relation click.
    output.props.children.props.children[0].props.onClick({
      currentTarget: {
        getAttribute: sinon.stub().withArgs('data-id').returns('zee-spouse')
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'my-id',
          'relate-to': 'zee-spouse',
          activeComponent: 'relate-to'
        }}});

  });

});
