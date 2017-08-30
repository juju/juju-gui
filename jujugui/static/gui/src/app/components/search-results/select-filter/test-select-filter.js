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
        label="Sort by"
        filter='sort'
        items={sortItems}
        currentValue={null} />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        {'Sort by'}:
        <select onChange={output.props.children[2].props.onChange}
          defaultValue={null}>
          <option value="-downloads" key="-downloads">Most popular</option>
          <option value="downloads" key="downloads">Least popular</option>
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
        label="Sort by"
        filter='sort'
        items={sortItems}
        currentValue="downloads" />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        {'Sort by'}:
        <select onChange={output.props.children[2].props.onChange}
          defaultValue="downloads">
          <option value="-downloads" key="-downloads">Most popular</option>
          <option value="downloads" key="downloads">Least popular</option>
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
        label="Sort by"
        filter='sort'
        items={sortItems}
        currentValue={null} />);
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
