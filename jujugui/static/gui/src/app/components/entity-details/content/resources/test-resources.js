/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityResources = require('./resources');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityResources', function() {

  it('can display an empty list', function() {
    const renderer = jsTestUtils.shallowRender(
      <EntityResources
        apiUrl='/api'
        entityId='cs:foo-0'
        pluralize={sinon.stub()}
        resource={[]} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display a list of resources', function() {
    const resources = [{
      Description: 'file1 desc',
      Name: 'file1',
      Type: 'file',
      Path: 'file1.zip',
      Revision: 5
    }, {
      Description: 'file2 desc',
      Name: 'file2',
      Type: 'file',
      Path: 'file2',
      Revision: 2
    }, {
      Description: 'file3 desc',
      Name: 'file3',
      Type: 'file',
      Path: 'file3.tar'
    }];
    const renderer = jsTestUtils.shallowRender(
      <EntityResources
        apiUrl='/api'
        entityId='cs:foo-0'
        pluralize={sinon.stub().returns('resources')}
        resources={resources} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        <div className="entity-resources section" id="files">
          <h3 className="section__title">
            {3}&nbsp;{'resources'}
          </h3>
          <ul className="section__list entity-files__listing">
            <li className="entity-files__file"
              key="file10">
              <a href="/api/foo-0/resource/file1/5" title="Download file1">
                {'file1'} {'(.zip)'}
              </a>
            </li>
            <li className="entity-files__file"
              key="file21">
              <a href="/api/foo-0/resource/file2/2" title="Download file2">
                {'file2'} {''}
              </a>
            </li>
            <li className="entity-files__file"
              key="file32">
              <span>
                {'file3'} {'(.tar)'}
              </span>
            </li>
          </ul>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });
});
