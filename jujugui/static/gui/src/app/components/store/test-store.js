/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Store = require('./store');

describe('Store', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Store
      apiVersion={options.apiVersion || 'v5'}
      changeState={options.changeState || sinon.stub()}
      charmstoreURL={options.charmstoreURL || 'http://1.2.3.4/'}
      gisf={options.gisf === undefined ? true : options.gisf}
      setPageTitle={options.setPageTitle || sinon.stub()} />
  );

  it('can render the right items for gij', function() {
    const wrapper = renderComponent({ gisf: false });
    assert.equal(wrapper.find('.box--feature').length, 2);
    assert.equal(wrapper.find('.box--kubernetes').length, 1);
    assert.equal(wrapper.find('.box--openstack').length, 1);
    assert.equal(wrapper.find('.box--hadoop').length, 0);
    assert.equal(wrapper.find('ExpertStoreCard').length, 1);
  });

  it('can render the right items for gisf', function() {
    const wrapper = renderComponent({ gisf: true });
    assert.equal(wrapper.find('.box--feature').length, 2);
    assert.equal(wrapper.find('.box--kubernetes').length, 1);
    assert.equal(wrapper.find('.box--openstack').length, 0);
    assert.equal(wrapper.find('.box--hadoop').length, 1);
    assert.equal(wrapper.find('ExpertStoreCard').length, 1);
  });

  it('can render write-your-own correctly', function() {
    const href = 'https://www.jujucharms.com/docs/stable/authors-charm-writing';
    const wrapper = renderComponent();
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
    assert.compareJSX(wrapper.find('.row--write-your-own'), expected);
  }),

  it('can handle clicking on an entity', function() {
    var changeState = sinon.stub();
    var stopPropagation = sinon.stub();
    var target = {dataset: {entity: 'kibana'}};
    const wrapper = renderComponent({ changeState });
    wrapper.find('.featured-entity__link[data-entity="kibana"]').simulate('click', {
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
    const wrapper = renderComponent({ changeState });
    wrapper.find('.link[data-filtervalue="databases"]').at(0).simulate('click', {
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
});
