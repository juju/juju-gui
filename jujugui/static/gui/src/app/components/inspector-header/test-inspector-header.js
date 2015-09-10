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
var renderIntoDocument = testUtils.renderIntoDocument;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

function queryComponentSelector(component, selector, all) {
  var queryFn = (all) ? 'querySelectorAll' : 'querySelector';
  return component.getDOMNode()[queryFn](selector);
}

describe('InspectorHeader', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-header', function() { done(); });
  });

  it('displays the provided title', function() {
    var component = renderIntoDocument(
        <juju.components.InspectorHeader
          title="Juju GUI" />);
    assert.equal(
        queryComponentSelector(
          component, '.inspector-header__title').innerText, 'Juju GUI');
  });

  it('adds a class based on the provided type', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.InspectorHeader
          type="error" />);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className,
      'inspector-header inspector-header--type-error');
  });

  it('does not add a type class if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.InspectorHeader />);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'inspector-header');
  });

  it('displays the provided count', function() {
    var component = renderIntoDocument(
        <juju.components.InspectorHeader
          count="4" />);
    assert.equal(
        queryComponentSelector(
          component, '.inspector-header__count').innerText, '4');
  });

  it('hides the count if it is not provided', function() {
    var component = renderIntoDocument(
        <juju.components.InspectorHeader />);
    assert.isTrue(
        queryComponentSelector(
          component, '.inspector-header__count').classList.contains('hidden'));
  });

  it('fires a callback when clicked', function() {
    var callbackStub = sinon.stub();
    var component = renderIntoDocument(
        <juju.components.InspectorHeader
          backCallback={callbackStub} />);
    testUtils.Simulate.click(component.getDOMNode());
    assert.equal(callbackStub.callCount, 1);
  });
});
