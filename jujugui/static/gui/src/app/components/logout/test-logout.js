/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Logout = require('./logout');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Logout', () => {

  it('renders properly for regular logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(false);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const output = jsTestUtils.shallowRender(
      <Logout
        charmstoreLogoutUrl={charmstoreLogoutUrl}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={sinon.stub()}
        logoutUrl={logoutUrl}
        visible={true} />);
    const expected = (
      <a className="logout-link dropdown-menu__list-item-link"
        href={logoutUrl}
        onClick={output.props.onClick}
        target="_self">Logout</a>
    );
    expect(output).toEqualJSX(expected);
  });

  it('renders properly for charmstore logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(true);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const output = jsTestUtils.shallowRender(
      <Logout
        charmstoreLogoutUrl={charmstoreLogoutUrl}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={sinon.stub()}
        logoutUrl={logoutUrl}
        visible={true} />);
    const expected = (
      <a className="logout-link dropdown-menu__list-item-link"
        href={charmstoreLogoutUrl}
        onClick={output.props.onClick}
        target="_blank">Logout</a>);
    expect(output).toEqualJSX(expected);
  });

  it('can be hidden', () => {
    const doCharmstoreLogout = sinon.stub().returns(false);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const output = jsTestUtils.shallowRender(
      <Logout
        charmstoreLogoutUrl={charmstoreLogoutUrl}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={sinon.stub()}
        logoutUrl={logoutUrl}
        visible={false} />);
    const classes = 'logout-link dropdown-menu__list-item-link ' +
      'logout-link--hidden';
    const expected = (
      <a className={classes}
        href={logoutUrl}
        onClick={output.props.onClick}
        target="_self">Logout</a>);
    expect(output).toEqualJSX(expected);
  });

  it('does not redirect to logout onClick for regular logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(false);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const locationAssign = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Logout
        charmstoreLogoutUrl={charmstoreLogoutUrl}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={locationAssign}
        logoutUrl={logoutUrl}
        visible={false} />, true);
    const instance = renderer.getMountedInstance();
    instance._handleClick();
    assert.equal(locationAssign.callCount, 0);
  });

  it('redirects to logout onClick for charmstore logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(true);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const locationAssign = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Logout
        charmstoreLogoutUrl={charmstoreLogoutUrl}
        doCharmstoreLogout={doCharmstoreLogout}
        locationAssign={locationAssign}
        logoutUrl={logoutUrl}
        visible={false} />, true);
    const instance = renderer.getMountedInstance();
    instance._handleClick();
    assert.equal(locationAssign.callCount, 1);
    assert.equal(locationAssign.args[0][0], logoutUrl);
  });
});
