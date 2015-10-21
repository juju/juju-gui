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

describe('StringConfig', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('string-config', function() { done(); });
  });

  it('renders a string config', function() {
    var option = {
      key: 'testconfig',
      type: 'text',
      description: 'test config for strings'
    };
    var config = 'the value';
    var output = jsTestUtils.shallowRender(
      <juju.components.StringConfig
        config={config}
        option={option} />);
    assert.deepEqual(output,
      <div className="string-config">
        <span>{option.key} ({option.type})</span>
        <div
          className="string-config--value"
          contentEditable="true"
          onInput={output.props.children[1].props.onInput}
          onBlur={output.props.children[1].props.onBlur}
          dangerouslySetInnerHTML={{__html: config}}>
        </div>
        <span className="string-config--description">
          {option.description}
        </span>
      </div>);
  });

});
