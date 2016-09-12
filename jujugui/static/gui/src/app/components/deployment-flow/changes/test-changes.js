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

describe('DeploymentChanges', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-changes', function() { done(); });
  });

  it('can render', function() {
    const changes = [
      {id: 'change1'},
      {id: 'change2'}
    ];
    var renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentChanges
        changes={{one: 1, two: 2}}
        generateAllChangeDescriptions={sinon.stub().returns(changes)} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
        classes={{'twelve-col': true}}
        clickable={true}>
        <div>
          Show changes ({2})
          &rsaquo;
        </div>
        <ul className="deployment-changes">
          {[<juju.components.DeploymentChangeItem
            change={changes[0]}
            key={changes[0].id}
            showTime={false} />,
            <juju.components.DeploymentChangeItem
              change={changes[1]}
              key={changes[1].id}
              showTime={false} />]}
        </ul>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });
});
