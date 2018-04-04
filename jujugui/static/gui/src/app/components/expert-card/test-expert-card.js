/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ExpertCard = require('../expert-card/expert-card');
const ExpertBlock = require('../expert-block/expert-block');
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
      <ExpertBlock classes={undefined} title="Juju expert partners">
        <div className="expert-card__logo">
          <img alt="spicule.png" className="expert-card__logo-image"
            src={
              '/media/static/gui/build/app/assets/images/' +
              'non-sprites/experts/spicule.png'} />
        </div>
        <span>Content</span>
      </ExpertBlock>);
    assert.compareJSX(wrapper, expected);
  });
});
