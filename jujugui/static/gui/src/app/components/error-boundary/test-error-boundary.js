/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const ErrorBoundary = require('./error-boundary');

class ComponentWithError extends React.Component {
  constructor(props) {
    super(props);
    throw new Error('Error!');
  }
  render() {
    return (
      <div>
        <h1>Buggy component</h1>
      </div>
    );
  }
}

describe('Error boundary', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ErrorBoundary />
  );

  it('can render', () => {
    const wrapper = renderComponent({
      content: (<span>Children content!</span>)
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('should show error message if available', () => {
    const renderComponentWithError = (options = {}) => enzyme.shallow(
      <ErrorBoundary />
    );
    const wrapper = renderComponentWithError({
      content: (<ComponentWithError />)
    });
    expect(wrapper).toMatchSnapshot();
  });
});
