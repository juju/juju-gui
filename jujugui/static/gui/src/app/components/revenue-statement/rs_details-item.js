'use strict';

const React = require('react');
const PropTypes = require('prop-types');

/**
  React component used to display Items in itemised list in Revenue Statement
*/
class RsDetailsItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="rs__details-item-entry">
        <div className="rs__entity-name">{this.props.entityName}</div>
        <div>{this.props.entityPlan}</div>
        <div>{this.props.entityShare}%</div>
        <div className="u-align-text--center">${this.props.entityAmount}</div>
      </div>
    );
  }
}

RsDetailsItem.propTypes = {
  entityAmount: PropTypes.string,
  entityName: PropTypes.string,
  entityPlan: PropTypes.string,
  entityShare: PropTypes.string
};

module.exports = RsDetailsItem;
