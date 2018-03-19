/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ExpertStoreCard = require('../expert-store-card/expert-store-card');

describe('ExpertStoreCard', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ExpertStoreCard
      classes={options.classes || ['extra-class']}
      expert={options.expert || 'spicule'}
      staticURL="/media" />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
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
      </div>);
    assert.compareJSX(wrapper.find('.expert-store-card'), expected);
  });
});
