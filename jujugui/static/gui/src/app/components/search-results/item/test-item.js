/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const GenericButton = require('../../generic-button/generic-button');
const IconList = require('../../icon-list/icon-list');
const SearchResultsItem = require('./item');
const SvgIcon = require('../../svg-icon/svg-icon');
const urls = require('../../../jujulib/urls');


describe('SearchResultsItem', function() {
  let acl, item, generatePath, windowJujulib;

  const renderComponent = (options = {}) => enzyme.shallow(
    <SearchResultsItem
      acl={options.acl || acl}
      addToModel={options.addToModel || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      generatePath={options.generatePath || generatePath}
      item={options.item || item} />
  );

  beforeEach(() => {
    windowJujulib = window.jujulib;
    window.jujulib = {
      URL: urls.URL
    };
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

  afterEach(() => {
    window.jujulib = windowJujulib;
  });

  it('can render an item', function() {
    const wrapper = renderComponent();
    const tagLinks = wrapper.find('.tag-list a');
    const seriesLinks = wrapper.find('.list-series__item a');
    var expected = (
      <li className="list-block__list--item charm">
        <a className="list-block__list--item-main-link"
          href="/u/spinach/apache2"
          onClick={
            wrapper.find('.list-block__list--item-main-link').prop('onClick')}></a>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <li className="tag-list--item">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={tagLinks.at(0).prop('onClick')}>
                tag1
              </a>
            </li>
            <li className="tag-list--item">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={tagLinks.at(1).prop('onClick')}>
                tag2
              </a>
            </li>
          </ul>
        </div>
        <div className="series__column four-col">
          <ul className="list-series">
            {[
              <li className="list-series__item"
                key="vivid">
                <a className="list-block__list--item-link"
                  href="/u/spinach/apache2"
                  onClick={seriesLinks.at(0).prop('onClick')}>vivid</a>
              </li>,
              <li className="list-series__item"
                key="wily">
                <a className="list-block__list--item-link"
                  href="/u/spinach/apache2"
                  onClick={seriesLinks.at(1).prop('onClick')}>wily</a>
              </li>
            ]}
          </ul>
        </div>
        <div className="charm-logos__column list-block__column one-col">
          <IconList
            applications={[item]}
            changeState={sinon.stub()}
            generatePath={sinon.stub()} />
        </div>
        <div className="two-col owner__column list-block__column">
          <p className="cell">
            {'By '}
            <a className="list-block__list--item-link"
              href="/u/spinach/apache2"
              onClick={wrapper.find('.owner__column a').prop('onClick')}
              title="See other charms and bundles by test-owner">
              {item.owner}
            </a>
          </p>
        </div>
        <div className="one-col last-col list-block__list--item-deploy">
          <GenericButton
            action={wrapper.find('GenericButton').prop('action')}
            disabled={false}
            extraClasses="list-block__list--item-deploy-link"
            type="inline-neutral">
            <SvgIcon
              name="add-icon"
              size="16" />
          </GenericButton>
        </div>
      </li>
    );
    assert.compareJSX(wrapper, expected);
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
    const wrapper = renderComponent({ changeState });
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

  it('can handle clicking on a series', function() {
    var changeState = sinon.stub();
    var preventDefault = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('.list-series__item a').at(0).simulate('click', {
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      search: null,
      store: 'u/test-owner/mysql/vivid'
    });
    wrapper.find('.list-series__item a').at(1).simulate('click', {
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 2);
    assert.equal(preventDefault.callCount, 2);
    assert.deepEqual(changeState.args[1][0], {
      profile: null,
      search: null,
      store: 'u/test-owner/mysql/wily'
    });
  });

  it('can handle clicking on a tag', function() {
    var changeState = sinon.stub();
    var preventDefault = sinon.stub();
    const wrapper = renderComponent({ changeState });
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
    const wrapper = renderComponent({ changeState });
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
    wrapper.find('GenericButton').props().action();
    assert.equal(changeState.callCount, 1);
    assert.equal(addToModel.callCount, 1);
    assert.deepEqual(addToModel.args[0][0], 'mysql');
  });
});
