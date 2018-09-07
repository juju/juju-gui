'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Popup = require('../../../popup/popup');
const ProfileCredentialListDelete = require('./delete');

describe('ProfileCredentialListDelete', () => {
  const renderComponent = (options = {}) => enzyme.shallow(
    <ProfileCredentialListDelete
      addNotification={options.addNotification || sinon.stub()}
      credential="google_foo@external_admin"
      onCancel={options.onCancel || sinon.stub()}
      onCredentialDeleted={options.onCredentialDeleted || sinon.stub()}
      revokeCloudCredential={
        options.revokeCloudCredential || sinon.stub()} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div>
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
        </Popup>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can cancel', () => {
    const onCancel = sinon.stub();
    const wrapper = renderComponent({ onCancel });
    wrapper.find('Popup').prop('buttons')[0].action();
    assert.equal(onCancel.callCount, 1);
  });

  it('can remove credentials', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, null);
    const onCredentialDeleted = sinon.stub();
    const wrapper = renderComponent({ revokeCloudCredential, onCredentialDeleted });
    wrapper.find('Popup').prop('buttons')[1].action();
    assert.equal(revokeCloudCredential.callCount, 1);
    assert.equal(onCredentialDeleted.callCount, 1);
    assert.equal(onCredentialDeleted.args[0][0], 'google_foo@external_admin');
  });

  it('can handle errors when removing credentials', () => {
    const revokeCloudCredential = sinon.stub().callsArgWith(1, 'Uh oh!');
    const onCredentialDeleted = sinon.stub();
    const addNotification = sinon.stub();
    const wrapper = renderComponent(
      { addNotification, revokeCloudCredential, onCredentialDeleted });
    wrapper.find('Popup').prop('buttons')[1].action();
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Unable to revoke the cloud credential',
      message: 'Unable to revoke the cloud credential: Uh oh!',
      level: 'error'
    });
    assert.equal(onCredentialDeleted.callCount, 0);
  });
});
