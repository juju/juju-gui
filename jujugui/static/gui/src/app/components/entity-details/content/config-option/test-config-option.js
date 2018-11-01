/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentConfigOption = require('./config-option');

describe('EntityContentConfigOption', function() {
  const renderComponent = (options = {}) =>
    enzyme.shallow(<EntityContentConfigOption option={options.option} />);

  it('can render with a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string',
      default: 'abc123'
    };
    const wrapper = renderComponent({option});
    expect(wrapper).toMatchSnapshot();
  });

  it('can render without a default value', function() {
    var option = {
      name: 'password',
      description: 'Required password',
      type: 'string'
    };
    const wrapper = renderComponent({option});
    assert.equal(wrapper.find('.entity-content__config-default').length, 0);
  });
});
