/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');


const Analytics = require('test/fake-analytics');
const SearchResultsItem = require('./item');

describe('SearchResultsItem', function() {
  let acl, item, generatePath;

  const renderComponent = (options = {}) => enzyme.shallow(
    <SearchResultsItem
      acl={options.acl || acl}
      addToModel={options.addToModel || sinon.stub()}
      analytics={Analytics}
      changeState={options.changeState || sinon.stub()}
      generatePath={options.generatePath || generatePath}
      item={options.item || item} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/vivid/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [
        {name: 'vivid', storeId: '~test-owner/vivid/mysql'},
        {name: 'wily', storeId: '~test-owner/wily/mysql'}
      ]
    };
    generatePath = sinon.stub().returns('/u/spinach/apache2');
  });

  it('can render an item', function() {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can render an item with defaults for missing props', function() {
    item.series = [];
    item.tags = null;
    const wrapper = renderComponent();
    assert.equal(wrapper.find('.tag-list--item').length, 0);
    assert.equal(wrapper.find('.list-series__item').length, 0);
  });

  it('can render icons for a bundle', function() {
    item.type = 'bundle';
    item.series = [];
    item.tags = null;
    item.applications = [{
      displayName: 'wordpress',
      id: 'cs:wordpress',
      iconPath: 'wordpress.svg'
    }, {
      displayName: 'apache2',
      id: 'cs:apache2',
      iconPath: 'apache2.svg'
    }];
    const wrapper = renderComponent();
    assert.deepEqual(
      wrapper.find('IconList').prop('applications'), item.applications);
  });

  it('can handle clicking on an item', function() {
    var changeState = sinon.stub();
    var preventDefault = sinon.stub();
    const wrapper = renderComponent({changeState});
    wrapper.find('.list-block__list--item-main-link').simulate('click', {
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      search: null,
      store: 'mysql'
    });
  });

  it('can handle clicking on a tag', function() {
    var changeState = sinon.stub();
    var preventDefault = sinon.stub();
    const wrapper = renderComponent({changeState});
    wrapper.find('.tag-list a').at(0).simulate('click', {
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: 'tag1',
        text: '',
        type: null
      }
    });
  });

  it('can handle clicking on an owner', function() {
    const changeState = sinon.stub();
    const preventDefault = sinon.stub();
    const wrapper = renderComponent({changeState});
    wrapper.find('.owner__column a').at(0).simulate('click', {
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: null,
      profile: 'test-owner'
    });
  });

  it('gives the correct class names for charm list item', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.series__column').prop('className').includes('four-col'), true);
    assert.equal(
      wrapper.find('.charm-logos__column').prop('className').includes('one-col'), true);
  });

  it('gives the correct class names for bundle list item', function() {
    item.type = 'bundle';
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.series__column').prop('className').includes('two-col'), true);
    assert.equal(
      wrapper.find('.charm-logos__column').prop('className').includes('three-col'), true);
  });

  it('can deploy an entity', function() {
    const changeState = sinon.stub();
    const addToModel = sinon.stub();
    const wrapper = renderComponent({
      addToModel,
      changeState
    });
    wrapper.find('Button').props().action();
    assert.equal(changeState.callCount, 1);
    assert.equal(addToModel.callCount, 1);
    assert.deepEqual(addToModel.args[0][0], 'mysql');
  });
});
