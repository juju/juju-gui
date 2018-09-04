'use strict';

const React = require('react');
const PropTypes = require('prop-types');

/**
  React component used to display Items in itemised list in Revenue Statement
*/

const RsDetailsItem = props => (
  <div className="rs__details-item-entry">
    <div className="rs__entity-name">{props.entityName}</div>
    <div>{props.entityPlan}</div>
    <div>{props.entityShare}%</div>
    <div className="u-align-text--center">${props.entityAmount}</div>
  </div>
);

RsDetailsItem.propTypes = {
  entityAmount: PropTypes.string,
  entityName: PropTypes.string,
  entityPlan: PropTypes.string,
  entityShare: PropTypes.string
};

module.exports = RsDetailsItem;
