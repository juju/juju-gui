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
        pluralize={sinon.stub().returns('file')} />
    );
    var archiveUrl = 'https://api.jujucharms.com/charmstore/v4/trusty/django/archive';  // eslint-disable-line max-len
    var fileItems = [
      <li key="foo.zip" className="entity-files__file">
        <a href={archiveUrl + '/foo.zip'} target="_blank">
          foo.zip
        </a>
      </li>
    ];
    var expected = (
      <div className="entity-files section" id="files">
        <h3 className="section__title">
          1 file
        </h3>
        <ul className="entity-files__links">
          <li className="entity-files__link">
            <a ref="codeLink"
              target="_blank"
              href="https://code.launchpad.net/django/code">
              View code
            </a>
          </li>
          <li className="entity-files__link">
            <a target="_blank"
              href={archiveUrl}>
              Download .zip
            </a>
          </li>
        </ul>
        <ul ref="files" className="entity-files__files">
          {fileItems}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('renders for an empty/null list of files', function() {
    mockEntity.set('files', []);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityFiles
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.equal(output.refs.files.children.length, 0);
  });

  it('excludes the code link when url is not present', function() {
    mockEntity.set('code_source', null);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityFiles
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.notOk(output.refs.codeLink);
  });
});
