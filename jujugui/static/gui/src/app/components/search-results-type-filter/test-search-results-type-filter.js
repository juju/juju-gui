/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

describe('SearchResultsTypeFilter', function() {
  var FilterItem;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('search-results-type-filter', function() { done(); });
  });

  beforeEach(function() {
    FilterItem = juju.components.SearchResultsTypeFilter.prototype.FilterItem;
  });

  it('can render a type filter', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsTypeFilter
        changeState={changeState}
        currentType={null} />);
    assert.deepEqual(output,
      <nav className="six-col list-block__type">
        <ul>
          <FilterItem
            key="all"
            label="All"
            selected={true}
            action={output.props.children.props.children[0].props.action} />
          <FilterItem
            key="charms"
            label="Charms"
            selected={false}
            action={output.props.children.props.children[1].props.action} />
          <FilterItem
            key="bundles"
            label="Bundles"
            selected={false}
            action={output.props.children.props.children[2].props.action} />
        </ul>
      </nav>);
  });

  it('can show a filter as active', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsTypeFilter
        changeState={changeState}
        currentType='bundle' />);
    assert.deepEqual(output,
      <nav className="six-col list-block__type">
        <ul>
          <FilterItem
            key="all"
            label="All"
            selected={false}
            action={output.props.children.props.children[0].props.action} />
          <FilterItem
            key="charms"
            label="Charms"
            selected={false}
            action={output.props.children.props.children[1].props.action} />
          <FilterItem
            key="bundles"
            label="Bundles"
            selected={true}
            action={output.props.children.props.children[2].props.action} />
        </ul>
      </nav>);
  });

  it('can change the state when a filter is clicked', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsTypeFilter
        changeState={changeState}
        currentType='bundle' />);
    output.props.children.props.children[1].props.action();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          type: 'charm'
        }
      }
    });
  });

  describe('FilterItem', function() {
    it('can render a filter item', function() {
      var action = sinon.spy();
      var output = jsTestUtils.shallowRender(
        <FilterItem
          label="All"
          selected={false}
          action={action} />);
      assert.deepEqual(output,
        <li className=""
            onClick={action}
            tabIndex="0" role="button">
          All
        </li>);
    });

    it('can render a selected filter item', function() {
      var action = sinon.spy();
      var output = jsTestUtils.shallowRender(
        <FilterItem
          label="All"
          selected={true}
          action={action} />);
      assert.deepEqual(output,
        <li className="selected"
            onClick={action}
            tabIndex="0" role="button">
          All
        </li>);
    });
  });
});
