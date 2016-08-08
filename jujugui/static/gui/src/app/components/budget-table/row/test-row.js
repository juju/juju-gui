/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('BudgetTableRow', function() {
  var acl, listPlansForCharm, service;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('budget-table-row', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    listPlansForCharm = sinon.stub().callsArgWith(1, null, [{
      url: 'plan 1',
      description: 'The basic support plan',
      price: '$5'
    }, {
      url: 'plan 2',
      description: 'The expensive support plan',
      price: '$1,000,000'
    }]);
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
        }
      }
    };
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
          {undefined}
        </div>
        <div>
          {undefined}
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });

  it('can display extra info', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        extraInfo={<span>extra</span>}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service}
        showExtra={true} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
          <div className="twelve-col no-margin-bottom">
            <span>extra</span>
          </div>
        </div>
        <div>
          {undefined}
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
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
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
          {undefined}
        </div>
        <div>
          {undefined}
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });

  it('can display a service that does not need a plan', function() {
    listPlansForCharm = sinon.stub().callsArgWith(1, null, []);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
          {undefined}
        </div>
        <div>
          {undefined}
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });

  it('can display editable plans', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
              <juju.components.GenericButton
                action={instance._toggle}
                disabled={false}
                type="neutral"
                title="Change plan" />
            </div>
          </div>
          {undefined}
        </div>
        <div>
          <div>
            <div className="budget-table__current twelve-col no-margin-bottom">
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
              {[<li className="budget-table__plan twelve-col"
                key={0}>
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
                  <juju.components.GenericButton
                    action={instance._toggle}
                    disabled={false}
                    type="neutral"
                    title="Select plan" />
                </div>
              </li>,
              <li className="budget-table__plan twelve-col"
                key={1}>
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
                  <juju.components.GenericButton
                    action={instance._toggle}
                    disabled={false}
                    type="neutral"
                    title="Select plan" />
                </div>
              </li>]}
            </ul>
            <p className="budget-table__plan-notice twelve-col">
              By setting an allocation and selecting a plan you agree to the
              plans terms and conditions
            </p>
          </div>
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={true}
        service={service} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
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
              <juju.components.GenericButton
                action={instance._toggle}
                disabled={true}
                type="neutral"
                title="Change plan" />
            </div>
          </div>
          {undefined}
        </div>
        <div>
          <div>
            <div className="budget-table__current twelve-col no-margin-bottom">
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
              {[<li className="budget-table__plan twelve-col"
                key={0}>
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
                  <juju.components.GenericButton
                    action={instance._toggle}
                    disabled={true}
                    type="neutral"
                    title="Select plan" />
                </div>
              </li>,
              <li className="budget-table__plan twelve-col"
                key={1}>
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
                  <juju.components.GenericButton
                    action={instance._toggle}
                    disabled={true}
                    type="neutral"
                    title="Select plan" />
                </div>
              </li>]}
            </ul>
            <p className="budget-table__plan-notice twelve-col">
              By setting an allocation and selecting a plan you agree to the
              plans terms and conditions
            </p>
          </div>
        </div>
      </juju.components.ExpandingRow>);
    assert.deepEqual(output, expected);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    listPlansForCharm = sinon.stub().returns({abort: abort});
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        listPlansForCharm={listPlansForCharm}
        plansEditable={false}
        service={service} />, true);
    renderer.unmount();
    assert.equal(abort.callCount, 1);
  });
});
