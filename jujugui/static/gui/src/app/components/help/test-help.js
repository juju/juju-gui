/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Help = require('./help');

describe('Help', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Help
      changeState={options.changeState || sinon.stub()}
      displayShortcutsModal={options.displayShortcutsModal || sinon.stub()}
      gisf={options.gisf}
      sendGetRequest={options.sendGetRequest || sinon.stub()}
      staticURL={options.staticURL || ''}
      user={options.user || {user: true}} />
  );

  it('renders', () => {
    const wrapper = renderComponent({ gisf: true });
    expect(wrapper).toMatchSnapshot();
  });

  it('renders for non-gisf', () => {
    const wrapper = renderComponent({ gisf: false });
    assert.equal(wrapper.find('.link').at(0).text(), 'Read the Juju docs');
    assert.equal(
      wrapper.find('.link').at(6).prop('href'),
      'https://jujucharms.com/docs/stable/about-juju');
  });
});
