/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const EXPERTS = require('../expert-card/experts');
const ExpertCard = require('../expert-card/expert-card');
const ExpertStoreCard = require('../expert-store-card/expert-store-card');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ExpertStoreCard', function() {
  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <ExpertStoreCard
        classes={options.classes || ['extra-class']}
        expert={options.expert || 'spicule'}
        staticURL="/media" />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <ExpertCard
        classes={['extra-class']}
        expert={EXPERTS['spicule']}
        staticURL="/media">
        <div className="expert-store-card">
          <p className="expert-store-card__description">
          Learn how Spicule and Canonical can help solve your Big Data
          challenges with JAAS:
          </p>
          <a className="button--inline-neutral"
            href="http://jujucharms.com/experts/"
            target="_blank">
            Learn about Big Data expertise&hellip;
          </a>
        </div>
      </ExpertCard>);
    expect(output).toEqualJSX(expected);
  });
});
