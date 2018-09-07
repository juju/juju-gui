'use strict';

const React = require('react');
const enzyme = require('enzyme');

const SearchResultsTypeFilter = require('./type-filter');

describe('SearchResultsTypeFilter', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <SearchResultsTypeFilter
      changeState={options.changeState || sinon.stub()}
      currentType={options.currentType || null} />
  );

  it('can render a type filter', function() {
    const wrapper = renderComponent();
    const expected = (
      <nav className="six-col list-block__type">
        <ul>
          <li className="selected"
            key="All"
            onClick={wrapper.find('li').at(0).prop('onClick')}
            role="button" tabIndex="0">
            All
          </li>
          <li className=""
            key="Charms"
            onClick={wrapper.find('li').at(1).prop('onClick')}
            role="button" tabIndex="0">
            Charms
          </li>
          <li className=""
            key="Bundles"
            onClick={wrapper.find('li').at(2).prop('onClick')}
            role="button" tabIndex="0">
            Bundles
          </li>
        </ul>
      </nav>);
    assert.compareJSX(wrapper, expected);
  });

  it('can show a filter as active', function() {
    const wrapper = renderComponent({ currentType: 'bundle' });
    assert.equal(
      wrapper.find('li').at(2).prop('className').includes('selected'), true);
  });

  it('can change the state when a filter is clicked', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('li').at(1).simulate('click');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        type: 'charm'
      }
    });
  });
});
