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

describe('BooleanConfig', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('boolean-config', () => { done(); });
  });

  it('renders checked boolean options', () => {
    var option = {
      key: 'foo',
      type: 'boolean',
      value: true
    }
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <juju.components.BooleanConfig
        ref='Config-foo'
        option={option}
        config={true} />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'boolean-config');
    assert.equal(
      output.props.children[1].props.children[0].props.checked,
      true);
  });

  it('renders unchecked boolean options', () => {
    var option = {
      key: 'foo',
      type: 'boolean',
      value: false
    }
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <juju.components.BooleanConfig
        ref='Config-foo'
        option={option}
        config={false} />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'boolean-config');
    assert.equal(
      output.props.children[1].props.children[0].props.checked,
      false);
  });

});
