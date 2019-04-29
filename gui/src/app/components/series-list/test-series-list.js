/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const SeriesList = require('./series-list');

describe('SeriesList', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <SeriesList
      items={options.items || ['wily', 'kubernetes']} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });
});
