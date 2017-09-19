/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SearchResultsTypeFilter = require('./type-filter');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('SearchResultsTypeFilter', function() {

  it('can render a type filter', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <SearchResultsTypeFilter
        changeState={changeState}
        currentType={null} />);
    assert.deepEqual(output,
      <nav className="six-col list-block__type">
        <ul>
          <li className="selected"
            onClick={output.props.children.props.children[0].props.onClick}
            key="All"
            tabIndex="0" role="button">
            All
          </li>
          <li className=""
            onClick={output.props.children.props.children[1].props.onClick}
            key="Charms"
            tabIndex="0" role="button">
            Charms
          </li>
          <li className=""
            onClick={output.props.children.props.children[2].props.onClick}
            key="Bundles"
            tabIndex="0" role="button">
            Bundles
          </li>
        </ul>
      </nav>);
  });

  it('can show a filter as active', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <SearchResultsTypeFilter
        changeState={changeState}
        currentType='bundle' />);
    assert.deepEqual(output,
      <nav className="six-col list-block__type">
        <ul>
          <li className=""
            onClick={output.props.children.props.children[0].props.onClick}
            key="All"
            tabIndex="0" role="button">
            All
          </li>
          <li className=""
            onClick={output.props.children.props.children[1].props.onClick}
            key="Charms"
            tabIndex="0" role="button">
            Charms
          </li>
          <li className="selected"
            onClick={output.props.children.props.children[2].props.onClick}
            key="Bundles"
            tabIndex="0" role="button">
            Bundles
          </li>
        </ul>
      </nav>);
  });

  it('can change the state when a filter is clicked', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <SearchResultsTypeFilter
        changeState={changeState}
        currentType='bundle' />);
    output.props.children.props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        type: 'charm'
      }
    });
  });
});
