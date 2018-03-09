/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SearchResultsSelectFilter = require('./select-filter');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('SearchResultsSelectFilter', function() {

  it('can render a select filter', function() {
    var changeState = sinon.stub();
    var sortItems = [{
      label: 'Most popular',
      value: '-downloads'
    }, {
      label: 'Least popular',
      value: 'downloads'
    }];
    var output = jsTestUtils.shallowRender(
      <SearchResultsSelectFilter
        changeState={changeState}
        currentValue={null}
        filter='sort'
        items={sortItems}
        label="Sort by" />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        {'Sort by'}:
        <select defaultValue={null}
          onChange={output.props.children[2].props.onChange}>
          <option key="-downloads" value="-downloads">Most popular</option>
          <option key="downloads" value="downloads">Least popular</option>
        </select>
      </div>);
  });

  it('can select an option', function() {
    var changeState = sinon.stub();
    var sortItems = [{
      label: 'Most popular',
      value: '-downloads'
    }, {
      label: 'Least popular',
      value: 'downloads'
    }];
    var output = jsTestUtils.shallowRender(
      <SearchResultsSelectFilter
        changeState={changeState}
        currentValue="downloads"
        filter='sort'
        items={sortItems}
        label="Sort by" />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        {'Sort by'}:
        <select defaultValue="downloads"
          onChange={output.props.children[2].props.onChange}>
          <option key="-downloads" value="-downloads">Most popular</option>
          <option key="downloads" value="downloads">Least popular</option>
        </select>
      </div>);
  });

  it('can change the search state', function() {
    var changeState = sinon.stub();
    var sortItems = [{
      label: 'Most popular',
      value: '-downloads'
    }, {
      label: 'Least popular',
      value: 'downloads'
    }];
    var output = jsTestUtils.shallowRender(
      <SearchResultsSelectFilter
        changeState={changeState}
        currentValue={null}
        filter='sort'
        items={sortItems}
        label="Sort by" />);
    output.props.children[2].props.onChange({
      currentTarget: {
        value: 'downloads'
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        sort: 'downloads'
      }
    });
  });
});
