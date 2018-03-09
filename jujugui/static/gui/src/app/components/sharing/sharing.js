/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');
const GenericInput = require('../generic-input/generic-input');
const InsetSelect = require('../inset-select/inset-select');
const Spinner = require('../spinner/spinner');
const Popup = require('../popup/popup');
const SvgIcon = require('../svg-icon/svg-icon');

/**
  Modal component for viewing which users have access to the model, as well
  as sharing access with other users.
*/
class Sharing extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      canAdd: false,
      loadingUsers: false,
      usersWithAccess: []
    };
  }

  componentWillMount() {
    this._getModelUserInfo();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Fetch the a list, from the API, of user info for each user attached to
    the model.

    @method _getModelUserInfo
  */
  _getModelUserInfo() {
    this.setState({loadingUsers: true}, () => {
      const xhr = this.props.getModelUserInfo(
        this._getModelUserInfoCallback.bind(this));
      this.xhrs.push(xhr);
    });
  }

  /**
    Handle the API-returned data about the model's users. When successful, it
    will update the component's internal state.

    @method _getModelUserCallback
  */
  _getModelUserInfoCallback(error, data) {
    this.setState({loadingUsers: false}, () => {
      if (error) {
        // Display the error message.
        this.props.addNotification({
          title: 'Unable to load users.',
          message: 'Unable to load user information for this model: ' + error,
          level: 'error'
        });
        // Go ahead and close the popup.
        this.props.closeHandler();
        return;
      }
      this.setState({usersWithAccess: data});
    });
  }

  /**
    Provides a callback for both revoke and grant actions. The callback
    handles any errors that occurred while applying the changes. If no
    errors occur, then update the list of users with access to the model.

    @method _modifyModelAccessCallback
    @param {String} error Any errors that occured while updating access.
    @return {Booolean} Successfully modified the model access.
  */
  _modifyModelAccessCallback(error) {
    let success = true;
    if (error) {
      this.setState({inviteError: error});
      success = false;
    } else {
      // Reset the form fields.
      this.refs.username.setValue('');
      this.refs.access.setValue('read');
      // Clear out any errors and refresh the user list.
      this.setState({inviteError: null}, () => {
        this._getModelUserInfo();
      });
    }
    this.setState({sending: false});
    return success;
  }

  /**
    Grants access to the specified user.

    @method _grantModelAccess
    @param {Object} evt The form submission event object.
  */
  _grantModelAccess(evt) {
    if (evt) {
      evt.preventDefault();
    }
    const username = this.refs.username.getValue();
    const access = this.refs.access.getValue();
    this.setState({sending: true});
    this.props.grantModelAccess(username, access,
      // Wrap the ModelAccessCallback to set the state that modify the add
      // button depending on success.
      function(error) {
        const success = this._modifyModelAccessCallback(error);
        this.setState({sent: success});
      }.bind(this));
  }

  /**
    Revokes access to the specified user.

    @method _revokeModelAccess
    @param {String} user The user who's access is being revoked.
  */
  _revokeModelAccess(user) {
    // Juju's revoke access API doesn't actually revoke access, it just
    // downgrades it to the next level at the moment (as of 2.0). So if you
    // want a user to have no access, you have to specify 'read'. Because:
    // admin -> write -> read -> no access.
    this.props.revokeModelAccess(user.name, 'read',
      this._modifyModelAccessCallback.bind(this));
  }

  /**
    Generate the list of users with access to the model.

    @method _generateUsersWithAccess
    @returns {Array} An array of markup objects for each user.
  */
  _generateUsersWithAccess() {
    if (this.state.loadingUsers) {
      return (
        <div className="sharing__loading">
          <Spinner />
        </div>
      );
    }
    const users = this.state.usersWithAccess;
    if (!users.length) {
      return;
    }
    return users.map(user => {
      if (user.err) {
        return (
          <div className="sharing__user" key={user.name}>
            <div className="sharing__user-details">
              <div className="sharing__user-name">
                {user.displayName}
              </div>
              <div className="sharing__user-display-name">
                {user.err}
              </div>
            </div>
          </div>
        );
      }
      let lastConnection = 'never connected';
      if (user.lastConnection) {
        const humanTime = this.props.humanizeTimestamp(user.lastConnection);
        lastConnection = `last connection: ${humanTime}`;
      }
      let revokeMarkup;
      if (this.props.canShareModel) {
        const revokeUserAccess = this._revokeModelAccess.bind(this, user);
        revokeMarkup = (
          <div className="sharing__user-revoke">
            <GenericButton
              action={revokeUserAccess}
              tooltip="Remove user">
              <SvgIcon
                name="close_16"
                size="16" />
            </GenericButton>
          </div>
        );
      }
      return (
        <div className="sharing__user" key={user.name}>
          <div className="sharing__user-details">
            <div className="sharing__user-name">
              {user.displayName}
            </div>
            <div className="sharing__user-display-name">
              {user.domain} user
            </div>
            <div className="sharing__user-last-connection">
              {lastConnection}
            </div>
          </div>
          <div className="sharing__user-access">
            {user.access}
          </div>
          {revokeMarkup}
        </div>
      );
    });
  }

  /**
    On key up, we want to check if the input is empty and change the state
    accordingly.

    @param {Object} evt The keyup event.
  */
  _handleUsernameInputChange(evt) {
    this.setState({canAdd: evt.target.value !== ''});
  }

  _generateInvite() {
    if (!this.props.canShareModel) {
      return;
    }
    const accessOptions = [{
      label: 'Read',
      value: 'read'
    }, {
      label: 'Write',
      value: 'write'
    }, {
      label: 'Admin',
      value: 'admin'
    }];
    const error = this.state.inviteError ? (
      <div className="sharing__invite--error">
        <b>Error:</b> {this.state.inviteError}
      </div>
    ) : undefined;
    return (
      <div className="sharing__invite">
        <div className="sharing__invite--header">Add a user</div>
        <form onSubmit={this._grantModelAccess.bind(this)}>
          <div className="sharing__invite--username">
            <GenericInput
              inlineErrorIcon={true}
              label="Username"
              onKeyUp={this._handleUsernameInputChange.bind(this)}
              placeholder="Username"
              ref="username"
              required={true} />
          </div>
          <div className="sharing__invite--access">
            <InsetSelect
              label="Access"
              options={accessOptions}
              ref="access" />
          </div>
          <div className="sharing__invite--grant-button">
            {this.generateAddButton()}
          </div>
          {error}
        </form>
      </div>
    );
  }

  /**
    Generate the invite 'add' button based on the current state

    @returns {Object} The generated button.
  */
  generateAddButton() {
    if (this.state.sending) {
      return (<GenericButton
        disabled={true}
        ref="grantButton"
        submit={true}
        tooltip="Add user"
        type="positive">
        Add
      </GenericButton>);
    } else if (this.state.sent) {
      // We want the button to transition back to it's resting state after a
      // set amount of time, so make a closure then trigger it after 1.5s.
      const sent = (() => {
        return () => {
          this.setState({sent: false, canAdd: false});
        };
      })();
      setTimeout(sent, 1500);
      return (<GenericButton
        disabled={!this.state.canAdd}
        ref="grantButton"
        submit={true}
        tooltip="Add user"
        type="positive">
        <SvgIcon
          name="tick_16"
          size="16" />
      </GenericButton>);
    } else {
      return (<GenericButton
        disabled={!this.state.canAdd}
        ref="grantButton"
        submit={true}
        tooltip="Add user"
        type="positive">
        Add
      </GenericButton>);
    }
  }

  handleClose() {
    return true;
  }

  render() {
    return (
      <Popup
        className="sharing__popup"
        close={this.props.closeHandler}
        title="Share">
        {this._generateInvite()}
        <div className="sharing__users-header">
          <div className="sharing__users-header-user">User</div>
          <div className="sharing__users-header-access">Access</div>
        </div>
        <div className="sharing__users">
          {this._generateUsersWithAccess()}
        </div>
        <GenericButton
          action={this.props.closeHandler}
          extraClasses="right"
          type="inline-neutral">
          Done
        </GenericButton>
      </Popup>
    );
  }
};


Sharing.propTypes = {
  addNotification: PropTypes.func,
  canShareModel: PropTypes.bool,
  closeHandler: PropTypes.func,
  getModelUserInfo: PropTypes.func.isRequired,
  grantModelAccess: PropTypes.func.isRequired,
  humanizeTimestamp: PropTypes.func,
  revokeModelAccess: PropTypes.func.isRequired
};

Sharing.defaultProps = {
  addNotification: () => {
    console.log('No addNotification specified.');
  },
  canShareModel: false,
  closeHandler: () => {
    console.log('No closeHandler specified.');
  },
  humanizeTimestamp: timestamp => {
    // Least we can do.
    return timestamp.toLocaleDateString();
  }
};

module.exports = Sharing;
