'use strict';

const React = require('react');
const enzyme = require('enzyme');

const RevenueStatement = require('./revenue-statement');

describe('Revenue statement', () => {
  const renderComponent = (options = {}) => enzyme.shallow(<RevenueStatement />);

  it('can render', () => {
    const wrapper = renderComponent({gisf: true});
    expect(wrapper).toMatchSnapshot();
  });
});
