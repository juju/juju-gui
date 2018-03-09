/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Sharing = require('./sharing');
const GenericButton = require('../generic-button/generic-button');
const GenericInput = require('../generic-input/generic-input');
const InsetSelect = require('../inset-select/inset-select');
const Spinner = require('../spinner/spinner');
const Popup = require('../popup/popup');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Sharing', () => {
  const humanizeTimestamp = sinon.stub().returns('9 minutes ago');
  let users;

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
        access: 'write'
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
      <Sharing
        canShareModel={false}
        closeHandler={closeHandler}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <Popup
        className="sharing__popup"
        close={closeHandler}
        title="Share">
        {undefined}
        <div className="sharing__users-header">
          <div className="sharing__users-header-user">User</div>
          <div className="sharing__users-header-access">Access</div>
        </div>
        <div className="sharing__users">
          {undefined}
        </div>
        <GenericButton
          action={closeHandler}
          extraClasses="right"
          type="inline-neutral">
          Done
        </GenericButton>
      </Popup>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render with a spinner', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, []);
    const renderer = jsTestUtils.shallowRender(
      <Sharing
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
        <Spinner />
      </div>
    );
    expect(spinner).toEqualJSX(expected);
  });

  it('can render with users', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, users);
    const renderer = jsTestUtils.shallowRender(
      <Sharing
        canShareModel={false}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    // Get all the children except the header, which is the first item in the
    // array.
    const expected = (
      <div className="sharing__users">
        {[<div className="sharing__user" key="drwho@external">
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
        </div>,
        <div className="sharing__user" key="rose">
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
        </div>,
        <div className="sharing__user" key="dalek">
          <div className="sharing__user-details">
            <div className="sharing__user-name">
              Dalek
            </div>
            <div className="sharing__user-display-name">
              exterminate!
            </div>
          </div>
        </div>]}
      </div>);
    expect(output.props.children[2]).toEqualJSX(expected);
  });

  it('can handle an API call error', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, 'boom', []);
    const addNotification = sinon.stub();
    const closeHandler = sinon.stub();
    jsTestUtils.shallowRender(
      <Sharing
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
      <Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={sinon.stub()}
        grantModelAccess={grantModelAccess}
        revokeModelAccess={sinon.stub()} />, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expectedOptions = [{
      label: 'Read',
      value: 'read'
    }, {
      label: 'Write',
      value: 'write'
    }, {
      label: 'Admin',
      value: 'admin'
    }];
    const expectedMarkup = (
      <div className="sharing__invite">
        <div className="sharing__invite--header">Add a user</div>
        <form onSubmit={instance._grantModelAccess}>
          <div className="sharing__invite--username">
            <GenericInput
              inlineErrorIcon={true}
              label="Username"
              onKeyUp={instance._handleUsernameInputChange}
              placeholder="Username"
              ref="username"
              required={true} />
          </div>
          <div className="sharing__invite--access">
            <InsetSelect
              label="Access"
              options={expectedOptions}
              ref="access" />
          </div>
          <div className="sharing__invite--grant-button">
            <GenericButton
              disabled={true}
              ref="grantButton"
              submit={true}
              tooltip="Add user"
              type="positive">
              Add
            </GenericButton>
          </div>
          {undefined}
        </form>
      </div>
    );
    const actualMarkup = output.props.children[0];
    expect(actualMarkup).toEqualJSX(expectedMarkup);
  });

  it('can grant user access', () => {
    const grantModelAccess = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Sharing
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
      access: {getValue: sinon.stub().returns('read')}
    };
    const inviteForm = output.props.children[0].props.children[1];
    inviteForm.props.onSubmit();
    assert.equal(grantModelAccess.called, true,
      'grantModelAccess was not called');
    assert.deepEqual(grantModelAccess.args[0][0], 'chekov');
    assert.deepEqual(grantModelAccess.args[0][1], 'read');
    assert.isFunction(grantModelAccess.args[0][2]);
  });

  it('can render and revoke user access', () => {
    const getModelUserInfo = sinon.stub().callsArgWith(0, null, users);
    const revokeModelAccess = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={getModelUserInfo}
        grantModelAccess={sinon.stub()}
        humanizeTimestamp={humanizeTimestamp}
        revokeModelAccess={revokeModelAccess} />, true);
    const output = renderer.getRenderOutput();
    const user = output.props.children[2].props.children[0];
    // Validate that the markup is correct.
    const revokeMarkup = user.props.children[2];
    const revokeAction = revokeMarkup.props.children.props.action;
    const expectedMarkup = (
      <div className="sharing__user-revoke">
        <GenericButton
          action={revokeAction}
          tooltip="Remove user">
          <SvgIcon
            name="close_16"
            size="16" />
        </GenericButton>
      </div>
    );
    expect(revokeMarkup).toEqualJSX(expectedMarkup);
    // Verify that the button triggers the API call as expected.
    revokeAction();
    assert.equal(revokeModelAccess.called, true,
      'revokeModelAccess was not called');
    assert.equal(revokeModelAccess.args[0][0], 'drwho@external');
    assert.equal(revokeModelAccess.args[0][1], 'read');
  });

  it('handles revoke/grant errors', () => {
    const renderer = jsTestUtils.shallowRender(
      <Sharing
        addNotification={sinon.stub()}
        canShareModel={true}
        closeHandler={sinon.stub()}
        getModelUserInfo={sinon.stub()}
        grantModelAccess={sinon.stub()}
        revokeModelAccess={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    instance._modifyModelAccessCallback('boom');
    const output = renderer.getRenderOutput();
    const actualMessage = output.props.children[0].props.children[1].props.
      children[3];
    const expectedMessage = (
      <div className="sharing__invite--error"><b>Error:</b>{' '}boom</div>
    );
    expect(actualMessage).toEqualJSX(expectedMessage);
  });

  describe('add button states', () => {
    function makeSharingEle(state) {
      const renderer = jsTestUtils.shallowRender(
        <Sharing
          addNotification={sinon.stub()}
          canShareModel={true}
          closeHandler={sinon.stub()}
          getModelUserInfo={sinon.stub()}
          grantModelAccess={sinon.stub()}
          revokeModelAccess={sinon.stub()} />, true);
      const instance = renderer.getMountedInstance();
      if (state) {
        instance.setState(state);
      }
      const output = renderer.getRenderOutput();
      return output.props.children[0].
        props.children[1].props.children[2].props.children;
    }
    it('shows a disabled button with "add" text by default', () => {
      const expected = (
        <GenericButton
          disabled={true}
          ref="grantButton"
          submit={true}
          tooltip="Add user"
          type="positive">
          Add
        </GenericButton>
      );
      expect(makeSharingEle()).toEqualJSX(expected);
    });

    it('shows an active button with "add" text when enabled', () => {
      const output = makeSharingEle({
        canAdd: true
      });
      const expected = (
        <GenericButton
          disabled={false}
          ref="grantButton"
          submit={true}
          tooltip="Add user"
          type="positive">
          Add
        </GenericButton>
      );
      expect(output).toEqualJSX(expected);
    });

    it('shows a disabled button with "add" text when sending', () => {
      const output = makeSharingEle({
        sending: true
      });
      const expected = (
        <GenericButton
          disabled={true}
          ref="grantButton"
          submit={true}
          tooltip="Add user"
          type="positive">
          Add
        </GenericButton>
      );
      expect(output).toEqualJSX(expected);
    });

    it('shows a disabled button with tick icon when sent', () => {
      const output = makeSharingEle({
        sent: true
      });
      const expected = (
        <GenericButton
          disabled={true}
          ref="grantButton"
          submit={true}
          tooltip="Add user"
          type="positive">
          <SvgIcon
            name="tick_16"
            size="16" />
        </GenericButton>
      );
      expect(output).toEqualJSX(expected);
    });
  });
});
