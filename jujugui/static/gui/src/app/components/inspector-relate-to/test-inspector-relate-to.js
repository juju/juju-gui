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

describe('InspectorExpose', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-relate-to', function() { done(); });
  });

  it('can render correctly if not exposed', function() {
    var getStub = sinon.stub();
    getStub.withArgs('id').returns('demo');
    getStub.withArgs('exposed').returns(false);
    var service = {get: getStub};
    var toggle = {key: 'expose-toggle'};
    var output = jsTestUtils.shallowRender(
        <juju.components.InspectorExpose
          service={service} />);
    var toggleItem = output.props.children[0].props.children;
    assert.deepEqual(output,
        <div className="inspector-expose">
            <div className="inspector-expose__control">
              <juju.components.BooleanConfig
                key={toggle.key}
                ref={toggle.key}
                option={toggle}
                onChange={toggleItem.props.onChange}
                label="Expose service"
                config={false} />
            </div>
            <p className="inspector-expose__warning">
              Exposing this service may make it publicly accessible from
              the web
            </p>
            {undefined}
        </div>);
  });
});
