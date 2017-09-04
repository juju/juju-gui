/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BudgetTableRow = require('./row');
const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');
const TermsPopup = require('../../terms-popup/terms-popup');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('BudgetTableRow', function() {
  var acl, addNotification, listPlansForCharm, parseTermId, service;

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
      get: (val) => {
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
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
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
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render without plans', function() {
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        withPlans={false} />, true);
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div className="twelve-col no-margin-bottom" />
            {undefined}
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display extra info', function() {
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        extraInfo={<span>extra</span>}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        showExtra={true}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
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
            <div className="twelve-col no-margin-bottom">
              <span>extra</span>
            </div>
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can show an active plan', function() {
    service = {
      get: (val) => {
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
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>{'plan 1'} ({'$5'})</span>
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
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display a service that does not need a plan', function() {
    listPlansForCharm = sinon.stub().callsArgWith(1, null, []);
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service}
        withPlans={true} />, true);
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>-</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              <div className="one-col no-margin-bottom">
                <span onClick={undefined}>$1</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              {undefined}
            </div>
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display editable plans', function() {
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service}
        withPlans={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              <div className="one-col no-margin-bottom">
                <span onClick={undefined}>$1</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              <div className="two-col last-col no-margin-bottom">
                <div className="budget-table__edit">
                  <GenericButton
                    action={instance._toggle}
                    disabled={false}
                    type="neutral">
                    Change plan
                  </GenericButton>
                </div>
              </div>
            </div>
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            <div>
              <div className={
                'budget-table__current twelve-col no-margin-bottom'}>
                <div>
                  <div className="three-col no-margin-bottom">
                    <img className="budget-table__charm-icon"
                      src="landscape.svg" />
                    Landscape
                  </div>
                  <div className="one-col no-margin-bottom">
                    {4}
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
                        action={instance._toggle}
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
                        action={instance._toggle}
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
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service}
        withPlans={true} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              <div className="one-col no-margin-bottom">
                <span onClick={undefined}>$1</span>
              </div>
              <div className="one-col no-margin-bottom">
                $1
              </div>
              <div className="two-col last-col no-margin-bottom">
                <div className="budget-table__edit">
                  <GenericButton
                    action={instance._toggle}
                    disabled={true}
                    type="neutral">
                    Change plan
                  </GenericButton>
                </div>
              </div>
            </div>
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            <div>
              <div className={
                'budget-table__current twelve-col no-margin-bottom'}>
                <div>
                  <div className="three-col no-margin-bottom">
                    <img className="budget-table__charm-icon"
                      src="landscape.svg" />
                    Landscape
                  </div>
                  <div className="one-col no-margin-bottom">
                    {4}
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
                        action={instance._toggle}
                        disabled={true}
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
                        action={instance._toggle}
                        disabled={true}
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
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    listPlansForCharm = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        withPlans={true} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can display applications without terms', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(null)
    });
    const showTerms = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
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
            <div className="twelve-col no-margin-bottom" />
            {undefined}
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display applications with terms', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms'])
    });
    const showTerms = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
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
              <div className="three-col no-margin-bottom">
                <img className="budget-table__charm-icon"
                  src="landscape.svg" />
                Landscape
              </div>
              <div className="one-col no-margin-bottom">
                {4}
              </div>
            </div>
            <div>
              <div className="three-col no-margin-bottom">
                <span>You need to select a plan</span>
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
            <div className="twelve-col no-margin-bottom" />
            <div className={
              'two-col prepend-five no-margin-bottom budget-table-row__link'}>
              <GenericButton
                action={instance._toggleTerms}
                type="base">
                Terms
              </GenericButton>
            </div>
          </div>
          <div>
            {undefined}
          </div>
        </ExpandingRow>
        {undefined}
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can get terms by name', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms'])
    });
    const showTerms = sinon.stub();
    jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />);
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'landscape-terms');
    assert.isNull(showTerms.args[0][1]);
  });

  it('can get terms by name and revision', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['landscape-terms/15'])
    });
    const showTerms = sinon.stub();
    jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        parseTermId={parseTermId}
        service={service}
        showTerms={showTerms}
        withPlans={true} />);
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'landscape-terms');
    assert.equal(showTerms.args[0][1], 15);
  });

  it('can get terms by name and owner', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['spinach/landscape-terms'])
    });
    const showTerms = sinon.stub();
    jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />);
    assert.equal(showTerms.callCount, 1);
    assert.equal(showTerms.args[0][0], 'spinach/landscape-terms');
    assert.isNull(showTerms.args[0][1]);
  });

  it('can get terms by name, owner and revision', function() {
    const charmsGetById = sinon.stub().returns({
      get: sinon.stub().returns(['spinach/landscape-terms/15'])
    });
    const showTerms = sinon.stub();
    jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />);
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
    const renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.children[3].props.children
      .props.action();
    output = renderer.getRenderOutput();
    const expected = (
      <TermsPopup
        close={instance._toggleTerms}
        terms={[
          {content: 'Landscape terms.', name: 'landscape'},
          {content: 'Apache2 terms.', name: 'apache2'}
        ]} />);
    expect(output.props.children[1]).toEqualJSX(expected);
  });

  it('can handle errors when getting plans', function() {
    listPlansForCharm = sinon.stub().callsArgWith(1, 'uh oh!', null);
    jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        withPlans={true} />);
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
    const renderer = jsTestUtils.shallowRender(
      <BudgetTableRow
        acl={acl}
        addNotification={addNotification}
        allocationEditable={false}
        charmsGetById={charmsGetById}
        listPlansForCharm={listPlansForCharm}
        parseTermId={parseTermId}
        plansEditable={false}
        service={service}
        showTerms={showTerms}
        withPlans={true} />, true);
    let output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.children[3].props.children
      .props.action();
    output = renderer.getRenderOutput();
    assert.equal(addNotification.callCount, 2);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not retrieve "null" terms.',
      message: 'Could not retrieve "null" terms.: uh oh!',
      level: 'error'
    });
  });
});
