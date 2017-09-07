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
  let acl, item, generatePath, setStagedEntity;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('search-results-item', function() { done(); });
  });

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
    setStagedEntity = sinon.stub();
  });

  it('can render an item', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    const tags = output.props.children[1].props.children[1].props.children;
    const series = output.props.children[2].props.children.props.children;
    const icons = output.props.children[3].props.children.props.children;
    const owner = output.props.children[4].props.children.props.children[1];
    const deploy = output.props.children[5].props.children;
    var expected = (
      <li className="list-block__list--item charm">
        <a className="list-block__list--item-main-link"
          href="/u/spinach/apache2"
          onClick={output.props.children[0].props.onClick}></a>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            mysql
            <span className="special-flag"></span>
          </h3>
          <ul className="tag-list">
            <li className="tag-list--item">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={tags[0].props.children.props.onClick}>
                tag1
              </a>
            </li>
            <li className="tag-list--item">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={tags[1].props.children.props.onClick}>
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
                  onClick={series[0].props.children.props.onClick}>vivid</a>
              </li>,
              <li className="list-series__item"
                key="wily">
                <a className="list-block__list--item-link"
                  href="/u/spinach/apache2"
                  onClick={series[1].props.children.props.onClick}>wily</a>
              </li>
            ]}
          </ul>
        </div>
        <div className="charm-logos__column list-block__column one-col">
          <ul className="list-icons clearfix">
            {[
              <li className="list-icons__item tooltip"
                key="mysql">
                <a className="list-block__list--item-link"
                  href="/u/spinach/apache2"
                  onClick={icons[0].props.children.props.onClick}>
                  <img src={
                    'static/gui/build/app/assets/images/non-sprites/' +
                    'charm_160.svg'}
                  className="list-icons__image"
                  alt="mysql" />
                  <span className="tooltip__tooltip">
                    <span className="tooltip__inner tooltip__inner--down">
                      mysql
                    </span>
                  </span>
                </a>
              </li>]}
          </ul>
        </div>
        <div className="two-col owner__column list-block__column">
          <p className="cell">
            {'By '}
            <a className="list-block__list--item-link"
              href="/u/spinach/apache2"
              onClick={owner.props.onClick}
              title="See other charms and bundles by test-owner">
              {item.owner}
            </a>
          </p>
        </div>
        <div className="one-col last-col list-block__list--item-deploy">
          <juju.components.GenericButton
            extraClasses="list-block__list--item-deploy-link"
            action={deploy.props.action}
            disabled={false}
            type="inline-neutral">
            <juju.components.SvgIcon
              name="add-icon"
              size="16" />
          </juju.components.GenericButton>
        </div>
      </li>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render an item with defaults for missing props', function() {
    var changeState = sinon.stub();
    item.series = [];
    item.tags = null;
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    const icons = output.props.children[3].props.children.props.children;
    const owner = output.props.children[4].props.children.props.children[1];
    const deploy = output.props.children[5].props.children;
    var expected = (
      <li className="list-block__list--item charm">
        <a className="list-block__list--item-main-link"
          href="/u/spinach/apache2"
          onClick={output.props.children[0].props.onClick}></a>
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
            {[
              <li className="list-icons__item tooltip"
                key="mysql">
                <a className="list-block__list--item-link"
                  href="/u/spinach/apache2"
                  onClick={icons[0].props.children.props.onClick}>
                  <img src={
                    'static/gui/build/app/assets/images/non-sprites/' +
                    'charm_160.svg'}
                  className="list-icons__image"
                  alt="mysql" />
                  <span className="tooltip__tooltip">
                    <span className="tooltip__inner tooltip__inner--down">
                      mysql
                    </span>
                  </span>
                </a>
              </li>]}
          </ul>
        </div>
        <div className="two-col owner__column list-block__column">
          <p className="cell">
            {'By '}
            <a className="list-block__list--item-link"
              href="/u/spinach/apache2"
              onClick={owner.props.onClick}
              title="See other charms and bundles by test-owner">
              {item.owner}
            </a>
          </p>
        </div>
        <div className="one-col last-col list-block__list--item-deploy">
          <juju.components.GenericButton
            extraClasses="list-block__list--item-deploy-link"
            action={deploy.props.action}
            disabled={false}
            type="inline-neutral">
            <juju.components.SvgIcon
              name="add-icon"
              size="16" />
          </juju.components.GenericButton>
        </div>
      </li>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render icons for a bundle', function() {
    var changeState = sinon.stub();
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
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    const icons = output.props.children[3].props.children.props.children;
    const owner = output.props.children[4].props.children.props.children[1];
    const deploy = output.props.children[5].props.children;
    var expected = (
      <li className="list-block__list--item bundle">
        <a className="list-block__list--item-main-link"
          href="/u/spinach/apache2"
          onClick={output.props.children[0].props.onClick}></a>
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
              key="wordpress">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={icons[0].props.children.props.onClick}>
                <img src="wordpress.svg"
                  className="list-icons__image"
                  alt="wordpress" />
                <span className="tooltip__tooltip">
                  <span className="tooltip__inner tooltip__inner--down">
                    wordpress
                  </span>
                </span>
              </a>
            </li>
            <li className="list-icons__item tooltip"
              key="apache2">
              <a className="list-block__list--item-link"
                href="/u/spinach/apache2"
                onClick={icons[1].props.children.props.onClick}>
                <img src="apache2.svg"
                  className="list-icons__image"
                  alt="apache2" />
                <span className="tooltip__tooltip">
                  <span className="tooltip__inner tooltip__inner--down">
                    apache2
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </div>
        <div className="two-col owner__column list-block__column">
          <p className="cell">
            {'By '}
            <a className="list-block__list--item-link"
              href="/u/spinach/apache2"
              onClick={owner.props.onClick}
              title="See other charms and bundles by test-owner">
              {item.owner}
            </a>
          </p>
        </div>
        <div className="one-col last-col list-block__list--item-deploy">
          <juju.components.GenericButton
            extraClasses="list-block__list--item-deploy-link"
            action={deploy.props.action}
            disabled={false}
            type="inline-neutral">
            <juju.components.SvgIcon
              name="add-icon"
              size="16" />
          </juju.components.GenericButton>
        </div>
      </li>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can handle clicking on an item', function() {
    var changeState = sinon.stub();
    var preventDefault = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    output.props.children[0].props.onClick({preventDefault: preventDefault});
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
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    const series = output.props.children[2].props.children.props.children;
    series[0].props.children.props.onClick({preventDefault: preventDefault});
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      profile: null,
      search: null,
      store: 'u/test-owner/mysql/vivid'
    });
    series[1].props.children.props.onClick({preventDefault: preventDefault});
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
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    output.props.children[1].props.children[1].props.children[0].props.children
      .props.onClick({preventDefault: preventDefault});
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
    const output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    output.props.children[4].props.children.props.children[1]
      .props.onClick({preventDefault: preventDefault});
    assert.equal(changeState.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: null,
      profile: 'test-owner'
    });
  });

  it('gives the correct class names for charm list item', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={sinon.stub()}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);

    const seriesClass = output.props.children[2].props.className;
    const iconsClass = output.props.children[3].props.className;
    assert.equal(seriesClass, 'series__column four-col');
    assert.equal(iconsClass,
      'charm-logos__column list-block__column one-col');
  });

  it('gives the correct class names for bundle list item', function() {
    item.type = 'bundle';
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={sinon.stub()}
        deployTarget={sinon.stub()}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);

    const seriesClass = output.props.children[2].props.className;
    const iconsClass = output.props.children[3].props.className;
    assert.equal(seriesClass, 'series__column two-col');
    assert.equal(iconsClass,
      'charm-logos__column list-block__column three-col');
  });

  it('can deploy an entity', function() {
    const changeState = sinon.stub();
    const deployTarget = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsItem
        acl={acl}
        changeState={changeState}
        deployTarget={deployTarget}
        generatePath={generatePath}
        item={item}
        setStagedEntity={setStagedEntity} />);
    output.props.children[5].props.children.props.action();
    assert.equal(changeState.callCount, 1);
    assert.equal(deployTarget.callCount, 1);
    assert.deepEqual(deployTarget.args[0][0], 'mysql');
  });
});
