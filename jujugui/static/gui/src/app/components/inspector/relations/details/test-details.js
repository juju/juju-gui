'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorRelationDetails = require('./details');

describe('InspectorRelationDetails', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorRelationDetails
      relation={options.relation} />
  );

  it('shows the relation properties', function() {
    var relation = {
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
    const wrapper = renderComponent({ relation });
    var expected = (<div className='inspector-relation-details__properties'>
      <p className='inspector-relation-details__property'>
        Interface: {relation.interface}
      </p>
      <p className='inspector-relation-details__property'>
        Name: {relation.near.name}
      </p>
      <p className='inspector-relation-details__property'>
        Role: {relation.near.role}
      </p>
      <p className='inspector-relation-details__property'>
        Scope: {relation.scope}
      </p>
    </div>);
    assert.compareJSX(wrapper.find('.inspector-relation-details__properties'), expected);
  });
});
