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

describe('InspectorResourcesList', function() {
  let acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('inspector-resources-list', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display a list of resources', function() {
    const resources = [{
      Description: 'file1 desc',
      Name: 'file1',
      Path: 'file1.zip',
      Revision: 5
    }, {
      Description: 'file2 desc',
      Name: 'file2',
      Path: 'file2',
      Revision: 2
    }];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.InspectorResourcesList
        acl={acl}
        resources={resources} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="inspector-resources-list">
        <ul className="inspector-resources-list__list">
          <li className="inspector-resources-list__resource"
            key="file10">
              <p>file1</p>
              <p>file1 desc</p>
          </li>
          <li className="inspector-resources-list__resource"
            key="file21">
              <p>file2</p>
              <p>file2 desc</p>
          </li>
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });
});
