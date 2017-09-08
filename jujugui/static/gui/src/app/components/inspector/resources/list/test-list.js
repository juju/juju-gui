/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorResourcesList = require('./list');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('InspectorResourcesList', function() {
  let acl;

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
      <InspectorResourcesList
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
