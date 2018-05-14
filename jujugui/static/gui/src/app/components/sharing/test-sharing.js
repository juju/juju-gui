/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DateDisplay = require('../date-display/date-display');
const Sharing = require('./sharing');
const GenericButton = require('../generic-button/generic-button');
const GenericInput = require('../generic-input/generic-input');
const InsetSelect = require('../inset-select/inset-select');
const Popup = require('../popup/popup');
const SvgIcon = require('../svg-icon/svg-icon');

describe('Sharing', () => {
  let users, getModelUserInfo;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Sharing
      addNotification={options.addNotification || sinon.stub()}
      canShareModel={
        options.canShareModel === undefined ? false : options.canShareModel}
      closeHandler={options.closeHandler || sinon.stub()}
      getModelUserInfo={options.getModelUserInfo || getModelUserInfo}
      grantModelAccess={options.grantModelAccess || sinon.stub()}
      revokeModelAccess={options.revokeModelAccess || sinon.stub()} />
  );

  beforeEach(() => {
    users = [
      {
        name: 'drwho@external',
        displayName: 'drwho',
        domain: 'Ubuntu SSO',
        lastConnection: new Date('Mon, 19 Jan 2020 21:07:24 GMT'),
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
    getModelUserInfo = sinon.stub().callsArgWith(0, null, users);
  });

  it('can render with no users', () => {
    getModelUserInfo.callsArgWith(0, null, []);
    const wrapper = renderComponent();
    const expected = (
      <div>
        <Popup
          className="sharing__popup"
          close={wrapper.find('Popup').prop('close')}
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
            action={wrapper.find('GenericButton').prop('action')}
            extraClasses="right"
            type="inline-neutral">
            Done
          </GenericButton>
        </Popup>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render with a spinner', () => {
    const wrapper = renderComponent({ getModelUserInfo: sinon.stub() });
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can render with users', () => {
    const wrapper = renderComponent();
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
              <span>
                last connection:&nbsp;
                <DateDisplay
                  date={users[0].lastConnection}
                  relative={true} />
              </span>
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
    assert.compareJSX(wrapper.find('.sharing__users'), expected);
  });

  it('can handle an API call error', () => {
    getModelUserInfo.callsArgWith(0, 'boom', []);
    const addNotification = sinon.stub();
    const closeHandler = sinon.stub();
    renderComponent({
      addNotification,
      closeHandler
    });
    assert.equal(addNotification.called, true);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to load users.',
      message: 'Unable to load user information for this model: boom',
      level: 'error'
    });
    assert.equal(closeHandler.called, true);
  });

  it('can render the invitation form', () => {
    const wrapper = renderComponent({ canShareModel: true });
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
    const expected = (
      <div className="sharing__invite">
        <div className="sharing__invite--header">Add a user</div>
        <form onSubmit={wrapper.find('form').prop('onSubmit')}>
          <div className="sharing__invite--username">
            <GenericInput
              inlineErrorIcon={true}
              label="Username"
              onKeyUp={wrapper.find('GenericInput').prop('onKeyUp')}
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
    assert.compareJSX(wrapper.find('.sharing__invite'), expected);
  });

  it('can grant user access', () => {
    const grantModelAccess = sinon.stub();
    const wrapper = renderComponent({
      canShareModel: true,
      grantModelAccess
    });
    const instance = wrapper.instance();
    // Verify that the action of granting access makes the expected API call.
    instance.refs = {
      username: {getValue: sinon.stub().returns('chekov')},
      access: {getValue: sinon.stub().returns('read')}
    };
    wrapper.find('form').simulate('submit');
    assert.equal(grantModelAccess.called, true,
      'grantModelAccess was not called');
    assert.deepEqual(grantModelAccess.args[0][0], 'chekov');
    assert.deepEqual(grantModelAccess.args[0][1], 'read');
    assert.isFunction(grantModelAccess.args[0][2]);
  });

  it('can render and revoke user access', () => {
    const revokeModelAccess = sinon.stub();
    const wrapper = renderComponent({
      canShareModel: true,
      revokeModelAccess
    });
    // Validate that the markup is correct.
    const expected = (
      <div className="sharing__user-revoke">
        <GenericButton
          action={wrapper.find('.sharing__user-revoke GenericButton').at(0).prop('action')}
          tooltip="Remove user">
          <SvgIcon
            name="close_16"
            size="16" />
        </GenericButton>
      </div>
    );
    assert.compareJSX(wrapper.find('.sharing__user-revoke').at(0), expected);
    // Verify that the button triggers the API call as expected.
    wrapper.find('.sharing__user-revoke GenericButton').at(0).props().action();
    assert.equal(revokeModelAccess.called, true,
      'revokeModelAccess was not called');
    assert.equal(revokeModelAccess.args[0][0], 'drwho@external');
    assert.equal(revokeModelAccess.args[0][1], 'read');
  });

  it('handles revoke/grant errors', () => {
    const wrapper = renderComponent({ canShareModel: true });
    const instance = wrapper.instance();
    instance._modifyModelAccessCallback('boom');
    wrapper.update();
    const expected = (
      <div className="sharing__invite--error"><b>Error:</b>{' '}boom</div>
    );
    assert.compareJSX(wrapper.find('.sharing__invite--error'), expected);
  });

  describe('add button states', () => {

    it('shows a disabled button with "add" text by default', () => {
      const wrapper = renderComponent({ canShareModel: true });
      const button = wrapper.find('.sharing__invite--grant-button GenericButton');
      assert.equal(button.children().text(), 'Add');
      assert.equal(button.prop('disabled'), true);
    });

    it('shows an active button with "add" text when enabled', () => {
      const wrapper = renderComponent({ canShareModel: true });
      const instance = wrapper.instance();
      instance.setState({ canAdd: true });
      wrapper.update();
      const button = wrapper.find('.sharing__invite--grant-button GenericButton');
      assert.equal(button.children().text(), 'Add');
      assert.equal(button.prop('disabled'), false);
    });

    it('shows a disabled button with "add" text when sending', () => {
      const wrapper = renderComponent({ canShareModel: true });
      const instance = wrapper.instance();
      instance.setState({ sending: true });
      wrapper.update();
      const button = wrapper.find('.sharing__invite--grant-button GenericButton');
      assert.equal(button.children().text(), 'Add');
      assert.equal(button.prop('disabled'), true);
    });

    it('shows a disabled button with tick icon when sent', () => {
      const wrapper = renderComponent({ canShareModel: true });
      const instance = wrapper.instance();
      instance.setState({ sent: true });
      wrapper.update();
      const button = wrapper.find('.sharing__invite--grant-button GenericButton');
      assert.equal(button.find('SvgIcon').length, 1);
      assert.equal(button.prop('disabled'), true);
    });
  });
});
