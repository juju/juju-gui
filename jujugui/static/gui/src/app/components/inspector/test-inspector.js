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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Inspector', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-component', function() { done(); });
  });

  it('renders provided children components', function() {
    var service = {
      get: function() {
        return {name: 'demo'};
      }};
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          service={service}>
          <div>child</div>
        </juju.components.Inspector>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[1],
        <div className="inspector-content">
          <div>child</div>
        </div>);
  });

  it('calls the changeState callable when on header click', function() {
    var service = {
      get: function() {
        return {name: 'demo'};
      }};
    var changeStub = sinon.stub();
    var component = testUtils.renderIntoDocument(
        <juju.components.Inspector
          changeState={changeStub}
          service={service} />);
    var header = testUtils.scryRenderedComponentsWithType(
        component, juju.components.InspectorHeader);
    testUtils.Simulate.click(header[0].getDOMNode());
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'services'
      }
    });
  });
});
