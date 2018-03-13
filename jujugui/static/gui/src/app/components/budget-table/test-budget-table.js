/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BudgetTable = require('./budget-table');
const BudgetTableRow = require('./row/row');

describe('BudgetTable', function() {
  var acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <BudgetTable
      acl={options.acl || acl}
      addNotification={options.addNotification || sinon.stub()}
      allocationEditable={options.allocationEditable}
      listPlansForCharm={options.listPlansForCharm || sinon.stub()}
      plansEditable={options.plansEditable}
      services={options.services || [{}, {}]}
      showTerms={options.showTerms || sinon.stub()}
      withPlans={options.withPlans} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const showTerms = sinon.stub();
    const wrapper = renderComponent({
      addNotification,
      allocationEditable: false,
      listPlansForCharm,
      plansEditable: false,
      showTerms,
      withPlans: true
    });
    var expected = (
      <div className="budget-table twelve-col">
        <div className="budget-table__row-header twelve-col">
          <div className="five-col">
            Name
          </div>
          <div>
            <div className="three-col">
              Details
            </div>
            <div className="two-col">
              Usage
            </div>
            <div className="two-col">
              Allocation
            </div>
            <div className="one-col last-col">
              Spend
            </div>
          </div>
        </div>
        {[<BudgetTableRow
          acl={acl}
          addNotification={addNotification}
          allocationEditable={false}
          charmsGetById={undefined}
          extraInfo={undefined}
          key={0}
          listPlansForCharm={listPlansForCharm}
          parseTermId={undefined}
          plansEditable={false}
          service={{}}
          showTerms={showTerms}
          withPlans={true} />,
        <BudgetTableRow
          acl={acl}
          addNotification={addNotification}
          allocationEditable={false}
          charmsGetById={undefined}
          extraInfo={undefined}
          key={1}
          listPlansForCharm={listPlansForCharm}
          parseTermId={undefined}
          plansEditable={false}
          service={{}}
          showTerms={showTerms}
          withPlans={true} />]}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render without plans', function() {
    const wrapper = renderComponent({
      withPlans: false
    });
    assert.equal(wrapper.find('BudgetTableRow').at(0).prop('withPlans'), false);
  });

  it('can display editable plans', function() {
    const wrapper = renderComponent({
      plansEditable: true
    });
    assert.equal(wrapper.find('BudgetTableRow').at(0).prop('plansEditable'), true);
  });
});
