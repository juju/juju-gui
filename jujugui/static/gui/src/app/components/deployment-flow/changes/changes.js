/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ExpandingRow = require('../../expanding-row/expanding-row');
const DeploymentChangeItem = require('../change-item/change-item');

class DeploymentChanges extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changes: this.props.getCurrentChangeSet()
    };
  }

  render() {
    const state = this.state;
    return (
      <ExpandingRow
        classes={{'twelve-col': true}}
        clickable={true}>
        <div>
          Show changes ({Object.keys(state.changes).length})
          &rsaquo;
        </div>
        <ul className="deployment-changes">
          {this.props.generateAllChangeDescriptions(state.changes)
            .map(change => (
              <DeploymentChangeItem
                change={change}
                key={change.id}
                showTime={false} />))}
        </ul>
      </ExpandingRow>
    );
  }
};

DeploymentChanges.propTypes = {
  generateAllChangeDescriptions: PropTypes.func.isRequired,
  getCurrentChangeSet: PropTypes.func.isRequired
};

module.exports = DeploymentChanges;
