/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const EntityContentRelations = require('./relations');
const SvgIcon = require('../../../svg-icon/svg-icon');

const jsTestUtils = require('../../../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('EntityContentRelations', function() {
  var mockEntity;

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can render a list of relations', function() {
    var changeState = sinon.spy();
    var output = jsTestUtils.shallowRender(
      <EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var expected = (
      <div className="section entity-relations" id="relations">
        <h3 className="section__title">
          Relations
          <a href="https://jujucharms.com/docs/stable/charms-relations"
            target="_blank">
            <SvgIcon name="help_16" size="16" />
          </a>
        </h3>
        <ul className="section__list" ref="list">
          <li className="link section__list-item"
            key="http"
            onClick={output.props.children[1].props.children[0].props.onClick}
            role="button"
            tabIndex="0">
            {'http'}: {'http'}
          </li>
          <li className="link section__list-item"
            key="cache"
            onClick={output.props.children[1].props.children[1].props.onClick}
            role="button"
            tabIndex="0">
            {'cache'}: {'cache'}
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('handles null relations with aplomb', function() {
    var provides = mockEntity.get('relations').provides;
    mockEntity.set('relations', {
      requires: null,
      provides: provides
    });
    var changeState = sinon.spy();
    var output = testUtils.renderIntoDocument(
      <EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var expectedLength = Object.keys(provides).length;
    assert.equal(
      output.refs.list.getElementsByClassName('section__list-item').length,
      expectedLength);
  });

  it('can navigate to a relation', function() {
    var changeState = sinon.spy();
    var output = testUtils.renderIntoDocument(
      <EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var item = output.refs.list.getElementsByClassName('section__list-item')[0];
    testUtils.Simulate.click(item);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        text: '',
        provides: 'http'
      },
      store: null
    });
  });

  it('can render a show more button when more than 2 relations are available',
    () => {
      const changeState = sinon.spy();
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const renderer = jsTestUtils.shallowRender(
        <EntityContentRelations
          changeState={changeState}
          relations={mockEntity.get('relations')} />, true);
      const output = renderer.getRenderOutput();
      const instance = renderer.getMountedInstance();
      const expected = (
        <div className="section entity-relations" id="relations">
          <h3 className="section__title">
            Relations
            <a href="https://jujucharms.com/docs/stable/charms-relations"
              target="_blank">
              <SvgIcon name="help_16" size="16" />
            </a>
          </h3>
          <ul className="section__list" ref="list">
            <li className="link section__list-item"
              key="http"
              onClick={output.props.children[1].props.children[0].props.onClick}
              role="button"
              tabIndex="0">
              {'http'}: {'http'}
            </li>
            <li className="link section__list-item"
              key="http2"
              onClick={output.props.children[1].props.children[1].props.onClick}
              role="button"
              tabIndex="0">
              {'http2'}: {'http2'}
            </li>
            <li className="link section__list-item hidden"
              key="cache"
              onClick={output.props.children[1].props.children[2].props.onClick}
              role="button"
              tabIndex="0">
              {'cache'}: {'cache'}
            </li>
            <li className="section__list-item">
              <button className="button--inline-neutral"
                onClick={instance._handleViewMore.bind(instance)}
                role="button">View more relations</button>
            </li>
          </ul>
        </div>);
      expect(output).toEqualJSX(expected);
    }
  );

  it('can shows more and show a fewer button',
    () => {
      const changeState = sinon.spy();
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const renderer = jsTestUtils.shallowRender(
        <EntityContentRelations
          changeState={changeState}
          relations={mockEntity.get('relations')} />, true);
      const instance = renderer.getMountedInstance();
      instance._handleViewMore();
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="section entity-relations" id="relations">
          <h3 className="section__title">
            Relations
            <a href="https://jujucharms.com/docs/stable/charms-relations"
              target="_blank">
              <SvgIcon name="help_16" size="16" />
            </a>
          </h3>
          <ul className="section__list" ref="list">
            <li className="link section__list-item"
              key="http"
              onClick={output.props.children[1].props.children[0].props.onClick}
              role="button"
              tabIndex="0">
              {'http'}: {'http'}
            </li>
            <li className="link section__list-item"
              key="http2"
              onClick={output.props.children[1].props.children[1].props.onClick}
              role="button"
              tabIndex="0">
              {'http2'}: {'http2'}
            </li>
            <li className="link section__list-item"
              key="cache"
              onClick={output.props.children[1].props.children[2].props.onClick}
              role="button"
              tabIndex="0">
              {'cache'}: {'cache'}
            </li>
            <li className="section__list-item">
              <button className="button--inline-neutral"
                onClick={instance._handleRelationClick.bind(instance)}
                role="button">View fewer relations</button>
            </li>
          </ul>
        </div>);
      expect(output).toEqualJSX(expected);
    }
  );
});
