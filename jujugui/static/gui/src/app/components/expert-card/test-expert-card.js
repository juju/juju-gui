/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const ExpertCard = require('../expert-card/expert-card');
const EXPERTS = require('../expert-card/experts');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ExpertCard', function() {
  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <ExpertCard
        expert={options.expert || EXPERTS['spicule']}
        staticURL="/media">
        <span>Content</span>
      </ExpertCard>, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
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
    expect(output).toEqualJSX(expected);
  });
});
