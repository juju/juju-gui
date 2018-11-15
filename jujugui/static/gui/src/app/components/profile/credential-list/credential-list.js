/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const BasicTable = require('../../shared/basic-table/basic-table');
const ButtonDropdown = require('../../button-dropdown/button-dropdown');
const CredentialAddEdit = require('../../credential-add-edit/credential-add-edit');
const ExpandingRow = require('../../shared/expanding-row/expanding-row');
const Button = require('../../shared/button/button');
const ProfileCredentialListDelete = require('./delete/delete');
const Spinner = require('../../spinner/spinner');

require('./_credential-list.scss');

// Define the name of the lxd cloud.
const LOCAL_CLOUD = 'localhost';

class ProfileCredentialList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      credentialMap: new Map(),
      editCredential: null,
      loading: false,
      removeCredential: null,
      showAdd: false
    };
  }

  componentDidMount() {
    this._getClouds();
  }

  async _getClouds() {
    const props = this.props;
    // Close the edit credentials form in case it was left open. We don't want
    // it to reopen after the credentials load.
    this.setState({loading: true, editCredential: null});
    try {
      const clouds = await this.props.cloudFacade.clouds();
      const credentialList = await this._getCloudCredentialNames(props.userName, clouds);
      const modelList = await this.props.modelManager.listModelSummaries();
      const multiCredentialList = credentialList.results.map(cloud => cloud.result);
      // This following line can be replaced with a .flat() call on the above
      // `multiCredentialList` value. At the time of writing .flat() is not
      // supported in nodejs where our tests run.
      const flattenedCredentialList = multiCredentialList.reduce(
        (acc, val) => acc.concat(val), []);
      const credentialMap = new Map();
      flattenedCredentialList.forEach(cred => {
        const credentialData = this._parseCredentialName(cred);
        credentialData.models = modelList.results.filter(model =>
          model.result.cloudCredentialTag === cred);
        credentialMap.set(cred, credentialData);
      });
      this.setState({
        credentialMap,
        loading: false
      });
    } catch (error) {
      this.setState({loading: false});
      const msg = 'Unable to fetch credential data';
      props.addNotification({
        title: msg,
        message: msg,
        level: 'error'
      });
      console.error(msg, error);
    }
  }

  /**
    Parses the credential name into its parts.
    @param {String} credentialName The fully qualified credential name
      ie) cloudcred-aws_username@external_default
    @returns {Object} The various portions of the credential.
  */
  _parseCredentialName(credentialName) {
    const parts = credentialName.split('_');
    return {
      cloud: parts[0].split('-')[1],
      displayName: parts[2],
      user: parts[1]
    };
  }

  /**
    Requests the cloud names for the supplied clouds
    @param {String} username The username on the controller.
    @param {Array} cloudsData An array of cloud names to fetch the credentials for.
    @returns {Promise} Resolves to a Map of credential data with the key being
      the credential key.
  */
  _getCloudCredentialNames(username, cloudsData) {
    const userClouds = Object.keys(cloudsData.clouds).map(key => ({
      userTag: `user-${username}@external`,
      cloudTag: key
    }));
    return this.props.cloudFacade.userCredentials({userClouds});
  }

  /**
    Show the add credentials form.
  */
  _toggleAdd() {
    this.setState({showAdd: !this.state.showAdd});
  }

  /**
    Sets the state for editCredential using the supplied credentialId.
    @param {String} credentialId The credential ID to edit.
  */
  _setEditCredential(credentialId = null) {
    this.setState({editCredential: credentialId});
  }

  /**
    Handle deleting a credential.
    @param credential {String} A credential id.
  */
  _setDeleteCredential(credential = null) {
    this.setState({removeCredential: credential});
  }

  /**
    Generate a form to add credentials.
  */
  _generateAddCredentials() {
    // Only generate the form when we want to display it so that it gets
    // re-rendered and therefore the fields cleared between uses.
    const form = this.state.showAdd ? this._generateCredentialForm() : null;
    return (
      <ExpandingRow
        clickable={false}
        expanded={this.state.showAdd}>
        <div></div>
        <div className="col-12">
          {form}
        </div>
      </ExpandingRow>);
  }

  /**
    Generates the edit credential UI elements.
    @param credentialData {Object} The name of the credential being edited.
    @param id {Object} The id of the credential being edited.
    @return {Array} The elements for the edit credential UI.
  */
  _generateEditCredentials(credentialData, id) {
    if (id !== this.state.editCredential) {
      return null;
    }
    return this._generateCredentialForm({
      credential: credentialData,
      onCancel: this._setEditCredential.bind(this),
      onCredentialUpdated: this._onCredentialEdited.bind(this)
    });
  }

  /**
    Handle a credential having been updated.
    @param credential {String} The name of the updated credential.
  */
  _onCredentialEdited(credential) {
    // Load the credentials again so that the list will contain the updates.
    this._getClouds();
    this._setEditCredential();
  }

  /**
    Handle a credential having been created.
    @param credential {String} The name of the newly created credential.
  */
  _onCredentialAdded(credential) {
    // Load the credentials again so that the list will contain the newly
    // added credential.
    this._getClouds();
    this._toggleAdd();
  }

  /**
    Handle a credential having been created.
    @param credential {String} The name of the newly created credential.
  */
  _onCredentialDeleted(credential) {
    this._getClouds();
    this._setDeleteCredential();
  }

  /**
    Generate the add credentials UI with any supplied overrides depending
    on where it is to be rendered.
    @param {Object} overrides The overrides for the default props.
    @return {Object} React component for DeploymentCredentialAdd
  */
  _generateCredentialForm(overrides={}) {
    const credentials = this.state.credentialMap;
    return (
      <CredentialAddEdit
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        cloudFacade={this.props.cloudFacade}
        credential={overrides.credential}
        credentials={
          credentials ? Array.from(credentials).map(credential => credential[0]) : []}
        key="deployment-credential-add"
        onCancel={overrides.onCancel || this._toggleAdd.bind(this)}
        onCredentialUpdated={
          overrides.onCredentialUpdated || this._onCredentialAdded.bind(this)}
        sendAnalytics={this.props.sendAnalytics}
        username={this.props.userName} />);
  }

  /**
    Display a component for deleting a credential.
  */
  _generateDeleteCredential() {
    const credential = this.state.removeCredential;
    if (!credential) {
      return null;
    }
    const cloudFacade = this.props.cloudFacade;
    return (
      <div className="profile-credential-list__delete">
        <ProfileCredentialListDelete
          addNotification={this.props.addNotification}
          credential={credential}
          onCancel={this._setDeleteCredential.bind(this)}
          onCredentialDeleted={this._onCredentialDeleted.bind(this)}
          revokeCloudCredential={cloudFacade.revokeCredentials.bind(cloudFacade)} />
      </div>);
  }

  /**
    Creates the JSX content for the credential list.
    @return {Object} The credential UI JSX.
  */
  _generateCredentialsList() {
    const state = this.state;
    const credentials = state.credentialMap;
    if (state.loading) {
      return (<Spinner />);
    }
    if (credentials.size === 0) {
      return (<div>No credentials available</div>);
    }
    let rows = [];
    const selectedCredential = this.props.credential;
    credentials.forEach((credential, key) => {
      rows.push({
        classes: key === selectedCredential ? ['profile-credential-list--highlighted'] : null,
        columns: [{
          content: credential.displayName
        }, {
          content: credential.cloud
        }, {
          content: function() {
            const models = credential.models;
            const modelCount = models ? models.length : 0;
            switch(modelCount) {
              case 0:
                return '-';
                break;
              case 1:
                return `${credential.models[0].result.name}`;
                break;
              default:
                return `${modelCount} Models`;
            }
          }()
        }, {
          content: (
            <ButtonDropdown
              icon="contextual-menu-horizontal"
              listItems={[{
                label: 'Edit',
                action: this._setEditCredential.bind(this, key)
              }, {
                label: 'Delete',
                action: this._setDeleteCredential.bind(this, key)
              }]} />),
          classes: ['u-align-text--right']
        }],
        expandedContent: this._generateEditCredentials(credential, key),
        expandedContentExpanded: this.state.editCredential === key,
        key,
        rowClickable: false
      });
    });

    return (
      <div className="profile-credential-list__list">
        <BasicTable
          headers={[{
            content: 'Name'
          }, {
            content: 'Provider'
          }, {
            content: 'Used by'
          }, {
            content: 'Action',
            classes: ['u-align-text--right']
          }]}
          rows={rows} />
      </div>
    );
  }

  render() {
    const clouds = this.state.clouds;
    let addButton = (
      <Button
        action={this._toggleAdd.bind(this)}
        type="p-button--neutral">
        Add credentials
      </Button>);
    if (clouds && clouds[LOCAL_CLOUD]) {
      addButton = null;
    }
    return (
      <div className="profile-credential-list">
        <div className="profile-credential-list__header">
          <h4 className="profile__title">
            Credentials
            <span className="profile__title-count">
              ({this.state.credentialMap.size})
            </span>
          </h4>
          <div className="profile-credential-list__add">{addButton}</div>
        </div>
        {this._generateAddCredentials()}
        {this._generateCredentialsList()}
        {this._generateDeleteCredential()}
      </div>
    );
  }
}

ProfileCredentialList.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).isRequired,
  addNotification: PropTypes.func.isRequired,
  cloudFacade: PropTypes.object,
  credential: PropTypes.string,
  modelManager: PropTypes.object.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  userName: PropTypes.string.isRequired
};

module.exports = ProfileCredentialList;
