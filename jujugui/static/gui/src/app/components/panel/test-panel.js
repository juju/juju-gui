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

describe('PanelComponent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('panel-component', function() { done(); });
  });

  it('generates a visible panel when visible flag is provided', function() {
    var instanceName = 'custom-instance-name';

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Panel
          instanceName={instanceName}
          visible={true}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'panel-component ' + instanceName);
    assert.equal(output.props.children, undefined);
  });

  it('generates a hidden panel if visible flag is falsey', function() {
    var instanceName = 'custom-instance-name';

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Panel
          instanceName={instanceName}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(
        output.props.className, 'panel-component ' + instanceName + ' hidden');
    assert.equal(output.props.children, undefined);
  });

  it('renders provided children components', function() {
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Panel instanceName="custom-instance-name">
          <div>child</div>
        </juju.components.Panel>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children, <div>child</div>);
  });
});
