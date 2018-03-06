/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericButton = require('../generic-button/generic-button');
const SvgIcon = require('../svg-icon/svg-icon');
const ExpertCard = require('../expert-card/expert-card');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ExpertCard', function() {
  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <ExpertCard
        entityName={options.entityName || 'drillbit'}
        expert={options.expert || 'spicule'}
        staticURL="/media" />, true);
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
          <img alt="spicule"
            className="expert-card__logo-image"
            src={
              '/media/static/gui/build/app/assets/images/' +
              'non-sprites/experts/spicule.png'} />
        </div>
        <div className="expert-card__initial">
          <ul className="expert-card__highlights">
            {[
              <li className="expert-card__highlight"
                key="Machine learning">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Machine learning
              </li>,
              <li className="expert-card__highlight"
                key="Data service deployments">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Data service deployments
              </li>,
              <li className="expert-card__highlight"
                key="Container orchestration">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Container orchestration
              </li>
            ]}
          </ul>
          <GenericButton
            action={sinon.stub()}
            type="positive">
            Show contact details&hellip;
          </GenericButton>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without a matching expert', () => {
    const renderer = renderComponent({ expert: 'spinach' });
    const output = renderer.getRenderOutput();
    assert.strictEqual(output, null);
  });

  it('can render without a matching entity', () => {
    const renderer = renderComponent({ entityName: 'apache2' });
    const output = renderer.getRenderOutput();
    assert.strictEqual(output, null);
  });

  it('can display the contact details', () => {
    const renderer = renderComponent();
    let output = renderer.getRenderOutput();
    output.props.children[2].props.children[1].props.action();
    output = renderer.getRenderOutput();
    const expected = (
      <div className="expert-card">
        <div className="expert-card__top-title">
          Juju expert partners
        </div>
        <div className="expert-card__logo">
          <img alt="spicule"
            className="expert-card__logo-image"
            src={
              '/media/static/gui/build/app/assets/images/' +
              'non-sprites/experts/spicule.png'} />
        </div>
        <div className="expert-card__contact">
          <p className="expert-card__contact-description">
            Please let us know if you have a question, or would like further
            information about Spicule.
          </p>
          <ul className="expert-card__contact-items">
            <li className="expert-card__contact-item">
              <SvgIcon
                name="web"
                size="16" />
              www.spicule.co.uk
            </li>
            <li className="expert-card__contact-item">
              <SvgIcon
                name="email"
                size="16" />
              juju-partners@spicule.co.uk
            </li>
            <li className="expert-card__contact-item">
              <SvgIcon
                name="phone"
                size="16" />
              <ul className="expert-card__phone-numbers">
                {[
                  <li className="expert-card__phone-number"
                    key="UK +44 (0)1603 327762">
                    UK +44 (0)1603 327762
                  </li>,
                  <li className="expert-card__phone-number"
                    key="US +1 8448141689">
                    US +1 8448141689
                  </li>
                ]}
              </ul>
            </li>
          </ul>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
