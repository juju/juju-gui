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

  it('displays the service overview for the "inspector" state', function() {
    var service = {
      get: function() {
        return {name: 'demo'};
      }};
    var getAppState = function() {
        return 'inspector';
      };
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          service={service}
          getAppState={getAppState}>
        </juju.components.Inspector>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children[1].props.children.type.displayName,
        'ServiceOverview');
  });

  it('passes changeState callable to header component', function() {
    var service = {
      get: function() {
        return {name: 'demo'};
      }};
    var getAppState = sinon.stub();
    var changeStub = sinon.stub();
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Inspector
          changeState={changeStub}
          getAppState={getAppState}
          service={service} />);
    var output = shallowRenderer.getRenderOutput();
    output.props.children[0].props.backCallback();
    assert.equal(changeStub.callCount, 1);
    assert.deepEqual(changeStub.args[0][0], {
      sectionA: {
        component: 'services'
      }
    });
  });
});
