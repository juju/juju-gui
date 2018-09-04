'use strict';

const React = require('react');
const PropTypes = require('prop-types');

/**
  React component used to display Items in itemised list in Revenue Statement
*/

const RsDetailsItem = props => (
  <div className="rs__details-item-entry">
    <div className="rs__entity-name">{props.name}</div>
    <div>{props.plan}</div>
    <div>{props.share}%</div>
    <div className="u-align-text--center">${props.amount}</div>
  </div>
);

RsDetailsItem.propTypes = {
  amount: PropTypes.string,
  name: PropTypes.string,
  plan: PropTypes.string,
  share: PropTypes.string
};

module.exports = RsDetailsItem;
