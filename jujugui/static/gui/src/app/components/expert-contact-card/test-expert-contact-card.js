/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const GenericButton = require('../generic-button/generic-button');
const SvgIcon = require('../svg-icon/svg-icon');
const ExpertContactCard = require('../expert-contact-card/expert-contact-card');

describe('ExpertContactCard', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ExpertContactCard
      expert={options.expert || 'spicule'}
      sendAnalytics={options.sendAnalytics || sinon.stub()}
      staticURL="/media" />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="expert-contact-card">
        <div className="expert-contact-card__initial">
          <ul className="expert-contact-card__highlights">
            {[
              <li className="expert-contact-card__highlight"
                key="Machine learning">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Machine learning
              </li>,
              <li className="expert-contact-card__highlight"
                key="Data service deployments">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Data service deployments
              </li>,
              <li className="expert-contact-card__highlight"
                key="Container orchestration">
                <SvgIcon
                  name="bullet"
                  size="14" />
                Container orchestration
              </li>
            ]}
          </ul>
          <GenericButton
            action={wrapper.find('GenericButton').prop('action')}
            type="positive">
            Show contact details&hellip;
          </GenericButton>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.expert-contact-card'), expected);
  });

  it('can render without a matching expert', () => {
    const wrapper = renderComponent({ expert: 'spinach' });
    assert.strictEqual(wrapper.html(), null);
  });

  it('can display the contact details', () => {
    const wrapper = renderComponent();
    wrapper.find('GenericButton').props().action();
    wrapper.update();
    const expected = (
      <div className="expert-contact-card__contact">
        <p className="expert-contact-card__contact-description">
          Please let us know if you have a question, or would like further
          information about Spicule.
        </p>
        <ul className="expert-contact-card__contact-items">
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="web"
              size="16" />
            www.spicule.co.uk
          </li>
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="email"
              size="16" />
            juju-partners@spicule.co.uk
          </li>
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="phone"
              size="16" />
            <ul className="expert-contact-card__phone-numbers">
              {[
                <li className="expert-contact-card__phone-number"
                  key="UK +44 (0)1603 327762">
                  UK +44 (0)1603 327762
                </li>,
                <li className="expert-contact-card__phone-number"
                  key="US +1 8448141689">
                  US +1 8448141689
                </li>
              ]}
            </ul>
          </li>
        </ul>
      </div>);
    assert.compareJSX(wrapper.find('.expert-contact-card__contact'), expected);
  });

  it('can send analytics when the contact button is clicked', () => {
    const sendAnalytics = sinon.stub();
    const wrapper = renderComponent({ sendAnalytics });
    wrapper.find('GenericButton').props().action();
    assert.equal(sendAnalytics.callCount, 1);
  });
});
