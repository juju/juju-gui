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
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('budget-table-row', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTableRow
        acl={acl}
        allocationEditable={false}
        plansEditable={false}
        service={{}} />, true);
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
        classes={{
          'budget-table__row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={false}>
        <div>
          <div>
            <div className="three-col">
              <img className="budget-table__charm-icon"
                src={
                  'https://api.staging.jujucharms.com/charmstore/v4/' +
                  'trusty/landscape-server-14/icon.svg'} />
              Landscape
            </div>
            <div className="one-col">
              4
            </div>
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="two-col">
            $1
          </div>
          <div className="two-col">
            <span onClick={undefined}>$1</span>
          </div>
          <div className="one-col">
            $1
          </div>
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
        plansEditable={true}
        service={{}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
        classes={{
          'budget-table__row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={false}>
        <div>
          <div>
            <div className="three-col">
              <img className="budget-table__charm-icon"
                src={
                  'https://api.staging.jujucharms.com/charmstore/v4/' +
                  'trusty/landscape-server-14/icon.svg'} />
              Landscape
            </div>
            <div className="one-col">
              4
            </div>
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="one-col">
            $1
          </div>
          <div className="one-col">
            <span onClick={undefined}>$1</span>
          </div>
          <div className="one-col">
            $1
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={instance._toggle}
                disabled={false}
                type="neutral"
                title="Change plan" />
            </div>
          </div>
        </div>
        <div>
          <div>
            <div className="budget-table__current twelve-col no-margin-bottom">
              <div>
                <div className="three-col">
                  <img className="budget-table__charm-icon"
                    src={
                      'https://api.staging.jujucharms.com/charmstore/v4/' +
                      'trusty/landscape-server-14/icon.svg'} />
                  Landscape
                </div>
                <div className="one-col">
                  4
                </div>
              </div>
            </div>
            <ul className="budget-table__plans twelve-col no-margin-bottom">
              {[<li className="budget-table__plan twelve-col"
                key={0}>
                <div className="six-col">
                  <h4>Bronze plan</h4>
                  <p>This is the basic support plan.</p>
                </div>
                <div className="two-col">
                  5 calls per month
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
                  <h4>Bronze plan</h4>
                  <p>This is the basic support plan.</p>
                </div>
                <div className="two-col">
                  5 calls per month
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
        plansEditable={true}
        service={{}} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <juju.components.ExpandingRow
        classes={{
          'budget-table__row': true,
          'twelve-col': true
        }}
        clickable={false}
        expanded={false}>
        <div>
          <div>
            <div className="three-col">
              <img className="budget-table__charm-icon"
                src={
                  'https://api.staging.jujucharms.com/charmstore/v4/' +
                  'trusty/landscape-server-14/icon.svg'} />
              Landscape
            </div>
            <div className="one-col">
              4
            </div>
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="one-col">
            $1
          </div>
          <div className="one-col">
            <span onClick={undefined}>$1</span>
          </div>
          <div className="one-col">
            $1
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={instance._toggle}
                disabled={true}
                type="neutral"
                title="Change plan" />
            </div>
          </div>
        </div>
        <div>
          <div>
            <div className="budget-table__current twelve-col no-margin-bottom">
              <div>
                <div className="three-col">
                  <img className="budget-table__charm-icon"
                    src={
                      'https://api.staging.jujucharms.com/charmstore/v4/' +
                      'trusty/landscape-server-14/icon.svg'} />
                  Landscape
                </div>
                <div className="one-col">
                  4
                </div>
              </div>
            </div>
            <ul className="budget-table__plans twelve-col no-margin-bottom">
              {[<li className="budget-table__plan twelve-col"
                key={0}>
                <div className="six-col">
                  <h4>Bronze plan</h4>
                  <p>This is the basic support plan.</p>
                </div>
                <div className="two-col">
                  5 calls per month
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
                  <h4>Bronze plan</h4>
                  <p>This is the basic support plan.</p>
                </div>
                <div className="two-col">
                  5 calls per month
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
});
