/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ExpertCard = require('../expert-card/expert-card');
const EXPERTS = require('../expert-card/experts');

describe('ExpertCard', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ExpertCard
      expert={options.expert || EXPERTS['spicule']}
      staticURL="/media">
      <span>Content</span>
    </ExpertCard>
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="expert-card">
        <div className="expert-card__top-title">
          Juju expert partners
        </div>
        <div className="expert-card__logo">
          <img alt="spicule.png"
            className="expert-card__logo-image"
            src={
              '/media/static/gui/build/app/assets/images/' +
              'non-sprites/experts/spicule.png'} />
        </div>
        <span>Content</span>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
