/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const EXPERTS = require('../expert-card/experts');
const ExpertCard = require('../expert-card/expert-card');

class ExpertStoreCard extends React.Component {
  render() {
    const expert = EXPERTS[this.props.expert];
    if (!expert) {
      return null;
    }
    return (
      <ExpertCard
        classes={this.props.classes}
        expert={expert}
        staticURL={this.props.staticURL}>
        <div className="expert-store-card">
          <p className="expert-store-card__description">
            {expert.storeDescription}
          </p>
          <a className="button--inline-neutral"
            href="http://jujucharms.com/experts/"
            target="_blank">
            Learn about Big Data expertise&hellip;
          </a>
        </div>
      </ExpertCard>
    );
  }
};

ExpertStoreCard.propTypes = {
  classes: PropTypes.array.isRequired,
  expert: PropTypes.string.isRequired,
  staticURL: PropTypes.string
};

module.exports = ExpertStoreCard;
