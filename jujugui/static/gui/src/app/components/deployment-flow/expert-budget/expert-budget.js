/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const GenericInput = require('../../generic-input/generic-input');
const GenericButton = require('../../generic-button/generic-button');
const Notification = require('../../notification/notification');

class DeploymentExpertBudget extends React.Component {
  render() {
    return (
      <div className="deployment-expert-budget">
        <Notification
          content={(
            <React.Fragment>
              <strong>Info:</strong>&nbsp;
              We will email you at fake@test.com when you reach
              80% of this limit.
            </React.Fragment>
          )}
          type="info" />
        <div className="deployment-expert-budget__row">
          <span>
            Total estimated monthly cost:
          </span>
          <span className="deployment-expert-budget__cost">
            $3577.00
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <span>
            Never charge me more than:
          </span>
          <span className="deployment-expert-budget__budget-input">
            $
            <GenericInput
              disabled={false} />
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <GenericButton
            action={() => {}}
            disabled={true}
            type="inline-positive">
            Set budget
          </GenericButton>
        </div>
      </div>
    );
  }
};

module.exports = DeploymentExpertBudget;
