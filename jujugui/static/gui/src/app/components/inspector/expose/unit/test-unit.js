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

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('InspectorExposeUnit', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-expose-unit', function() { done(); });
  });

  it('can render the unit', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1',
      portRanges: [{
        from: 9000, to: 10000, protocol: 'udp', single: false
      }, {
        from: 443, to: 443, protocol: 'tcp', single: true
      }, {
        from: 8080, to: 8080, protocol: 'tcp', single: true
      }],
      public_address: '20.20.20.199'
    };
    var action = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.InspectorExposeUnit
          action={action}
          unit={unit} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className="inspector-expose__unit" tabIndex="0" role="button"
        data-id="django/1"
        onClick={action}>
          <div className="inspector-expose__unit-detail">
              django/1
          </div>
          <ul className="inspector-expose__unit-list">
            <li className="inspector-expose__item"
              key="20.20.20.199:9000-10000/udp">
              <span>{'20.20.20.199:9000-10000/udp'}</span>
            </li>
            <li className="inspector-expose__item"
              key="https://20.20.20.199:443">
              <a href="https://20.20.20.199:443"
                onClick={instance._stopBubble}
                target="_blank">
                {'20.20.20.199:443'}
              </a>
            </li>
            <li className="inspector-expose__item"
              key="http://20.20.20.199:8080">
              <a href="http://20.20.20.199:8080"
                onClick={instance._stopBubble}
                target="_blank">
                {'20.20.20.199:8080'}
              </a>
            </li>
          </ul>
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can render the unit without a public address', function() {
    var unit = {
      id: 'django/1',
      displayName: 'django/1'
    };
    var action = sinon.stub();
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorExposeUnit
          action={action}
          unit={unit} />);
    var expected = (
      <li className="inspector-expose__unit"
        tabIndex="0"
        role="button"
        data-id="django/1"
        onClick={action}>
          <div className="inspector-expose__unit-detail">
              django/1
          </div>
          <div className="inspector-expose__unit-detail">
              No public address
          </div>
      </li>);
    assert.deepEqual(output, expected);
  });
});
