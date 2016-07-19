/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('DeploymentMachines', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-machines', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentMachines
        acl={acl}
        cloud={{title: 'My cloud'}} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.DeploymentSection
        completed={false}
        disabled={false}
        instance="deployment-machines"
        showCheck={false}
        title="Machines to be deployed">
        <p className="deployment-machines__message">
          These machines will be provisioned on&nbsp;
          {'My cloud'}.
          You will incur a charge from your cloud provider.
        </p>
        <ul className="deployment-machines__list">
          <li className="deployment-flow__row-header twelve-col">
            <div className="eight-col">
              Type
            </div>
            <div className="three-col">
              Provider
            </div>
            <div className="one-col last-col">
              Quantity
            </div>
          </li>
          {[<li className="deployment-flow__row twelve-col"
            key={0}>
            <div className="eight-col">
              Trusty, 1x1GHz, 1.70GB, 8.00GB
            </div>
            <div className="three-col">
              Google
            </div>
            <div className="one-col last-col">
              4
            </div>
          </li>,
          <li className="deployment-flow__row twelve-col"
            key={1}>
            <div className="eight-col">
              Trusty, 1x1GHz, 1.70GB, 8.00GB
            </div>
            <div className="three-col">
              Google
            </div>
            <div className="one-col last-col">
              4
            </div>
          </li>]}
        </ul>
      </juju.components.DeploymentSection>);
    assert.deepEqual(output, expected);
  });
});
