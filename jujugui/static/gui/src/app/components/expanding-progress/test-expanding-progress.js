/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ExpandingProgress = require('./expanding-progress');

describe('ExpandingProgress', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ExpandingProgress />
  );

  beforeEach(() => {
    this.clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    this.clock.restore();
  });

  it('renders properly', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className="expanding-progress"></div>);
    assert.compareJSX(wrapper, expected);
  });

  it('adds the active class after mounted', () => {
    const wrapper = renderComponent();
    // The class is set asynchronously fast forward until it should be applied.
    this.clock.tick(1);
    wrapper.update();
    assert.equal(
      wrapper.prop('className').includes('expanding-progress--active'),
      true);
  });

});
