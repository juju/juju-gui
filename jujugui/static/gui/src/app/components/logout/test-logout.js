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

describe('Logout', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('logout-component', () => { done(); });
  });

  it('renders properly for regular logout', () => {
    const doCharmstoreLogout = sinon.stub().returns(false);
    const logoutUrl = 'http://logout';
    const charmstoreLogoutUrl = 'http://charmstorelogout';
    const output = jsTestUtils.shallowRender(
      <juju.components.Logout
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
      <juju.components.Logout
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
      <juju.components.Logout
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
      <juju.components.Logout
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
      <juju.components.Logout
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
