/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const HeaderLogo = require('./header-logo');
const SvgIcon = require('../svg-icon/svg-icon');

describe('HeaderLogo', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <HeaderLogo
      gisf={options.gisf === undefined ? true : options.gisf}
      homePath={options.homePath || '/'}
      showProfile={options.showProfile || sinon.stub()} />
  );

  it('renders', () => {
    const wrapper = renderComponent();
    const expected = (
      <a href="/"
        onClick={wrapper.prop('onClick')}
        role="button"
        title="Home">
        <SvgIcon className="svg-icon"
          height="35"
          name="juju-logo" width="90" />
      </a>);
    assert.compareJSX(wrapper, expected);
  });

  it('calls showProfile on click in gijoe', () => {
    const showProfile = sinon.stub();
    const preventDefault = sinon.stub();
    const wrapper = renderComponent({
      gisf: false,
      showProfile
    });
    // Call the click handler
    wrapper.props().onClick({preventDefault});
    assert.equal(preventDefault.callCount, 1);
    assert.equal(showProfile.callCount, 1);
  });

  it('does not call showProfile on click in gisf', () => {
    const showProfile = sinon.stub();
    const preventDefault = sinon.stub();
    const wrapper = renderComponent({ showProfile });
    // Call the click handler
    wrapper.props().onClick({preventDefault});
    assert.equal(preventDefault.callCount, 0);
    assert.equal(showProfile.callCount, 0);
  });
});
