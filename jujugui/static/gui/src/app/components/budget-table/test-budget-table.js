/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BudgetTable = require('./budget-table');
const BudgetTableRow = require('./row/row');

const jsTestUtils = require('../../utils/component-test-utils');

describe('BudgetTable', function() {
  var acl;

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <BudgetTable
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        services={[{}, {}]}
        showTerms={showTerms}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="two-col">
            New units
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
    expect(output).toEqualJSX(expected);
  });

  it('can render without plans', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <BudgetTable
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        services={[{}, {}]}
        showTerms={showTerms}
        withPlans={false} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="two-col">
            New units
          </div>
          {undefined}
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
          withPlans={false} />,
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
          withPlans={false} />]}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display editable plans', function() {
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub();
    const showTerms = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <BudgetTable
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        services={[{}, {}]}
        showTerms={showTerms}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="two-col">
            New units
          </div>
          <div>
            <div className="three-col">
              Details
            </div>
            <div className="one-col">
              Usage
            </div>
            <div className="one-col">
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
          plansEditable={true}
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
          plansEditable={true}
          service={{}}
          showTerms={showTerms}
          withPlans={true} />]}
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
