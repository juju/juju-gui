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

describe('StringConfig', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('string-config', () => { done(); });
  });

  it('renders string options', () => {
    var option = {
      key: 'foo',
      type: 'number',
      value: 123
    }
    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
      <juju.components.StringConfig
        ref='Config-foo'
        option={option}
        config={123} />);
    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'string-config');
    // XXX is there a better way?
    assert.equal(
      output.props.children[1].props.dangerouslySetInnerHTML.__html,
      123);
  });
});
