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
    var icons = output.props.children[1].props.children.props.children;
    var owner = output.props.children[2].props.children.props.children[1];
    assert.deepEqual(output,
      <li className="list-block__list--item charm"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="six-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <li className="tag-list--item"
              key="tag1"
              role="button" tabIndex="0"
              onClick={tags[0].props.onClick}>
              tag1
            </li>
            <li className="tag-list--item"
              key="tag2"
              role="button" tabIndex="0"
              onClick={tags[1].props.onClick}>
              tag2
            </li>
          </ul>
        </div>
        <div className="three-col charm-logos__column list-block__column">
          <ul className="list-icons clearfix">
            {[<li className="list-icons__item tooltip"
              key="mysql"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src="juju-ui/assets/images/non-sprites/charm_160.svg"
                className="list-icons__image"
                alt="mysql" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner">
                  mysql
                </span>
              </span>
            </li>]}
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            By
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {' '}
              {item.owner}
            </span>
          </p>
        </div>
      </li>);
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
    var icons = output.props.children[1].props.children.props.children;
    var owner = output.props.children[2].props.children.props.children[1];
    assert.deepEqual(output,
      <li className="list-block__list--item charm"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="six-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <span>{' '}</span>
          </ul>
        </div>
        <div className="three-col charm-logos__column list-block__column">
          <ul className="list-icons clearfix">
            {[<li className="list-icons__item tooltip"
              key="mysql"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src="juju-ui/assets/images/non-sprites/charm_160.svg"
                className="list-icons__image"
                alt="mysql" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner">
                  mysql
                </span>
              </span>
            </li>]}
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            By
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {' '}
              {item.owner}
            </span>
          </p>
        </div>
      </li>);
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
          changeState={changeState}
          key={item.storeId}
          item={item} />);
    var icons = output.props.children[1].props.children.props.children;
    var owner = output.props.children[2].props.children.props.children[1];
    assert.deepEqual(output,
      <li className="list-block__list--item bundle"
          tabIndex="0" role="button"
          onClick={output.props.onClick}>
        <div className="six-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <span>{' '}</span>
          </ul>
        </div>
        <div className="three-col charm-logos__column list-block__column">
          <ul className="list-icons clearfix">
            <li className="list-icons__item tooltip"
              key="wordpress"
              role="button" tabIndex="0"
              onClick={icons[0].props.onClick}>
              <img src="wordpress.svg"
                className="list-icons__image"
                alt="wordpress" />
              <span className="tooltip__tooltip">
                <span className="tooltip__inner">
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
                <span className="tooltip__inner">
                  apache2
                </span>
              </span>
            </li>
          </ul>
        </div>
        <div className={
          'prepend-one two-col owner__column list-block__column last-col'}>
          <p className="cell">
            By
            <span className="link"
              onClick={owner.props.onClick}
              role="button"
              tabIndex="0">
              {' '}
              {item.owner}
            </span>
          </p>
        </div>
      </li>);
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
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'entity-details',
          id: '~test-owner/mysql'
        }
      }
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
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          search: null,
          tags: 'tag1'
        }
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
    output.props.children[2].props.children.props.children[1]
        .props.onClick({stopPropagation: stopPropagation});
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          search: null,
          owner: 'test-owner'
        }
      }
    });
  });
});
