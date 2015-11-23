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

describe('EntityFiles', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-files', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity(false, ['foo.zip']);
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders a list of files', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityFiles
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    var expected = (
      <div className="entity-files section" id="files">
        <h3 className="section__title">
          1 file
        </h3>
        <ul className="section__links">
          <li>
            <a target="_blank"
              className="section__actions--launchpad"
              href="https://code.launchpad.net/django/code">
              View code
            </a>
          </li>
          <li>
            <a target="_blank"
              className="section__actions--archive-url"
              href="https://api.jujucharms.com/charmstore/v4/trusty/django/archive">  // eslint-disable-line max-len
              Download .zip
            </a>
          </li>
        </ul>
        <ul className="section__list">
          <li key="foo.zip" className="section__list-item">
            foo.zip
          </li>
        </ul>
      </div>
    );
  });
});
