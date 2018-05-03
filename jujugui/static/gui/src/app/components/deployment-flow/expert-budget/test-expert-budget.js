/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentExpertBudget = require('./expert-budget');
const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');
const Notification = require('../../notification/notification');

describe('DeploymentExpertBudget', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertBudget
      budget={options.budget}
      setBudget={options.setBudget || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent({ budget: 99 });
    const expected = (
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
            ${99}
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <span>
            Never charge me more than:
          </span>
          <span className="deployment-expert-budget__budget-input">
            $
            <GenericInput
              defaultValue={99}
              disabled={false}
              onChange={wrapper.find('GenericInput').prop('onChange')} />
          </span>
        </div>
        <div className="deployment-expert-budget__row">
          <GenericButton
            action={wrapper.find('GenericButton').prop('action')}
            disabled={false}
            type="inline-positive">
            Set budget
          </GenericButton>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
