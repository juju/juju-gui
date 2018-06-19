/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DeploymentExpertBudget = require('./expert-budget');
const GenericButton = require('../../generic-button/generic-button');
const GenericInput = require('../../generic-input/generic-input');

describe('DeploymentExpertBudget', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertBudget
      budget={options.budget}
      estimateWithSLA={99}
      setBudget={options.setBudget || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent({ budget: 99 });
    const expected = (
      <div className="deployment-expert-budget">
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
              disabled={false}
              onChange={wrapper.find('GenericInput').prop('onChange')}
              value={99} />
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
