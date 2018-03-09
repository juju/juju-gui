/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityContentConfigOption = require('./config-option');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentConfigOption', function() {

  it('can render with a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string',
      default: 'abc123'
    };
    var output = jsTestUtils.shallowRender(
      <EntityContentConfigOption
        option={option} />);
    assert.deepEqual(output,
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
  });

  it('can render without a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string'
    };
    var output = jsTestUtils.shallowRender(
      <EntityContentConfigOption
        option={option} />);
    assert.deepEqual(output,
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
        {undefined}
      </div>);
  });
});
