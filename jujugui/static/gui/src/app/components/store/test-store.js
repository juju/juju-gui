/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Store = require('./store');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Store', function() {

  it('can render the right number of featured items', function() {
    var changeState = sinon.stub();
    var charmstoreURL = 'http://1.2.3.4/';
    var apiVersion = 'v5';
    var renderer = jsTestUtils.shallowRender(
      <Store
        apiVersion={apiVersion}
        changeState={changeState}
        charmstoreURL={charmstoreURL}
        gisf={false}
        setPageTitle={sinon.stub()} />, true);
    var output = renderer.getRenderOutput();
    assert.equal(output.props.children[0].props.children.length, 4);
  });

  it('can skip openstack feature in gisf', () => {
    const output = jsTestUtils.shallowRender(
      <Store
        apiVersion="v5"
        changeState={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        gisf={true}
        setPageTitle={sinon.stub()} />);
    assert.equal(output.props.children[0].props.children[1], null);
  });

  it('can render big data feature in the correct place', function() {
    const output = jsTestUtils.shallowRender(
      <Store
        apiVersion="v5"
        changeState={sinon.stub()}
        charmstoreURL="http://1.2.3.4/"
        gisf={true}
        setPageTitle={sinon.stub()} />);
    assert.equal(
      output.props.children[3].props.children.props.children[0]
        .props.children.props.children[0].props.children,
      'Container management');
  }),

  it('can render write-your-own correctly', function() {
    const href = 'https://www.jujucharms.com/docs/stable/authors-charm-writing';
    const output = jsTestUtils.shallowRender(
      <Store
        apiVersion={'v5'}
        changeState={sinon.stub()}
        charmstoreURL={'http://1.2.3.4/'}
        gisf={true}
        setPageTitle={sinon.stub()} />);
    const expected = (<div className="row row--write-your-own">
      <div className="wrapper">
        <div className="inner-wrapper">
          <div className="text six-col">
            <h2>Write a charm and join the ecosystem</h2>
            <p>Creating new charms it easy. Charms can be written
            in your choice of language and adapting existing
            scripts is straightforward. You can keep new charms
            private, or share them back with the community.</p>
            <p>
              <a className="link"
                href={href}
                target="_blank">
              Learn more about writing charms&nbsp;&rsaquo;
              </a></p>
          </div>
        </div>
        <div>
          <img
            src="/static/gui/build/app/assets/images/store/write-your-own.png" />
        </div>
      </div>
    </div>);
    expect(output.props.children[7]).toEqualJSX(expected);
  }),

  it('can handle clicking on an entity', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var target = {dataset: {entity: 'kibana'}};
    var output = jsTestUtils.shallowRender(
      <Store
        apiVersion="v5"
        changeState={changeState}
        charmstoreURL="http://1.2.3.4/"
        gisf={true}
        setPageTitle={sinon.stub()} />);
    var entityList = output.props.children[2].props.children.props.children[2];
    var entityItem = entityList.props.children[0].props.children;
    entityItem.props.onClick({
      stopPropagation: stopPropagation,
      target: target
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'kibana'
    });
  });

  it('can handle clicking on a search item', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var target = {
      dataset: {
        filterkey: 'tags',
        filtervalue: 'databases'
      }
    };
    var output = jsTestUtils.shallowRender(
      <Store
        apiVersion="v5"
        changeState={changeState}
        charmstoreURL="http://1.2.3.4/"
        gisf={true}
        setPageTitle={sinon.stub()} />);
    var row = output.props.children[1].props.children;
    var tagList = row.props.children[2].props.children;
    var searchItem = tagList.props.children[0].props.children[0];
    searchItem.props.onClick({
      stopPropagation: stopPropagation,
      currentTarget: target
    });
    assert.equal(changeState.callCount, 1);
    assert.equal(stopPropagation.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      root: null,
      search: {
        tags: 'databases',
        text: ''
      }
    });
  });

  it('shows different hero links in gijoe', () => {
    const output = jsTestUtils.shallowRender(
      <Store
        apiVersion={'v5'}
        changeState={sinon.stub()}
        charmstoreURL={'http://1.2.3.4/'}
        gisf={false}
        setPageTitle={sinon.stub()} />);
    assert.isDefined(
      output.props.children[0].props.children[0].props.children[1]
        .props.children[1].props.onClick);
  });
});
