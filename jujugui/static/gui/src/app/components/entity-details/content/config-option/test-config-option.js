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

describe('EntityContentConfigOption', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-config-option', function() { done(); });
  });

  it('can render with a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string',
      default: 'abc123'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityContentConfigOption
        option={option} />);
    assert.deepEqual(output,
        <div className="entity-content__config-option">
          <dt id="charm-config-password"
              className="entity-content__config-name">
            password
          </dt>
          <dd className="entity-content__config-description">
            <p>
              <span className="entity-content__config-type">
                ({'string'})
              </span>
              {' '}
              Required password
            </p>
          </dd>
          <dd className="entity-content__config-default">
            abc123
          </dd>
        </div>);
  });

  it('can render without a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityContentConfigOption
        option={option} />);
    assert.deepEqual(output,
        <div className="entity-content__config-option">
          <dt id="charm-config-password"
              className="entity-content__config-name">
            password
          </dt>
          <dd className="entity-content__config-description">
            <p>
              <span className="entity-content__config-type">
                ({'string'})
              </span>
              {' '}
              Required password
            </p>
          </dd>
          {undefined}
        </div>);
  });
});
