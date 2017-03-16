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

describe('AccountCredentials', () => {
  let acl, getCloudCredentialNames, getCloudProviderDetails, listClouds;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('account-credentials', () => { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    getCloudProviderDetails = sinon.stub();
    getCloudProviderDetails.withArgs('aws').returns({title: 'Amazon'});
    getCloudProviderDetails.withArgs('gce').returns({title: 'Google'});
    listClouds = sinon.stub().callsArgWith(0, null, {
      aws: 'aws',
      gce: 'gce'
    });
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, [
      {names: ['aws_spinach@external_test1']},
      {names: ['gce_spinach@external_test2']}
    ]);
  });

  it('can display a spinner when loading credentials', () => {
    getCloudCredentialNames = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Cloud credentials
        </h2>
        <juju.components.Spinner />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render', () => {
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />, true);
    const output = component.getRenderOutput();
    const credentials = output.props.children[1].props.children[1];
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Cloud credentials
        </h2>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <div className="six-col no-margin-bottom">
              Name
            </div>
            <div className="six-col last-col no-margin-bottom">
              Provider
            </div>
          </li>
          {[<li className="user-profile__list-row twelve-col"
            key="aws_spinach@external_test1">
              <div className="six-col no-margin-bottom">
                aws_spinach@external_test1
              </div>
              <div className="four-col no-margin-bottom">
                Amazon
              </div>
              <div className="two-col last-col no-margin-bottom">
                <juju.components.GenericButton
                  action={
                    credentials[0].props.children[2].props.children
                      .props.action}
                  type="neutral"
                  title="Remove" />
              </div>
          </li>,
          <li className="user-profile__list-row twelve-col"
            key="gce_spinach@external_test2">
              <div className="six-col no-margin-bottom">
                gce_spinach@external_test2
              </div>
              <div className="four-col no-margin-bottom">
                Google
              </div>
              <div className="two-col last-col no-margin-bottom">
                <juju.components.GenericButton
                  action={
                    credentials[1].props.children[2].props.children
                      .props.action}
                  type="neutral"
                  title="Remove" />
              </div>
          </li>]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can render when there are no credentials', () => {
    getCloudCredentialNames = sinon.stub().callsArgWith(1, null, []);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />, true);
    const output = component.getRenderOutput();
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Cloud credentials
        </h2>
        <div>
          No credentials available.
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can display errors when getting clouds', () => {
    const addNotification = sinon.stub();
    listClouds.callsArgWith(0, 'Uh oh!', null);
    jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={addNotification}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to list clouds',
      message: 'Unable to list clouds: Uh oh!',
      level: 'error'
    });
  });

  it('can display errors when getting credential names', () => {
    const addNotification = sinon.stub();
    getCloudCredentialNames = sinon.stub().callsArgWith(
      1, 'Uh oh!', null);
    jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={addNotification}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />);
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to get names for credentials',
      message: 'Unable to get names for credentials: Uh oh!',
      level: 'error'
    });
  });

  it('can remove credentials', () => {
    const revokeCloudCredential = sinon.stub();
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={revokeCloudCredential}
        username="spinach@external" />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1][0].props
      .children[2].props.children.props.action();
    assert.equal(revokeCloudCredential.callCount, 1);
    assert.equal(
      revokeCloudCredential.args[0][0], 'aws_spinach@external_test1');
  });

  it('can display errors when deleting credentials', () => {
    const addNotification = sinon.stub();
    const revokeCloudCredential = sinon.stub().callsArgWith(1, 'Uh oh!');
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={addNotification}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={revokeCloudCredential}
        username="spinach@external" />, true);
    const output = component.getRenderOutput();
    output.props.children[1].props.children[1][0].props
      .children[2].props.children.props.action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to revoke the cloud credential',
      message: 'Unable to revoke the cloud credential: Uh oh!',
      level: 'error'
    });
  });

  it('removes the credential from the list', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, null);
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={revokeCloudCredential}
        username="spinach@external" />, true);
    let output = component.getRenderOutput();
    let credentials = output.props.children[1].props.children[1];
    credentials[0].props.children[2].props.children.props.action();
    output = component.getRenderOutput();
    credentials = output.props.children[1].props.children[1];
    const expected = (
      <div className="account__section">
        <h2 className="account__title twelve-col">
          Cloud credentials
        </h2>
        <ul className="user-profile__list twelve-col">
          <li className="user-profile__list-header twelve-col">
            <div className="six-col no-margin-bottom">
              Name
            </div>
            <div className="six-col last-col no-margin-bottom">
              Provider
            </div>
          </li>
          {[<li className="user-profile__list-row twelve-col"
            key="gce_spinach@external_test2">
              <div className="six-col no-margin-bottom">
                gce_spinach@external_test2
              </div>
              <div className="four-col no-margin-bottom">
                Google
              </div>
              <div className="two-col last-col no-margin-bottom">
                <juju.components.GenericButton
                  action={
                    credentials[0].props.children[2].props.children
                      .props.action}
                  type="neutral"
                  title="Remove" />
              </div>
          </li>]}
        </ul>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can abort the requests when unmounting', () => {
    const abort = sinon.stub();
    getCloudCredentialNames = sinon.stub().returns({abort: abort});
    const component = jsTestUtils.shallowRender(
      <juju.components.AccountCredentials
        acl={acl}
        addNotification={sinon.stub()}
        getCloudCredentialNames={getCloudCredentialNames}
        getCloudProviderDetails={getCloudProviderDetails}
        listClouds={listClouds}
        revokeCloudCredential={sinon.stub()}
        username="spinach@external" />, true);
    component.unmount();
    assert.equal(abort.callCount, 1);
  });
});
