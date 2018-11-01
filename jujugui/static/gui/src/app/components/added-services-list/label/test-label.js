/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const enzyme = require('enzyme');
const React = require('react');

const AddedServicesLabel = require('./label');

describe('AddedServicesLabel', () => {
  const bundleURL = 'elasticsearch-cluster/bundle/17';

  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <AddedServicesLabel
        bundleURL={options.bundleURL || bundleURL}
        changeState={options.changeState || sinon.stub()}
      />
    );

  it('renders', () => {
    const component = renderComponent();
    expect(component).toMatchSnapshot();
  });

  it('calls to show readme on click', () => {
    const changeState = sinon.stub();
    const component = renderComponent({changeState});
    component
      .find('.inspector-view__label-link-list li')
      .at(0)
      .simulate('click');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {store: bundleURL});
  });

  it('calls to show post deployment on click', () => {
    const changeState = sinon.stub();
    const component = renderComponent({changeState});
    component
      .find('.inspector-view__label-link-list li')
      .at(1)
      .simulate('click');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      postDeploymentPanel: bundleURL
    });
  });

  it('supports local bundle urls', () => {
    const name = 'local-bundle (1)';
    const component = renderComponent({bundleURL: name});
    assert.equal(component.find('.inspector-view__label-name').text(), name);
  });

  it('supports old school bundle urls for readme links', () => {
    const changeState = sinon.stub();
    const component = renderComponent({
      changeState,
      bundleURL: 'cs:bundle/wiki-simple-4'
    });
    component
      .find('.inspector-view__label-link-list li')
      .at(0)
      .simulate('click');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {store: 'wiki-simple/bundle/4'});
  });

  it('supports old school bundle urls for post deployment links', () => {
    const changeState = sinon.stub();
    const component = renderComponent({
      changeState,
      bundleURL: 'cs:bundle/wiki-simple-4'
    });
    component
      .find('.inspector-view__label-link-list li')
      .at(1)
      .simulate('click');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      postDeploymentPanel: 'wiki-simple/bundle/4'
    });
  });
});
