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

describe('BudgetTable', function() {
  var acl;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('budget-table', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTable
        acl={acl} />, true);
    var output = renderer.getRenderOutput();
    var services = output.props.children[1];
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="two-col">
            Units
          </div>
          <div className="three-col">
            Details
          </div>
          <div className="four-col last-col">
            Allocation
          </div>
        </div>
        {[<div className="budget-table__row twelve-col"
          key={0}>
          <div className="three-col">
            <img className="budget-table__charm-icon"
              src={
                'https://api.staging.jujucharms.com/charmstore/v4/' +
                'trusty/landscape-server-14/icon.svg'} />
            Landscape
          </div>
          <div className="two-col">
            4
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="two-col">
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={
                  services[0].props.children[4].props.children.props
                  .children.props.action}
                disabled={false}
                type="neutral"
                title="Edit" />
            </div>
          </div>
        </div>,
        <div className="budget-table__row twelve-col"
          key={1}>
          <div className="three-col">
            <img className="budget-table__charm-icon"
              src={
                'https://api.staging.jujucharms.com/charmstore/v4/' +
                'trusty/landscape-server-14/icon.svg'} />
            Landscape
          </div>
          <div className="two-col">
            4
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="two-col">
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={
                  services[1].props.children[4].props.children.props
                  .children.props.action}
                disabled={false}
                type="neutral"
                title="Edit" />
            </div>
          </div>
        </div>]}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    var renderer = jsTestUtils.shallowRender(
      <juju.components.BudgetTable
        acl={acl} />, true);
    var output = renderer.getRenderOutput();
    var services = output.props.children[1];
    var expected = (
      <div className="budget-table">
        <div className="budget-table__row-header twelve-col">
          <div className="three-col">
            Name
          </div>
          <div className="two-col">
            Units
          </div>
          <div className="three-col">
            Details
          </div>
          <div className="four-col last-col">
            Allocation
          </div>
        </div>
        {[<div className="budget-table__row twelve-col"
          key={0}>
          <div className="three-col">
            <img className="budget-table__charm-icon"
              src={
                'https://api.staging.jujucharms.com/charmstore/v4/' +
                'trusty/landscape-server-14/icon.svg'} />
            Landscape
          </div>
          <div className="two-col">
            4
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="two-col">
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={
                  services[0].props.children[4].props.children.props
                  .children.props.action}
                disabled={true}
                type="neutral"
                title="Edit" />
            </div>
          </div>
        </div>,
        <div className="budget-table__row twelve-col"
          key={1}>
          <div className="three-col">
            <img className="budget-table__charm-icon"
              src={
                'https://api.staging.jujucharms.com/charmstore/v4/' +
                'trusty/landscape-server-14/icon.svg'} />
            Landscape
          </div>
          <div className="two-col">
            4
          </div>
          <div className="three-col">
            You need to choose a plan.
          </div>
          <div className="two-col">
          </div>
          <div className="two-col last-col">
            <div className="budget-table__edit">
              <juju.components.GenericButton
                action={
                  services[1].props.children[4].props.children.props
                  .children.props.action}
                disabled={true}
                type="neutral"
                title="Edit" />
            </div>
          </div>
        </div>]}
      </div>);
    assert.deepEqual(output, expected);
  });
});
