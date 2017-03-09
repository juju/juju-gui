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

  it('renders properly', () => {
    var logout = sinon.stub();
    var logoutUrl = 'http://logout';
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={true}
        clearCookie={sinon.stub()}
        gisf={false}
        charmstoreLogoutUrl={logoutUrl}
        getUser={sinon.stub()}
        clearUser={sinon.stub()}/>);
    var expected = (
      <a className="link logout-link"
        href={logoutUrl}
        onClick={output.props.onClick}
        target="_blank">Logout</a>
      );
    assert.deepEqual(output, expected);
  });

  it('renders properly in gisf', () => {
    const logout = sinon.stub();
    const logoutUrl = 'http://logout';
    const gisfLogoutUrl = 'http://gisflogout';
    const output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={true}
        clearCookie={sinon.stub()}
        gisf={true}
        gisfLogout={gisfLogoutUrl}
        charmstoreLogoutUrl={logoutUrl}
        getUser={sinon.stub()}
        clearUser={sinon.stub()}/>);
    const expected = (
      <a className="link logout-link"
        href={gisfLogoutUrl}
        onClick={output.props.onClick}
        target="_blank">Logout</a>
      );
    assert.deepEqual(output, expected);
  });

  it('can be hidden', () => {
    var logout = sinon.stub();
    var logoutUrl = 'http://logout';
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={false}
        clearCookie={sinon.stub()}
        charmstoreLogoutUrl={logoutUrl}
        getUser={sinon.stub()}
        clearUser={sinon.stub()} />);
    var expected = (
      <a className="link logout-link logout-link--hidden"
        href={logoutUrl}
        onClick={output.props.onClick}
        target="_blank">Logout</a>
      );
    assert.deepEqual(output, expected);
  });

  it('calls the logout prop on click', () => {
    var logout = sinon.stub();
    var logoutUrl = 'http://logout';
    var prevent = sinon.stub();
    var clearUser = sinon.stub();
    var clearCookie = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={true}
        clearCookie={clearCookie}
        charmstoreLogoutUrl={logoutUrl}
        getUser={sinon.stub().returns(undefined)}
        clearUser={clearUser} />);
    assert.equal(logout.callCount, 0);
    output.props.onClick({ preventDefault: prevent });
    // It should clear the user and the cookie.
    assert.equal(clearUser.callCount, 1);
    assert.equal(clearCookie.callCount, 1);

    assert.equal(logout.callCount, 1);
    // preventDefault should be called if no user is defined. There is no
    // need to redirect the user if they do not need to log out.
    // The next test checks to make sure that it does in that case.
    assert.equal(prevent.callCount, 1);
  });

  it('allows storefront to handle logout if in gisf', () => {
    var logout = sinon.stub();
    var logoutUrl = 'http://logout';
    var prevent = sinon.stub();
    var clearUser = sinon.stub();
    var getUser = sinon.stub().returns(true);
    var clearCookie = sinon.stub();
    var locationAssign = sinon.stub();
    var gisfLogoutUrl = '/logout';
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={true}
        clearCookie={clearCookie}
        charmstoreLogoutUrl={logoutUrl}
        getUser={getUser}
        gisf={true}
        gisfLogout={gisfLogoutUrl}
        clearUser={clearUser}
        locationAssign={locationAssign}
        />);
    assert.equal(logout.callCount, 0);
    output.props.onClick({ preventDefault: prevent });
    // It should clear the user and the cookie.
    assert.equal(clearUser.callCount, 1);
    assert.equal(clearCookie.callCount, 1);
    assert.equal(logout.callCount, 1);
    assert.equal(prevent.callCount, 1);
    assert.equal(locationAssign.callCount, 1);
  });

  it('lets the user navigate if a user exists', () => {
    var logout = sinon.stub();
    var logoutUrl = 'http://logout';
    var prevent = sinon.stub();
    var clearUser = sinon.stub();
    var getUser = sinon.stub().returns(true);
    var clearCookie = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.Logout
        logout={logout}
        visible={true}
        clearCookie={clearCookie}
        charmstoreLogoutUrl={logoutUrl}
        getUser={getUser}
        clearUser={clearUser} />);
    assert.equal(logout.callCount, 0);
    output.props.onClick({ preventDefault: prevent });
    // It should clear the user and the cookie.
    assert.equal(clearUser.callCount, 1);
    assert.equal(clearCookie.callCount, 1);

    assert.equal(logout.callCount, 1);
    // Unless getUser returns a user it shouldn't call preventDefault.
    assert.equal(prevent.callCount, 0);
  });

});
