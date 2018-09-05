'use strict';

const React = require('react');
const enzyme = require('enzyme');

const RsDetailsItem = require('./rs-details-item');

describe('Revenue statement details item', () => {
  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <RsDetailsItem amount="99.99" name="EntityName" plan="Plan A" share="99" />
    );

  it('can render', () => {
    const wrapper = renderComponent({ gisf: true });
    expect(wrapper).toMatchSnapshot();
  });
});
