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

describe('SectionLoadWatcher', () => {
  let SectionLoadWatcher; // eslint-disable-line no-unused-vars
  let EmptyComponent, ErrorComponent, TestComponent;

  beforeAll(done => YUI().use('section-load-watcher', () => { done(); }));

  beforeEach(() => {
    SectionLoadWatcher = juju.components.SectionLoadWatcher;
    TestComponent = React.createClass({
      render: function() { return <div className="test"></div>; }
    });
    EmptyComponent = React.createClass({
      render: function() { return <div className="empty"></div>; }
    });
    ErrorComponent = React.createClass({
      render: function() { return <div className="error"></div>; }
    });
  });

  it('augments a child component', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher>
        <TestComponent ref="test1"/>
      </SectionLoadWatcher>, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    output.props.children[0].props.broadcastStatus('starting');
    assert.equal(instance._childrenStatuses.get('test1'), 'starting');
  });

  it('renders all child components', () => {
    const output = jsTestUtils.shallowRender(
      <SectionLoadWatcher>
        <TestComponent ref="test1"/>
        <TestComponent ref="test2"/>
      </SectionLoadWatcher>);
    assert.equal(output.props.children.length, 2);
    assert.equal(output.props.children[0].type, TestComponent);
    assert.equal(output.props.children[0].ref, 'test1');
    assert.equal(output.props.children[1].type, TestComponent);
    assert.equal(output.props.children[1].ref, 'test2');
  });

  it('renders the empty component when all children report empty', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher
        EmptyComponent={EmptyComponent}>
        <TestComponent ref="test1"/>
        <TestComponent ref="test2"/>
      </SectionLoadWatcher>, true);
    let output = renderer.getRenderOutput();
    output.props.children[0].props.broadcastStatus('empty');
    output.props.children[1].props.broadcastStatus('empty');
    // Trigger the render again
    output = renderer.getRenderOutput();
    assert.equal(output.props.children.type, EmptyComponent);
  });

  it('renders the error component when all children report an error', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher
        ErrorComponent={ErrorComponent}>
        <TestComponent ref="test1"/>
        <TestComponent ref="test2"/>
      </SectionLoadWatcher>, true);
    let output = renderer.getRenderOutput();
    output.props.children[0].props.broadcastStatus('error');
    output.props.children[1].props.broadcastStatus('error');
    // Trigger the render again
    output = renderer.getRenderOutput();
    assert.equal(output.props.children.type, ErrorComponent);
  });

  it('renders the children if not all report empty', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher>
        <TestComponent ref="test1"/>
        <TestComponent ref="test2"/>
      </SectionLoadWatcher>, true);
    let output = renderer.getRenderOutput();
    output.props.children[0].props.broadcastStatus('empty');
    // Trigger the render again
    output = renderer.getRenderOutput();
    assert.equal(output.props.children.length, 2);
    assert.equal(output.props.children[0].type, TestComponent);
    assert.equal(output.props.children[0].ref, 'test1');
    assert.equal(output.props.children[1].type, TestComponent);
    assert.equal(output.props.children[1].ref, 'test2');
  });

  it('renders the children if not all report error', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher>
        <TestComponent ref="test1"/>
        <TestComponent ref="test2"/>
      </SectionLoadWatcher>, true);
    let output = renderer.getRenderOutput();
    output.props.children[0].props.broadcastStatus('error');
    // Trigger the render again
    output = renderer.getRenderOutput();
    assert.equal(output.props.children.length, 2);
    assert.equal(output.props.children[0].type, TestComponent);
    assert.equal(output.props.children[0].ref, 'test1');
    assert.equal(output.props.children[1].type, TestComponent);
    assert.equal(output.props.children[1].ref, 'test2');
  });

  it('throws if a child tries to set an invalid status', () => {
    const renderer = jsTestUtils.shallowRender(
      <SectionLoadWatcher>
        <TestComponent ref="test1"/>
      </SectionLoadWatcher>, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    assert.throws(
      output.props.children[0].props.broadcastStatus.bind(instance, 'invalid'),
      'Invalid status: "invalid" from ref: test1');
  });

  it('throws if a child is missing a ref', () => {
    assert.throws(
      jsTestUtils.shallowRender.bind(this,
        <SectionLoadWatcher>
          <TestComponent />
        </SectionLoadWatcher>),
      'ref required but not supplied for component');
  });

});
