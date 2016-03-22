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

describe('DeploymentPanelFooter', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-panel-footer', function() { done(); });
  });

  it('can render', function() {
    var buttons = [];
    var output = jsTestUtils.shallowRender(
      <juju.components.DeploymentPanelFooter
        buttons={buttons} />);
    var expected = (
      <div className="deployment-panel__footer">
        <div className="twelve-col no-margin-bottom">
          <div className="inner-wrapper">
            <juju.components.ButtonRow
              buttons={buttons} />
          </div>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });
});
