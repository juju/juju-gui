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
    mockEntity = jsTestUtils.makeEntity(false, ['foo.zip', 'bar/foo.txt']);
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders a list of files', function() {
    var apiUrl = 'https://api.jujucharms.com/charmstore/v4';
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityFiles
        apiUrl={apiUrl}
        entityModel={mockEntity}
        pluralize={sinon.stub().returns('files')} />
    , true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var archiveUrl = `${apiUrl}/django/archive`;
    var fileItems = [
      <li key="foo.zip" className="entity-files__file">
        <a href={archiveUrl + '/foo.zip'}
          className="link"
          title="foo.zip"
          target="_blank">
          foo.zip
        </a>
      </li>,
      <li key="bar"
        className="entity-files__directory collapsed"
        tabIndex="0"
        role="button"
        onClick={instance._onDirectoryClick}>
        /bar
        <ul className="entity-files__listing">
          {[
            <li key="bar/foo.txt" className="entity-files__file">
              <a href={archiveUrl + '/bar/foo.txt'}
                className="link"
                title="foo.txt"
                target="_blank">
                foo.txt
              </a>
            </li>
          ]}
        </ul>
      </li>,
    ];
    var expected = (
      <div className="entity-files section" id="files">
        <h3 className="section__title">
          2 files
        </h3>
        <ul className="section__list">
          <li className="entity-files__link section__list-item">
            <a ref="codeLink"
              className="link"
              target="_blank"
              href="https://code.launchpad.net/django/code">
              View code
            </a>
          </li>
          <li className="entity-files__link section__list-item">
            <a target="_blank"
              className="link"
              href={archiveUrl}>
              Download .zip
            </a>
          </li>
        </ul>
        <ul ref="files" className="section__list entity-files__listing">
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
        apiUrl="http://example.com/"
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.equal(output.refs.files.children.length, 0);
  });

  it('excludes the code link when url is not present', function() {
    mockEntity.set('code_source', null);
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityFiles
        apiUrl="http://example.com/"
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.equal(output.refs.codeLink, undefined);
  });

  // Check that the links for files included in the given entity are rendered
  // with the given expected path.
  const checkFileURL = (entityType, entityId, expectedPath) => {
    mockEntity.set('entityType', entityType);
    mockEntity.set('id', entityId);
    const apiUrl = 'https://api.jujucharms.com/charmstore/v5';
    const expectedURL = apiUrl + expectedPath;
    const output = testUtils.renderIntoDocument(
      <juju.components.EntityFiles
        apiUrl={apiUrl}
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.equal(output.refs.files.children[0].children[0].href, expectedURL);
  };

  it('renders file URLs correctly for promulgated bundles', function() {
    checkFileURL('bundle', 'cs:django-42', '/django-42/archive/foo.zip');
  });

  it('renders file URLs correctly for promulgated charms', function() {
    checkFileURL(
      'charm', 'cs:xenial/wordpress', '/xenial/wordpress/archive/foo.zip');
  });

  it('renders file URLs correctly for user owned bundles', function() {
    checkFileURL(
      'bundle', 'cs:~who/bundle/django-47',
      '/~who/bundle/django-47/archive/foo.zip');
  });

  it('renders file URLs correctly for user owned charms', function() {
    checkFileURL(
      'charm', 'cs:~dalek/redis-0', '/~dalek/redis-0/archive/foo.zip');
  });

  it('properly builds a tree structure from file paths', function() {
    // Since there's recursion logic in this function, test it
    // directly for easier debugging.
    var component = new juju.components.EntityFiles();
    var files = [
      '/foo/bar/baz.zip',
      '/foo/bar/slo.tar.gz',
      '/foo/da.txt',
      '/a.txt',
      '/b.txt'
    ];
    var expectedTree = {
      'foo': {
        'bar': {
          'baz.zip': null,
          'slo.tar.gz': null
        },
        'da.txt': null
      },
      'a.txt': null,
      'b.txt': null
    };
    var actualTree = component._buildFiletree(files);
    assert.deepEqual(actualTree, expectedTree);
  });
});
