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

describe('OverviewAction', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('overview-action', function() { done(); });
  });

  it('fires a callback when clicked', function() {
    var callbackStub = sinon.stub();
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          callback={callbackStub} />);
    testUtils.Simulate.click(component.getDOMNode());
    assert.equal(callbackStub.callCount, 1);
  });

  it('displays the provided title', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          title="My action" />);
    assert.equal(
        queryComponentSelector(
          component, '.overview-action__title').innerText, 'My action');
  });

  it('sets the provided icon', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          icon="<svg>Icon</svg>" />);
    assert.equal(
        queryComponentSelector(
          component, '.overview-action__icon').innerHTML, '<svg>Icon</svg>');
  });

  it('sets the link', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          link="http://jujucharms.com/"
          linkTitle="Juju Charms" />);
    var link = queryComponentSelector(component, '.overview-action__link');
    assert.equal(link.href, 'http://jujucharms.com/');
    assert.equal(link.innerText, 'Juju Charms');
  });

  it('hides the link if it is not provided', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction />);
    assert.isTrue(
        queryComponentSelector(
          component, '.overview-action__link').classList.contains('hidden'));
  });

  it('sets the value', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          value="5" />);
    assert.equal(
        queryComponentSelector(
          component, '.overview-action__value').innerText, '5');
  });

  it('sets the value type class', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction
          value="5"
          valueType="pending" />);

    assert.isTrue(
        queryComponentSelector(
          component, '.overview-action__value').classList.contains(
            'overview-action__value--type-pending'));
  });

  it('hides the value if it is not provided', function() {
    var component = renderIntoDocument(
        <juju.components.OverviewAction />);
    assert.isTrue(
        queryComponentSelector(
          component, '.overview-action__value').classList.contains('hidden'));
  });
});
