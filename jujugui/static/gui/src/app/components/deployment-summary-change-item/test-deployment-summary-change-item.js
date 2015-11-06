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

describe('DeploymentSummaryChangeItem', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-summary-change-item', function() { done(); });
  });

  it('can display a sprite icon', function() {
    var change = {
      icon: 'my-icon',
      description: 'Django was added',
      time: '10:12 am'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummaryChangeItem
        change={change} />);
    assert.deepEqual(output,
      <li className="deployment-summary-change-item">
        <span className="deployment-summary-change-item__change">
          <span className="deployment-summary-change-item__icon">
            <i className="sprite my-icon"></i>
          </span>
          Django was added
        </span>
        <span className="deployment-summary-change-item__time">
          {change.time}
        </span>
      </li>);
  });

  it('can display an svg icon', function() {
    var change = {
      icon: 'my-icon.svg',
      description: 'Django was added',
      time: '10:12 am'
    };
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentSummaryChangeItem
        change={change} />);
    assert.deepEqual(output,
      <li className="deployment-summary-change-item">
        <span className="deployment-summary-change-item__change">
          <img src="my-icon.svg" alt=""
            className="deployment-summary-change-item__icon" />
          Django was added
        </span>
        <span className="deployment-summary-change-item__time">
          {change.time}
        </span>
      </li>);
  });
});
