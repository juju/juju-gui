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

describe('InspectorRelateToEndpoint', () => {

  beforeAll(done => {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relate-to-endpoint', () => { done(); });
  });

  it('can render properly', () => {
    var endpoints = [[{
      service: '55173389$',
      name: 'db',
      type: 'mysql'
    }, {
      service: '59672078$',
      name: 'db',
      type: 'mysql'
    }]];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateToEndpoint
        backState={{}}
        changeState={changeState}
        createRelation={sinon.stub()}
        endpoints={endpoints} />);
    var expected = (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          {[<juju.components.CheckListItem
            index={0}
            key={0}
            ref="InspectorRelateToEndpoint-0"
            label="db → db"
            relation={endpoints[0]}
            changeState={changeState}
            whenChanged={output.props.children[0].props.children[0]
              .props.whenChanged} />]}
        </ul>
        <juju.components.ButtonRow
          buttons={[{
            title: 'Relate',
            type: 'neutral',
            action: output.props.children[1].props.buttons[0].action,
            disabled: true
          }]} />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render when there are no relatable endpoints', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateToEndpoint
        backState={{}}
        changeState={sinon.stub()}
        createRelation={sinon.stub()}
        endpoints={[]} />);
    var expected = (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          <li className="inspector-relate-to-endpoint__message">
            No relatable endpoints for these applications.
          </li>
        </ul>
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can handle creating a relation', () => {
    var endpoints = [[{
      service: '55173389$',
      name: 'db',
      type: 'mysql'
    }, {
      service: '59672078$',
      name: 'db',
      type: 'mysql'
    }]];
    var changeState = sinon.stub();
    var createRelation = sinon.stub();
    var backState = {back: 'state'};
    var renderer = jsTestUtils.shallowRender(
      <juju.components.InspectorRelateToEndpoint
        backState={backState}
        changeState={changeState}
        createRelation={createRelation}
        endpoints={endpoints} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    // Trigger the checkbox for the available relation
    instance.refs = {
      'InspectorRelateToEndpoint-0': {
        state: { checked: true }}};
    output.props.children[0].props.children[0].props.whenChanged();
    // Click the add relation button
    output.props.children[1].props.buttons[0].action();
    // Validate create relation.
    assert.equal(createRelation.callCount, 1);
    assert.deepEqual(createRelation.args[0][0], endpoints[0]);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], backState);
  });

});
