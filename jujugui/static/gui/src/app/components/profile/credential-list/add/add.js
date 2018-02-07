/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Popup = require('../../../popup/popup');

class ProfileCredentialListAdd extends React.Component {
  /**
    Handle deleting a credential.

    @method _deleteCredential
  */
  _deleteCredential() {
    const credential = this.props.credential;
    this.props.revokeCloudCredential(credential, error => {
      if (error) {
        const message = 'Unable to revoke the cloud credential';
        this.props.addNotification({
          title: message,
          message: `${message}: ${error}`,
          level: 'error'
        });
        console.error(message, error);
        return;
      }
      this.props.onCredentialDeleted(credential);
    });
  }

  render() {
    const buttons = [{
      title: 'Cancel',
      action: this.props.onCancel.bind(this),
      type: 'inline-neutral'
    }, {
      title: 'Continue',
      action: this._deleteCredential.bind(this),
      type: 'destructive'
    }];
    return (
      <Popup
        buttons={buttons}
        title="Remove credentials">
        <p>
          Are you sure you want to remove these credentials?
        </p>
      </Popup>
    );
  }
}

ProfileCredentialListAdd.propTypes = {
  addNotification: PropTypes.func.isRequired,
  credential: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onCredentialDeleted: PropTypes.func.isRequired,
  revokeCloudCredential: PropTypes.func.isRequired
};

module.exports = ProfileCredentialListAdd;
