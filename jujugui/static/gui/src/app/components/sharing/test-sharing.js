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

describe('Sharing', () => {
  const humanizeTimestamp = sinon.stub().returns('9 minutes ago');
  let users;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('sharing', () => { done(); });
  });

  beforeEach(() => {
    users = [
      {
        name: 'drwho@external',
        displayName: 'drwho',
        domain: 'Ubuntu SSO',
        lastConnection: '9 minutes ago',
        access: 'admin'
      }, {
        name: 'rose',
        displayName: 'Rose',
        domain: 'local',
        lastConnection: null,
        access: 'write',
      }, {
        name: 'dalek',
        displayName: 'Dalek',
        lastConnection: null,
        access: 'write',
        err: 'exterminate!'
      }
    ];
  });

  it('can render with no users', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, []);
    const closeHandler = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        canShareModel={false}
        closeHandler={closeHandler}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expectedButtons = [{
      title: 'Done',
      action: closeHandler,
      type: 'neutral'
    }];
    const expected = (
      <juju.components.Popup
        className="sharing__popup"
        title="Share"
        buttons={expectedButtons}>
        {undefined}
        <div className="sharing__users-header">
          <div className="sharing__users-header-user">User</div>
          <div className="sharing__users-header-access">Access</div>
        </div>
        <div className="sharing__users">
          {undefined}
        </div>
      </juju.components.Popup>
    );
    assert.deepEqual(output, expected);
  });

  it('can render with a spinner', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, []);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        canShareModel={false}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        revokeModelAccess={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance.setState({loadingUsers: true});
    const output = renderer.getRenderOutput();
    const spinner = output.props.children[2].props.children;
    const expected = (
      <div className="sharing__loading">
        <juju.components.Spinner />
      </div>
    );
    assert.deepEqual(spinner, expected);
  });

  it('can render with users', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, users);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        canShareModel={false}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    // Get all the children except the header, which is the first item in the
    // array.
    const obtained = output.props.children[2].props.children;
    const expected = [(
      <div key="drwho@external" className="sharing__user">
        <div className="sharing__user-details">
          <div className="sharing__user-name">
            drwho
          </div>
          <div className="sharing__user-display-name">
            {'Ubuntu SSO'} user
          </div>
          <div className="sharing__user-last-connection">
            last connection: 9 minutes ago
          </div>
        </div>
        <div className="sharing__user-access">
          admin
        </div>
        {undefined}
      </div>
    ), (
      <div key="rose" className="sharing__user">
        <div className="sharing__user-details">
          <div className="sharing__user-name">
            Rose
          </div>
          <div className="sharing__user-display-name">
            {'local'} user
          </div>
          <div className="sharing__user-last-connection">
            never connected
          </div>
        </div>
        <div className="sharing__user-access">
          write
        </div>
        {undefined}
      </div>
    ), (
      <div key="dalek" className="sharing__user">
        <div className="sharing__user-details">
          <div className="sharing__user-name">
            Dalek
          </div>
          <div className="sharing__user-display-name">
            exterminate!
          </div>
        </div>
      </div>
    )];
    assert.deepEqual(obtained, expected);
  });

  it('can handle an API call error', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, 'boom', []);
    const addNotification = sinon.stub();
    const closeHandler = sinon.stub();
    jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={addNotification}
        canShareModel={false}
        closeHandler={closeHandler}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        revokeModelAccess={sinon.stub()} />);
    assert.equal(addNotification.called, true);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to load users.',
      message: 'Unable to load user information for this model: boom',
      level: 'error'
    });
    assert.equal(closeHandler.called, true);
  });

  it('can render the invitation form', () => {
    const grantModelAccess = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={sinon.stub()}
        grantModelAccess={grantModelAccess}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expectedOptions = [{
      label: 'read',
      value: 'read'
    }, {
      label: 'write',
      value: 'write'
    }, {
      label: 'admin',
      value: 'admin'
    }];
    const expectedMarkup = (
      <div className="sharing__invite">
        <div className="sharing__invite--header">Add a user</div>
        <form onSubmit={instance._grantModelAccess}>
          <div className="sharing__invite--username">
            <juju.components.GenericInput
              label="Username"
              placeholder="Username"
              ref="username"
              required={true} />
          </div>
          <div className="sharing__invite--access">
            <juju.components.InsetSelect
              label="Access"
              defaultValue="read"
              ref="access"
              options={expectedOptions} />
          </div>
          <div className="sharing__invite--grant-button">
            <juju.components.GenericButton
              submit={true}
              icon="add_16"
              tooltip="Add user"
              ref="grantButton"
              type="positive" />
          </div>
        </form>
        {undefined}
      </div>
    );
    const actualMarkup = output.props.children[0];
    assert.deepEqual(actualMarkup, expectedMarkup);
  });

  it('can grant user access', () => {
    const grantModelAccess = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={sinon.stub()}
        grantModelAccess={grantModelAccess}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    // Verify that the action of granting access makes the expected API call.
    instance.refs = {
      username: {getValue: sinon.stub().returns('chekov')},
      access: {getValue: sinon.stub().returns('read')},
    };
    const inviteForm = output.props.children[0].props.children[1];
    inviteForm.props.onSubmit();
    assert.equal(grantModelAccess.called, true,
      'grantModelAccess was not called');
    assert.deepEqual(grantModelAccess.args[0], [
      ['chekov'],
      'read',
      instance._modifyModelAccessCallback
    ], 'grantModelAccess not called with the correct data');
  });

  it('can render and revoke user access', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, users);
    const revokeModelAccess = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={revokeModelAccess} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const user = output.props.children[2].props.children[0];
    // Validate that the markup is correct.
    const revokeMarkup = user.props.children[2];
    const revokeAction = revokeMarkup.props.children.props.action;
    const expectedMarkup = (
      <div className="sharing__user-revoke">
        <juju.components.GenericButton
          action={revokeAction}
          tooltip="Remove user"
          icon="close_16" />
      </div>
    );
    assert.deepEqual(revokeMarkup, expectedMarkup,
      'markup for revoke button is incorrect');
    // Verify that the button triggers the API call as expected.
    revokeAction();
    assert.equal(revokeModelAccess.called, true,
      'revokeModelAccess was not called');
    assert.deepEqual(revokeModelAccess.args[0], [
      ['drwho@external'],
      'read',
      instance._modifyModelAccessCallback
    ], 'revokeModelAccess not called with the correct data');
  });

  it('handles revoke/grant errors', () => {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={sinon.stub()}
        grantModelAccess={sinon.stub()}
        revokeModelAccess={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._modifyModelAccessCallback('boom');
    const output = renderer.getRenderOutput();
    const actualMessage = output.props.children[0].props.children[2];
    const expectedMessage = (
      <div className="sharing__invite--error">boom</div>
    );
    assert.deepEqual(actualMessage, expectedMessage);
  });

});
