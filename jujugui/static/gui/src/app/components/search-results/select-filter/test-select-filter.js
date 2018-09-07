'use strict';

const React = require('react');
const enzyme = require('enzyme');

const SearchResultsSelectFilter = require('./select-filter');

describe('SearchResultsSelectFilter', function() {
  let items;

  const renderComponent = (options = {}) => enzyme.shallow(
    <SearchResultsSelectFilter
      changeState={options.changeState || sinon.stub()}
      currentValue={options.currentValue || null}
      filter={options.filter || 'sort'}
      items={options.items || items}
      label={options.label || 'Sort by'} />
  );

  beforeEach(() => {
    items = [{
      label: 'Most popular',
      value: '-downloads'
    }, {
      label: 'Least popular',
      value: 'downloads'
    }];
  });

  it('can render a select filter', function() {
    const wrapper = renderComponent();
    const expected = (
      <div className="list-block__sort">
        {'Sort by'}:
        <select defaultValue={null}
          onChange={wrapper.find('select').prop('onChange')}>
          <option key="-downloads" value="-downloads">Most popular</option>
          <option key="downloads" value="downloads">Least popular</option>
        </select>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can select an option', function() {
    const wrapper = renderComponent({ currentValue: 'downloads' });
    assert.equal(wrapper.find('select').prop('defaultValue'), 'downloads');
  });

  it('can change the search state', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('select').simulate('change', {
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
