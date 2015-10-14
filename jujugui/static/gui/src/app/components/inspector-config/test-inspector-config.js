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

describe('Configuration', () => {
  var service, serviceConfig, serviceId,
    charm, charmConfig;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-config', () => { done(); });
  });

  beforeEach(() => {
    serviceId = '123';
    serviceConfig = {
      foo: 'foo',
      bar: true
    };
    service = {
      get: function(what) {
        if (what === 'id') {
          return serviceId;
        } else if (what === 'config') {
          return serviceConfig;
        }
      }
    };
    charmConfig = {
      foo: {
        type: 'string',
        value: 'foo'
      },
      bar: {
        type: 'boolean',
        value: true
      }
    };
    charm = {
      get: function() {
        return charmConfig;
      }
    }
  });

  it('renders service configuration', () => {
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        service={service}
        charm={charm} />);
    assert.equal(output.props.className, 'inspector-config')
    assert.equal(output.props.children[1][0].ref, 'Config-foo')
    assert.equal(output.props.children[1][1].ref, 'Config-bar')
  });

  it('handles string changes', () => {
    // TODO
    var output = jsTestUtils.shallowRender(
      <juju.components.Configuration
        service={service}
        charm={charm} />);
    jsTestUtils.log(output.props.children)
    // TODO
  });

  it('handles boolean changes', () => {
    //TODO
  });
});
