/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ExpandingProgress = require('./expanding-progress');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('ExpandingProgress', function() {

  it('renders properly', () => {
    var output = jsTestUtils.shallowRender(
      <ExpandingProgress />);
    var expected = (
      <div className="expanding-progress"></div>);
    assert.deepEqual(output, expected);
  });

  it('adds the active class after mounted', (done) => {
    var component = testUtils.renderIntoDocument(
      <ExpandingProgress />);
    // The class is set asynchronously so loop over the value and continue When
    // it changes.
    setTimeout(() => {
      if (component.state.active) {
        assert.equal(component.state.active, true);
        done();
      }
    });
  });

});
