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

describe('LoginComponent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('login-component', function() { done(); });
  });

  it('renders', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Login
        setCredentials={sinon.stub()}
        login={sinon.stub()}/>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="login">
        <form
          ref="form"
          onSubmit={instance._handleSubmit}>
        <input type="text" name="username" ref="username"/>
        <input type="password" name="password" ref="password"/>
        <input type="submit" />
        </form>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('calls to log the user in on submit', function() {
    var setCredentials = sinon.stub();
    var login = sinon.stub();
    var component = testUtils.renderIntoDocument(
      <juju.components.Login
        setCredentials={setCredentials}
        login={login} />);
    component.refs.username.value = 'foo';
    component.refs.password.value = 'bar';

    testUtils.Simulate.submit(component.refs.form);

    assert.equal(setCredentials.callCount, 1, 'setCredentials never called');
    assert.deepEqual(setCredentials.args[0][0], {
      user: 'foo',
      password: 'bar'
    });
    assert.equal(login.callCount, 1, 'login never called');
  });

});
