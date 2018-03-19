/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityContentRelations = require('./relations');
const SvgIcon = require('../../../svg-icon/svg-icon');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('EntityContentRelations', function() {
  var mockEntity;

  const renderComponent = (options = {}) => enzyme.shallow(
    <EntityContentRelations
      changeState={options.changeState || sinon.stub()}
      relations={mockEntity.get('relations')} />
  );

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can render a list of relations', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="section entity-relations" id="relations">
        <h3 className="section__title">
          Relations&nbsp;
          <a href="https://jujucharms.com/docs/stable/charms-relations"
            target="_blank">
            <SvgIcon name="help_16" size="16" />
          </a>
        </h3>
        <ul className="section__list" ref="list">
          <li className="link section__list-item"
            key="http"
            onClick={wrapper.find('.section__list-item').at(0).prop('onClick')}
            role="button"
            tabIndex="0">
            {'http'}: {'http'}
          </li>
          <li className="link section__list-item"
            key="cache"
            onClick={wrapper.find('.section__list-item').at(1).prop('onClick')}
            role="button"
            tabIndex="0">
            {'cache'}: {'cache'}
          </li>
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('handles null relations with aplomb', function() {
    var provides = mockEntity.get('relations').provides;
    mockEntity.set('relations', {
      requires: null,
      provides: provides
    });
    const wrapper = renderComponent();
    var expectedLength = Object.keys(provides).length;
    assert.equal(
      wrapper.find('.section__list-item').length,
      expectedLength);
  });

  it('can navigate to a relation', function() {
    var changeState = sinon.spy();
    const wrapper = renderComponent({ changeState });
    wrapper.find('.section__list-item').at(0).simulate('click');
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
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const wrapper = renderComponent();
      const expected = (
        <button className="button--inline-neutral"
          onClick={wrapper.find('button').prop('onClick')}
          role="button">View more relations</button>);
      assert.compareJSX(wrapper.find('button'), expected);
    }
  );

  it('can shows more and show a fewer button',
    () => {
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const wrapper = renderComponent();
      const instance = wrapper.instance();
      instance._handleViewMore();
      wrapper.update();
      assert.equal(
        wrapper.find('button').children().text(), 'View fewer relations');
    }
  );
});
