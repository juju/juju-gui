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

describe('SearchResultsItem', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('search-results-item', function() { done(); });
  });

  it('can render an item', function() {
    var changeState = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [{name: 'vivid'}, {name: 'wily'}]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    var tags = output.props.children[0].props.children[1].props.children;
    var series = output.props.children[1].props.children.props.children;
    var icons = output.props.children[2].props.children.props.children;
    var owner = output.props.children[3].props.children.props.children[1];
    var expected = (
      <li className="list-block__list--item charm"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <li className="tag-list--item"
              key="tag10"
              role="button" tabIndex="0"
              onClick={tags[0].props.onClick}>
              tag1
             </li>
            <li className="tag-list--item"
              key="tag21"
              role="button" tabIndex="0"
              onClick={tags[1].props.onClick}>
              tag2
            </li>
          </ul>
        </div>
        <div className="series__column four-col">
          <ul className="list-series">
            {[
              <li className="list-series__item"
                key="vivid">
                <a onClick={series[0].props.children.props.onClick}>vivid</a>
              </li>,
              <li className="list-series__item"
                key="wily">
                <a onClick={series[1].props.children.props.onClick}>wily</a>
              </li>
            ]}
          </ul>
        </div>
        <div className="charm-logos__column list-block__column one-col">
          <ul className="list-icons clearfix">
            {[<li className="list-icons__item tooltip"
              key="mysql"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src=
                {'static/gui/build/app/assets/images/non-sprites/charm_160.svg'}
                className="list-icons__image"
                alt="mysql" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner tooltip__inner--down">
                  mysql
                </span>
              </span>
            </li>]}
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            {'By '}
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {item.owner}
            </span>
          </p>
        </div>
      </li>
    );
    assert.deepEqual(output, expected);
  });

  it('can render an item with defaults for missing props', function() {
    var changeState = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      series: []
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    var icons = output.props.children[2].props.children.props.children;
    var owner = output.props.children[3].props.children.props.children[1];
    var expected = (
      <li className="list-block__list--item charm"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <span>{' '}</span>
          </ul>
        </div>
        <div className="series__column four-col">
          <ul className="list-series">
            <li>&nbsp;</li>
          </ul>
        </div>
        <div className="charm-logos__column list-block__column one-col">
          <ul className="list-icons clearfix">
            {[<li className="list-icons__item tooltip"
              key="mysql"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src={
                'static/gui/build/app/assets/images/non-sprites/charm_160.svg'}
                className="list-icons__image"
                alt="mysql" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner tooltip__inner--down">
                  mysql
                </span>
              </span>
            </li>]}
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            {'By '}
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {item.owner}
            </span>
          </p>
        </div>
      </li>
    );
    assert.deepEqual(output, expected);
  });

  it('can render icons for a bundle', function() {
    var changeState = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'bundle',
      series: [],
      applications: [{
        displayName: 'wordpress',
        id: 'cs:wordpress',
        iconPath: 'wordpress.svg'
      }, {
        displayName: 'apache2',
        id: 'cs:apache2',
        iconPath: 'apache2.svg'
      }]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    var icons = output.props.children[2].props.children.props.children;
    var owner = output.props.children[3].props.children.props.children[1];
    var expected = (
      <li className="list-block__list--item bundle"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <span>{' '}</span>
          </ul>
        </div>
        <div className="series__column two-col">
          <ul className="list-series">
            <li>&nbsp;</li>
          </ul>
        </div>
        <div className="charm-logos__column list-block__column three-col">
          <ul className="list-icons clearfix">
            <li className="list-icons__item tooltip"
              key="wordpress"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src="wordpress.svg"
                className="list-icons__image"
                alt="wordpress" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner tooltip__inner--down">
                  wordpress
                </span>
              </span>
            </li>
            <li className="list-icons__item tooltip"
              key="apache2"
              role="button" tabIndex="0"
              onClick={icons[1].props.onClick}>
              <img src="apache2.svg"
                className="list-icons__image"
                alt="apache2" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner tooltip__inner--down">
                  apache2
                </span>
              </span>
            </li>
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            {'By '}
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {item.owner}
            </span>
          </p>
        </div>
      </li>
    );
    assert.deepEqual(output, expected);
  });

  it('can handle clicking on an item', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [{name: 'vivid'}, {name: 'wily'}]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    output.props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: null,
      store: 'mysql'
    });
  });

  it('can handle clicking on a series', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var item = {
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
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    var series = output.props.children[1].props.children.props.children;
    series[0].props.children.props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: null,
      store: 'u/test-owner/mysql/vivid'
    });
    series[1].props.children.props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 2);
    assert.equal(stopPropagation.callCount, 2);
    assert.deepEqual(changeState.args[1][0], {
      search: null,
      store: 'u/test-owner/mysql/wily'
    });
  });

  it('can handle clicking on a tag', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [{name: 'vivid'}, {name: 'wily'}]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    output.props.children[0].props.children[1].props.children[0]
        .props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
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
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [{name: 'vivid'}, {name: 'wily'}]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    output.props.children[3].props.children.props.children[1]
        .props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        owner: 'test-owner',
        provides: null,
        requires: null,
        series: null,
        tags: null,
        text: '',
        type: null
      }
    });
  });

  it('gives the correct class names for charm list item', function() {
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'charm',
      tags: ['tag1', 'tag2'],
      series: [{name: 'vivid'}, {name: 'wily'}]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={sinon.stub()}
          item={item} />);

    var seriesClass = output.props.children[1].props.className;
    var iconsClass = output.props.children[2].props.className;
    assert.equal(seriesClass, 'series__column four-col');
    assert.equal(iconsClass,
      'charm-logos__column list-block__column one-col');
  });

  it('gives the correct class names for bundle list item', function() {
    var item = {
      name: 'mysql',
      displayName: 'mysql',
      special: true,
      url: 'http://example.com/mysql',
      downloads: 1000,
      owner: 'test-owner',
      promulgated: true,
      id: 'mysql',
      storeId: '~test-owner/mysql',
      type: 'bundle',
      series: [],
      services: [{
        displayName: 'wordpress',
        id: 'cs:wordpress',
        iconPath: 'wordpress.svg'
      }, {
        displayName: 'apache2',
        id: 'cs:apache2',
        iconPath: 'apache2.svg'
      }]
    };
    var output = jsTestUtils.shallowRender(
        <juju.components.SearchResultsItem
          changeState={sinon.stub()}
          item={item} />);

    var seriesClass = output.props.children[1].props.className;
    var iconsClass = output.props.children[2].props.className;
    assert.equal(seriesClass, 'series__column two-col');
    assert.equal(iconsClass,
      'charm-logos__column list-block__column three-col');
  });
});
