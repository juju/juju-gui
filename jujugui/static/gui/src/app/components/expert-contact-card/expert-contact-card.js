/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const EXPERTS = require('../expert-card/experts');
const ExpertCard = require('../expert-card/expert-card');
const GenericButton = require('../generic-button/generic-button');
const SvgIcon = require('../svg-icon/svg-icon');

class ExpertContactCard extends React.Component {
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
    this.props.sendAnalytics('Charmbrowser', 'Entity Details', 'Expert Contact');
    this.setState({showContact: true});
  }

  /**
    Generate the initial expert details.
  */
  _generateInitial() {
    const expert = EXPERTS[this.props.expert];
    const highlights = expert.highlights.map(highlight => (
      <li className="expert-contact-card__highlight"
        key={highlight}>
        <SvgIcon
          name="bullet"
          size="14" />
        {highlight}
      </li>));
    return (
      <div className="expert-contact-card__initial">
        <ul className="expert-contact-card__highlights">
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
    const expert = EXPERTS[this.props.expert];
    const phoneNumbers = expert.phoneNumbers.map(number => (
      <li className="expert-contact-card__phone-number"
        key={number}>
        {number}
      </li>));
    return (
      <div className="expert-contact-card__contact">
        <p className="expert-contact-card__contact-description">
          {expert.contactDescription}
        </p>
        <ul className="expert-contact-card__contact-items">
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="web"
              size="16" />
            {expert.website}
          </li>
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="email"
              size="16" />
            {expert.email}
          </li>
          <li className="expert-contact-card__contact-item">
            <SvgIcon
              name="phone"
              size="16" />
            <ul className="expert-contact-card__phone-numbers">
              {phoneNumbers}
            </ul>
          </li>
        </ul>
      </div>);
  }

  render() {
    const expert = EXPERTS[this.props.expert];
    if (!expert) {
      return null;
    }
    return (
      <ExpertCard
        expert={expert}
        staticURL={this.props.staticURL}>
        <div className="expert-contact-card">
          {this.state.showContact ? this._generateContact() : this._generateInitial()}
        </div>
      </ExpertCard>
    );
  }
};

ExpertContactCard.propTypes = {
  expert: PropTypes.string.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  staticURL: PropTypes.string
};

module.exports = ExpertContactCard;
