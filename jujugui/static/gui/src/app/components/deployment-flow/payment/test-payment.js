/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

describe('DeploymentPayment', function() {
  let acl, getCountries, getUser, user;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-payment', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    user = {
      paymentMethods: [{
        name: 'Company'
      }]
    };
    getUser = sinon.stub().callsArgWith(1, null, {
      paymentMethods: [{
        name: 'Company'
      }]
    });
    getCountries = sinon.stub();
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={sinon.stub()}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <juju.components.Spinner />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can store the user details', function() {
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(setPaymentUser.callCount, 1);
    assert.deepEqual(setPaymentUser.args[0][0], user);
  });

  it('can display payment methods', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={user}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <ul className="deployment-payment__methods twelve-col">
          {[<li className="deployment-payment__method"
            key="Company0">
            <juju.components.AccountPaymentMethodCard
              card={{name: 'Company'}} />
          </li>]}
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can display an error when getting users', function() {
    getUser = sinon.stub().callsArgWith(1, 'failed', null);
    const addNotification = sinon.stub();
    const setPaymentUser = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={setPaymentUser}
        username="spinach"
        validateForm={sinon.stub()} />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Could not load user info',
      message: 'Could not load user info: failed',
      level: 'error'
    });
  });

  it('can display a new user form', function() {
    const addNotification = sinon.stub();
    const validateForm = sinon.stub();
    const createUser = sinon.stub();
    const createToken = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={addNotification}
        createToken={createToken}
        createUser={createUser}
        getCountries={getCountries}
        getUser={getUser}
        paymentUser={null}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={validateForm} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-payment">
        <juju.components.CreatePaymentUser
          acl={acl}
          addNotification={addNotification}
          createToken={createToken}
          createUser={createUser}
          getCountries={getCountries}
          onUserCreated={instance._getUser}
          username="spinach"
          validateForm={validateForm} />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can abort requests when unmounting', function() {
    const abort = sinon.stub();
    getUser = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.DeploymentPayment
        acl={acl}
        addNotification={sinon.stub()}
        createToken={sinon.stub()}
        createUser={sinon.stub()}
        getCountries={getCountries}
        getUser={getUser}
        setPaymentUser={sinon.stub()}
        username="spinach"
        validateForm={sinon.stub()} />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
