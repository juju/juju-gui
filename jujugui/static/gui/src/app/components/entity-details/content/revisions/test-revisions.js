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

describe('EntityContentRevisions', function() {
  let mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content-revisions', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can render the number of revisions', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContentRevisions
        revisions={mockEntity.get('revisions')} />);
    const expectedOutput = (
      <div className="revisions section" id="revisions">
        <h3 className="section__title">{3} Revisions</h3>
      </div>);
    assert.deepEqual(output, expectedOutput);
  });
});
