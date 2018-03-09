/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityFiles = require('./files');

const jsTestUtils = require('../../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('EntityFiles', function() {
  var mockEntity;

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity(
      false, {files: ['foo.zip', 'bar/foo.txt']});
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('renders a list of files', function() {
    var apiUrl = 'https://api.jujucharms.com/charmstore/v4';
    var renderer = jsTestUtils.shallowRender(
      <EntityFiles
        apiUrl={apiUrl}
        entityModel={mockEntity}
        pluralize={sinon.stub().returns('files')} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    var archiveUrl = `${apiUrl}/django/archive`;
    var fileItems = [
      <li className="p-list-tree__item" key="foo.zip">
        <a className="link"
          href={archiveUrl + '/foo.zip'}
          target="_blank"
          title="foo.zip">
          foo.zip
        </a>
      </li>,
      <li className="p-list-tree__item p-list-tree__item--group" key="/bar"
        tabIndex="0" title="/bar">
        <button aria-controls="/bar" aria-expanded="false"
          className="p-list-tree__toggle"
          id="/bar-toggle"
          onClick={instance._onDirectoryClick}
          role="tab">/bar</button>
        <ul aria-hidden="true" aria-labelledby="/bar-toggle"
          className="p-list-tree" id="/bar" role="tabpanel">
          {[
            <li className="p-list-tree__item" key="foo.txt">
              <a className="link"
                href={archiveUrl + '/bar/foo.txt'}
                target="_blank"
                title="foo.txt">
                foo.txt
              </a>
            </li>
          ]}
        </ul>
      </li>
    ];
    var expected = (
      <div className="entity-files section" id="files">
        <h3 className="section__title">
          files
        </h3>
        <ul aria-multiselectable="true" className="p-list-tree"
          ref="files"
          role="tablist">
          {fileItems}
        </ul>
        <ul className="section__list">
          <li className="section__list-item">
            <a className="button--inline-neutral entity-files__link"
              href="https://code.launchpad.net/django/code"
              ref="codeLink"
              target="_blank">
              View code
            </a>
          </li>
          <li className="section__list-item">
            <a className="button--inline-neutral entity-files__link"
              href={archiveUrl}
              target="_blank">
              Download .zip
            </a>
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders for an empty/null list of files', function() {
    mockEntity.set('files', []);
    var output = testUtils.renderIntoDocument(
      <EntityFiles
        apiUrl="http://example.com/"
        entityModel={mockEntity}
        pluralize={sinon.spy()} />
    );
    assert.equal(output.refs.files.children.length, 0);
  });

  it('excludes the code link when url is not present', function() {
    mockEntity.set('code_source', null);
    var output = testUtils.renderIntoDocument(
      <EntityFiles
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
      <EntityFiles
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
    var component = new EntityFiles();
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
