/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BudgetTableRow = require('./row');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');

describe('BudgetTableRow', function() {
  var acl, addNotification, listPlansForCharm, parseTermId, service;

  const renderComponent = (options = {}) => enzyme.shallow(
    <BudgetTableRow
      acl={options.acl || acl}
      addNotification={options.addNotification || addNotification}
      allocationEditable={options.allocationEditable}
      charmsGetById={options.charmsGetById}
      extraInfo={options.extraInfo}
      listPlansForCharm={options.listPlansForCharm || listPlansForCharm}
      parseTermId={options.parseTermId}
      plansEditable={options.plansEditable}
      service={options.service || service}
      showTerms={options.showTerms}
      withPlans={options.withPlans === undefined ? true : options.withPlans} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    addNotification = sinon.stub();
    listPlansForCharm = sinon.stub().callsArgWith(1, null, [{
      url: 'plan 1',
      description: 'The basic support plan',
      price: '$5'
    }, {
      url: 'plan 2',
      description: 'The expensive support plan',
      price: '$1,000,000'
    }]);
    parseTermId = sinon.stub().returns();
    parseTermId.withArgs('apache2-terms').returns({
      name: 'apache2-terms',
      owner: null,
      revision: null
    });
    parseTermId.withArgs('spinach/landscape-terms/15').returns({
      name: 'landscape-terms',
      owner: 'spinach',
      revision: 15
    });
    parseTermId.withArgs('landscape-terms').returns({
      name: 'landscape-terms',
      owner: null,
      revision: null
    });
    parseTermId.withArgs('landscape-terms/15').returns({
      name: 'landscape-terms',
      owner: null,
      revision: 15
    });
    parseTermId.withArgs('spinach/landscape-terms').returns({
      name: 'landscape-terms',
      owner: 'spinach',
      revision: null
    });
    service = {
      get: val => {
        switch (val) {
          case 'name':
            return 'Landscape';
            break;
          case 'icon':
            return 'landscape.svg';
            break;
          case 'unit_count':
            return 4;
            break;
          case 'charm':
            return 'cs:landscape';
            break;
        }
      }
    };
  });

  it('can render', function() {
    const wrapper = renderComponent();
    var expected = (
      <div>
        <ExpandingRow
          classes={{
            'budget-table-row': true,
            'twelve-col': true
          }}
          clickable={false}
          expanded={false}>
          <div>
            <div>
              <div className="five-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
            </div>
            <div className="budget-table-row__plans">
              <div className="three-col no-margin-bottom">
                <span className="budget-table-row__plan">You need to select a plan</span>
              </div>
              <div className="two-col no-margin-bottom">
                $1
              </div>
              <div className="two-col no-margin-bottom">
                <span onClick={undefined}>$1</span>
              </div>
              <div className="one-col no-margin-bottom last-col">
                $1
              </div>
              {undefined}
            </div>
            <div className="twelve-col no-margin-bottom budget-table-row__extra" />
            {undefined}
          </div>
          <div className="budget-table-row__change-plan-wrapper">
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render without plans', function() {
    const wrapper = renderComponent({ withPlans: false });
    assert.equal(wrapper.find('.budget-table-row__plans').length, 0);
  });

  it('can display extra info', function() {
    const wrapper = renderComponent({
      extraInfo: (<span>extra</span>)
    });
    var expected = (
      <div className="twelve-col no-margin-bottom budget-table-row__extra">
        <span>extra</span>
      </div>);
    assert.compareJSX(wrapper.find('.budget-table-row__extra'), expected);
  });

  it('can show an active plan', function() {
    service = {
      get: val => {
        switch (val) {
          case 'name':
            return 'Landscape';
            break;
          case 'icon':
            return 'landscape.svg';
            break;
          case 'unit_count':
            return 4;
            break;
          case 'activePlan':
            return {
              url: 'plan 1',
              description: 'The basic support plan',
              price: '$5'
            };
            break;
        }
      }
    };
    const wrapper = renderComponent({ service });
    const expected = (
      <span className="budget-table-row__plan">{'plan 1'} ({'$5'})</span>);
    assert.compareJSX(wrapper.find('.budget-table-row__plan'), expected);
  });

  it('can display a service that does not need a plan (when no plans)', () => {
    listPlansForCharm = sinon.stub().callsArgWith(1, null, []);
    const wrapper = renderComponent({
      listPlansForCharm,
      plansEditable: true
    });
    assert.equal(wrapper.find('.budget-table-row__change-plan').length, 0);
  });

  it('can display a service that does not need a plan (when plans not editable)', () => {
    const wrapper = renderComponent({
      plansEditable: false
    });
    assert.equal(wrapper.find('.budget-table-row__change-plan').length, 0);
  });

  it('can display editable plans', function() {
    const wrapper = renderComponent({
      plansEditable: true
    });
    var expected = (
      <div className="budget-table-row__change-plan-wrapper">
        <div className="budget-table-row__change-plan">
          <div className={
            'budget-table__current twelve-col no-margin-bottom'}>
            <div>
              <div className="five-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
            </div>
          </div>
          <ul className="budget-table__plans twelve-col no-margin-bottom">
            {[
              <li className="budget-table__plan twelve-col" key={0}>
                <div className="six-col">
                  <h4>plan 1</h4>
                  <p>The basic support plan</p>
                </div>
                <div className="two-col">
                  $5
                </div>
                <div className="two-col">
                  Recommended allocation: $550.
                </div>
                <div className="two-col last-col">
                  <GenericButton
                    action={wrapper.find('GenericButton').at(1).prop('action')}
                    disabled={false}
                    type="neutral">
                    Select plan
                  </GenericButton>
                </div>
              </li>,
              <li className="budget-table__plan twelve-col" key={1}>
                <div className="six-col">
                  <h4>plan 2</h4>
                  <p>The expensive support plan</p>
                </div>
                <div className="two-col">
                  $1,000,000
                </div>
                <div className="two-col">
                  Recommended allocation: $550.
                </div>
                <div className="two-col last-col">
                  <GenericButton
                    action={wrapper.find('GenericButton').at(2).prop('action')}
                    disabled={false}
                    type="neutral">
                    Select plan
                  </GenericButton>
                </div>
              </li>
            ]}
          </ul>
          <p className="budget-table__plan-notice twelve-col">
            By setting an allocation and selecting a plan you agree to the
            plans terms and conditions
          </p>
        </div>
      </div>);
    assert.compareJSX(wrapper.find('.budget-table-row__change-plan-wrapper'), expected);
    assert.compareJSX(wrapper.find('.budget-table__edit'), (
      <div className="budget-table__edit">
        <GenericButton
          action={wrapper.find('GenericButton').at(0).prop('action')}
          disabled={false}
          type="neutral">
          Change plan
        </GenericButton>
      </div>));
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const wrapper = renderComponent({
      acl,
      plansEditable: true
    });
    assert.equal(wrapper.find('GenericButton').at(0).prop('disabled'), true);
    assert.equal(wrapper.find('GenericButton').at(1).prop('disabled'), true);
    assert.equal(wrapper.find('GenericButton').at(2).prop('disabled'), true);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    listPlansForCharm = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({ listPlansForCharm });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can display applications without terms', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(null)
    });
    const showTerms = sinon.stub();
    const wrapper = renderComponent({ charmsGetById, showTerms });
    assert.equal(showTerms.callCount, 0);
    assert.equal(wrapper.find('TermsPopup').length, 0);
  });

  it('can display applications with terms', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms'])
    });
    const showTerms = sinon.stub();
    const wrapper = renderComponent({ charmsGetById, parseTermId, showTerms });
    const expected = (
      <div className={
        'two-col prepend-five no-margin-bottom budget-table-row__link ' +
        'budget-table-row__terms-link'}>
        <GenericButton
          action={wrapper.find('.budget-table-row__terms-link GenericButton').prop('action')}
          type="base">
          Terms
        </GenericButton>
      </div>);
    assert.compareJSX(wrapper.find('.budget-table-row__terms-link'), expected);
  });

  it('can get terms by name', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms'])
    });
    const showTerms = sinon.stub();
    renderComponent({ charmsGetById, parseTermId, showTerms });
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'landscape-terms');
    assert.isNull(showTerms.args[0][1]);
  });

  it('can get terms by name and revision', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms/15'])
    });
    const showTerms = sinon.stub();
    renderComponent({ charmsGetById, parseTermId, showTerms });
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'landscape-terms');
    assert.equal(showTerms.args[0][1], 15);
  });

  it('can get terms by name and owner', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['spinach/landscape-terms'])
    });
    const showTerms = sinon.stub();
    renderComponent({ charmsGetById, parseTermId, showTerms });
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'spinach/landscape-terms');
    assert.isNull(showTerms.args[0][1]);
  });

  it('can get terms by name, owner and revision', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['spinach/landscape-terms/15'])
    });
    const showTerms = sinon.stub();
    renderComponent({ charmsGetById, parseTermId, showTerms });
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'spinach/landscape-terms');
    assert.equal(showTerms.args[0][1], 15);
  });

  it('can display a terms popup', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms', 'apache2-terms'])
    });
    const showTerms = sinon.stub();
    showTerms.withArgs('landscape-terms').callsArgWith(2, null, {
      name: 'landscape',
      content: 'Landscape terms.'
    });
    showTerms.withArgs('apache2-terms').callsArgWith(2, null, {
      name: 'apache2',
      content: 'Apache2 terms.'
    });
    const wrapper = renderComponent({ charmsGetById, parseTermId, showTerms });
    wrapper.find('.budget-table-row__terms-link GenericButton').props().action();
    wrapper.update();
    const popup = wrapper.find('TermsPopup');
    assert.equal(popup.length, 1);
    assert.deepEqual(popup.prop('terms'), [
      {content: 'Landscape terms.', name: 'landscape'},
      {content: 'Apache2 terms.', name: 'apache2'}
    ]);
  });

  it('can handle errors when getting plans', function() {
    listPlansForCharm = sinon.stub().callsArgWith(1, 'uh oh!', null);
    renderComponent({ listPlansForCharm });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Fetching plans failed',
      message: 'Fetching plans failed: uh oh!',
      level: 'error'
    });
  });

  it('can handle errors when getting terms', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms', 'apache2-terms'])
    });
    const showTerms = sinon.stub().callsArgWith(2, 'uh oh!', null);
    const wrapper = renderComponent({ charmsGetById, parseTermId, showTerms });
    wrapper.find('.budget-table-row__terms-link GenericButton').props().action();
    wrapper.update();
    assert.equal(addNotification.callCount, 2);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not retrieve "null" terms.',
      message: 'Could not retrieve "null" terms.: uh oh!',
      level: 'error'
    });
  });
});
