'use strict';

const React = require('react');

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

module.exports = RsDetailsItem;
