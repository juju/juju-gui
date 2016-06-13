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
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('OverviewAction', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('overview-action', function() { done(); });
  });

  it('calls the callable provided when clicked', function() {
    var callbackStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={callbackStub}
          title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    output.props.onClick();
    assert.equal(callbackStub.callCount, 1);
  });

  it('displays the provided title', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={sinon.stub()}
          title="My action" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[1].props.children, 'My action');
  });

  it('sets the provided icon', function() {
    var output = jsTestUtils.shallowRender(
        <juju.components.OverviewAction
          action={sinon.stub()}
          icon="action-icon"
          title="spinach" />);
    assert.deepEqual(output.props.children[0],
        <span className="overview-action__icon">
          <juju.components.SvgIcon name="action-icon"
            size="16" />
        </span>);
  });

  it('sets the link', function() {
    var linkAction = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.OverviewAction
          action={sinon.stub()}
          linkAction={linkAction}
          linkTitle="Juju Charms"
          title="spinach" />);
    var link = output.props.children[2];
    assert.deepEqual(link,
        <span className="overview-action__link"
          onClick={link.props.onClick}>
          Juju Charms
        </span>);
  });

  it('calls the supplied action when the link is clicked', function() {
    var linkAction = sinon.stub();
    var stopPropagation = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.OverviewAction
          action={sinon.stub()}
          linkAction={linkAction}
          linkTitle="Juju Charms"
          title="spinach" />);
    output.props.children[2].props.onClick({
      stopPropagation: stopPropagation
    });
    assert.equal(linkAction.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
  });

  it('hides the link if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={sinon.stub()}
          title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[2].props.className.indexOf(
        'hidden') > -1);
  });

  it('sets the value', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={sinon.stub()}
          title="spinach"
          value="5" />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.children[3].props.children, '5');
  });

  it('sets the value type class', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={sinon.stub()}
          title="spinach"
          value="5"
          valueType="pending" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[3].props.className.indexOf(
        'overview-action__value--type-pending') > -1);
  });

  it('hides the value if it is not provided', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.OverviewAction
          action={sinon.stub()}
          title="spinach" />);
    var output = shallowRenderer.getRenderOutput();
    assert.isTrue(output.props.children[3].props.className.indexOf(
        'hidden') > -1);
  });
});
