/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');
const SvgIcon = require('../svg-icon/svg-icon');

const experts = {
  spicule: {
    logo: 'spicule.png',
    highlights: [
      'Machine learning',
      'Data service deployments',
      'Container orchestration'
    ],
    contactDescription: (
      'Please let us know if you have a question, or would like further ' +
      'information about Spicule.'),
    website: 'www.spicule.co.uk',
    email: 'juju-partners@spicule.co.uk',
    phoneNumbers: [
      'UK +44 (0)1603 327762',
      'US +1 8448141689'
    ]
  }
};

class ExpertCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showContact: false
    };
  }

  /**
    Change the show contact state.
  */
  _showContact() {
    this.setState({showContact: true});
  }

  /**
    Generate the initial expert details.
  */
  _generateInitial() {
    const expert = experts[this.props.expert];
    const highlights = expert.highlights.map(highlight => (
      <li className="expert-card__highlight"
        key={highlight}>
        <SvgIcon
          name="bullet"
          size="14" />
        {highlight}
      </li>));
    return (
      <div className="expert-card__initial">
        <ul className="expert-card__highlights">
          {highlights}
        </ul>
        <GenericButton
          action={this._showContact.bind(this)}
          type="positive">
          Show contact details&hellip;
        </GenericButton>
      </div>);
  }

  /**
    Generate the contact details.
  */
  _generateContact() {
    const expert = experts[this.props.expert];
    const phoneNumbers = expert.phoneNumbers.map(number => (
      <li className="expert-card__phone-number"
        key={number}>
        {number}
      </li>));
    return (
      <div className="expert-card__contact">
        <p className="expert-card__contact-description">
          {expert.contactDescription}
        </p>
        <ul className="expert-card__contact-items">
          <li className="expert-card__contact-item">
            <SvgIcon
              name="web"
              size="16" />
            {expert.website}
          </li>
          <li className="expert-card__contact-item">
            <SvgIcon
              name="email"
              size="16" />
            {expert.email}
          </li>
          <li className="expert-card__contact-item">
            <SvgIcon
              name="phone"
              size="16" />
            <ul className="expert-card__phone-numbers">
              {phoneNumbers}
            </ul>
          </li>
        </ul>
      </div>);
  }

  render() {
    const expert = experts[this.props.expert];
    if (!expert) {
      return null;
    }
    const logo = `${this.props.staticURL}/static/gui/build/app/assets/images/` +
      `non-sprites/experts/${expert.logo}`;
    return (
      <div className="expert-card">
        <div className="expert-card__top-title">
          Juju expert partners
        </div>
        <div className="expert-card__logo">
          <img alt={this.props.expert}
            className="expert-card__logo-image"
            src={logo} />
        </div>
        {this.state.showContact ? this._generateContact() : this._generateInitial()}
      </div>
    );
  }
};

ExpertCard.propTypes = {
  expert: PropTypes.string.isRequired,
  staticURL: PropTypes.string
};

module.exports = ExpertCard;
