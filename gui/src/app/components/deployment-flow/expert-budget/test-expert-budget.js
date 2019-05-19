/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Analytics = require('../../../../test/fake-analytics');
const DeploymentExpertBudget = require('./expert-budget');
const {Button} = require('@canonical/juju-react-components');
const GenericInput = require('../../generic-input/generic-input');

describe('DeploymentExpertBudget', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentExpertBudget
      analytics={Analytics}
      budget={options.budget}
      estimateWithSLA={99}
      setBudget={options.setBudget || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent({budget: 99});
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
        <div className="deployment-expert-budget__row v1">
          <Button
            action={wrapper.find('Button').prop('action')}
            disabled={false}
            extraClasses="is-inline"
            modifier="positive">
            Set budget
          </Button>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
