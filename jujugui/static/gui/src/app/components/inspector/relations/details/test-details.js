/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorRelationDetails = require('./details');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('InspectorRelationDetails', function() {

  it('shows the relation properties', function() {
    var fakeRelation = {
      near: {
        name: 'pgsql',
        role: 'primary'
      },
      far: {
        name: 'django',
        serviceName: 'django'
      },
      interface: 'postgresql',
      scope: 'global'
    };
    var output = jsTestUtils.shallowRender(
      <InspectorRelationDetails
        relation={fakeRelation} />);
    var expected = (<div className='inspector-relation-details__properties'>
      <p className='inspector-relation-details__property'>
        Interface: {fakeRelation.interface}
      </p>
      <p className='inspector-relation-details__property'>
        Name: {fakeRelation.near.name}
      </p>
      <p className='inspector-relation-details__property'>
        Role: {fakeRelation.near.role}
      </p>
      <p className='inspector-relation-details__property'>
        Scope: {fakeRelation.scope}
      </p>
    </div>);
    assert.deepEqual(output.props.children, expected);
  });
});
