/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');

const Popup = require('../../../popup/popup');
const ProfileCredentialListAdd = require('./add');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('ProfileCredentialListAdd', () => {
  function renderComponent(options = {}) {
    const renderer = jsTestUtils.shallowRender(
      <ProfileCredentialListAdd
        addNotification={options.addNotification || sinon.stub()}
        credential="google_foo@external_admin"
        onCancel={options.onCancel || sinon.stub()}
        onCredentialDeleted={options.onCredentialDeleted || sinon.stub()}
        revokeCloudCredential={
          options.revokeCloudCredential || sinon.stub()} />, true);
    return {
      renderer,
      output: renderer.getRenderOutput(),
      instance: renderer.getMountedInstance()
    };
  }

  it('can render', () => {
    const comp = renderComponent();
    const expected = (
      <Popup
        buttons={[{
          title: 'Cancel',
          action: sinon.stub(),
          type: 'inline-neutral'
        }, {
          title: 'Continue',
          action: sinon.stub(),
          type: 'destructive'
        }]}
        title="Remove credentials">
        <p>
          Are you sure you want to remove these credentials?
        </p>
      </Popup>);
    expect(comp.output).toEqualJSX(expected);
  });

  it('can cancel', () => {
    const onCancel = sinon.stub();
    const comp = renderComponent({ onCancel });
    comp.output.props.buttons[0].action();
    assert.equal(onCancel.callCount, 1);
  });

  it('can remove credentials', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, null);
    const onCredentialDeleted = sinon.stub();
    const comp = renderComponent({ revokeCloudCredential, onCredentialDeleted });
    comp.output.props.buttons[1].action();
    assert.equal(revokeCloudCredential.callCount, 1);
    assert.equal(onCredentialDeleted.callCount, 1);
    assert.equal(onCredentialDeleted.args[0][0], 'google_foo@external_admin');
  });

  it('can handle errors when removing credentials', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, 'Uh oh!');
    const onCredentialDeleted = sinon.stub();
    const addNotification = sinon.stub();
    const comp = renderComponent(
      { addNotification, revokeCloudCredential, onCredentialDeleted });
    comp.output.props.buttons[1].action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to revoke the cloud credential',
      message: 'Unable to revoke the cloud credential: Uh oh!',
      level: 'error'
    });
    assert.equal(onCredentialDeleted.callCount, 0);
  });
});
