/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentConfigOption = require('./config-option');

describe('EntityContentConfigOption', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContentConfigOption
      option={options.option} />
  );

  it('can render with a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string',
      default: 'abc123'
    };
    const wrapper = renderComponent({ option });
    const expected = (
      <div className="entity-content__config-option">
        <dt className="entity-content__config-name"
          id="charm-config-password">
            password
        </dt>
        <dd className="entity-content__config-description">
          <p>
            <span className="entity-content__config-type">
                ({'string'})
            </span>
            {' '}
              Required password
          </p>
        </dd>
        <dd className="entity-content__config-default">
            abc123
        </dd>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render without a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string'
    };
    const wrapper = renderComponent({ option });
    assert.equal(wrapper.find('.entity-content__config-default').length, 0);
  });
});
