/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const InsetSelect = require('../../inset-select/inset-select');
const ExpandingRow = require('../../expanding-row/expanding-row');
const DeploymentCredentialAdd = require('./add/add');

class DeploymentCredential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      credentials: [],
      credentialsLoading: false,
      savedCredential: null,
      showAdd: this.props.editable
    };
  }

  componentWillMount() {
    this._getCredentials();
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.cloud && prevProps.cloud.name;
    const newId = this.props.cloud && this.props.cloud.name;
    if (newId !== prevId) {
      this._getCredentials();
    }
  }

  /**
    Request credentials from the controller.

    @method _getCredentials
    @param {String} credential An optional credential name to select after
      loading the list.
  */
  _getCredentials(credential) {
    const cloud = this.props.cloud && this.props.cloud.name;
    const user = this.props.user;
    if (user && this.props.controllerIsReady()) {
      this.setState({credentialsLoading: true}, () => {
        this.props.getCloudCredentialNames(
          [[user, cloud]],
          this._getCloudCredentialNamesCallback.bind(this, credential));
      });
    }
  }

  /**
    The method to be called when the credentials names response has been
    received.

    @method _getCloudCredentialNamesCallback
    @param {String} credential An optional credential name to select after
      loading the list.
    @param {String} error An error message, or null if there's no error.
    @param {Array} tags A list of the tags found.
  */
  _getCloudCredentialNamesCallback(credential, error, names) {
    if (error) {
      const message = 'unable to get names for credentials';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
      return;
    }
    // The resulting array of names will be in the order that the cloud/user
    // pairs were passed to getCloudCredentialNames. As we're only passing
    // one pair we can safely assume that we only need the first item in the
    // array.
    const nameList = names.length && names[0].names || [];
    this.props.getCloudCredentials(
      nameList, this._getCredentialsCallback.bind(this, credential));
  }

  /**
    The method to be called when the credentials response has been received.

    @method _getCredentialsCallback
    @param {String} credential An optional credential name to select after
      loading the list.
    @param {String} error An error message, or null if there's no error.
    @param {Array} credentials A list of the credentials found.
  */
  _getCredentialsCallback(credential, error, credentials) {
    if (error) {
      const message = 'Unable to get credentials';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
      return;
    }
    const credentialList = Object.keys(credentials).map(credential => {
      return {
        displayName: credentials[credential].displayName,
        id: credential
      };
    });
    this.setState({
      credentials: credentialList,
      credentialsLoading: false,
      // If there are no credentials then display the form to add credentials.
      showAdd: this.props.editable &&
        (!credentials || credentialList.length === 0)
    });
    this.props.sendAnalytics(
      'Select cloud',
      this.props.cloud.name,
      ((!credentials || credentialList.length === 0) ?
        'doesn\'t have' :
        'has') +
      ' credentials'
    );
    if (credentials && credentialList.length > 0) {
      let select = credentialList[0].id;
      // If the supplied credential to select is actually in the list then
      // select it.
      if (credentials[credential]) {
        select = credential;
      }
      this.props.setCredential(select);
      // The shallow renderer can't have refs set up before the first mount
      // so we have to check that we have refs before we make this call. We
      // need to figure out some way to properly handle refs.
      if (this.refs.credential) {
        this.refs.credential.setValue(select);
      }
    }
  }

  /**
    Show the add credentials form.

    @method _toggleAdd
    @param {Boolean} cancel Indicates whether the add form is being hidden
                            due to a form submission or a cancel.
  */
  _toggleAdd(cancel) {
    const showAdd = !this.state.showAdd;
    // When displaying the add credentials form we need to clear the
    // currently selected credential in case someone tries to deploy while
    // the add credential form is open.
    if (showAdd) {
      // Save the credential in case we need to restore it on cancel.
      this.setState({savedCredential: this.props.credential});
      this.props.setCredential(null);
    } else if (cancel) {
      this.props.sendAnalytics(
        'Button click',
        'Cancel add credential'
      );
      // Restore previous credentials.
      this.props.setCredential(this.state.savedCredential);
    }
    this.setState({showAdd: showAdd});
  }

  /**
    Generate the list of credential options.

    @method _generateCredentials
    @returns {Array} The list of credential options.
  */
  _generateCredentials() {
    var credentials = this.state.credentials.map(credential => {
      return {
        label: credential.displayName,
        value: credential.id
      };
    });
    credentials.push({
      label: 'Add credential...',
      value: 'add-credential'
    });
    return credentials;
  }

  /**
    Set the credential value or navigate to the add credentails form.

    @method _handleCredentialChange
    @param {String} The select value.
  */
  _handleCredentialChange(value) {
    if (value === 'add-credential') {
      this._toggleAdd();
    } else {
      this.props.setCredential(value);
    }
  }

  /**
    Generate the list of region options.

    @method _generateRegions
    @returns {Array} The list of region options.
  */
  _generateRegions() {
    const regions = !this.props.editable ? [{name: this.props.region}] :
      this.props.cloud && this.props.cloud.regions || [];
    // Setup the default option.
    let regionList = [
      {label: 'Default', value: ''}
    ];
    if (regions.length && regions.length > 0) {
      // Setup each region option.
      const regionValues = regions.map(region => {
        return {
          label: region.name,
          value: region.name
        };
      });
      // Return the default option + the regions.
      regionList = regionList.concat(regionValues);
    }
    return regionList;
  }

  /**
    Generate a change cloud action if a cloud has been selected.

    @method _generateAction
    @returns {Array} The list of actions.
  */
  _generateSelect() {
    if (this.state.showAdd) {
      return;
    }
    var disabled = this.props.acl.isReadOnly();
    return (
      <form className="deployment-credential__form">
        <div className="prepend-two four-col">
          <InsetSelect
            disabled={disabled}
            label="Credential"
            onChange={this._handleCredentialChange.bind(this)}
            options={this._generateCredentials()}
            ref="credential"
            value={this.props.credential} />
        </div>
        <div className="four-col deployment-credential__form-region">
          <InsetSelect
            disabled={disabled || !this.props.editable}
            label="Region"
            onChange={this.props.setRegion}
            options={this._generateRegions()}
            value={this.props.region} />
        </div>
      </form>);
  }

  /**
    Handle a credential having been created.
    @param credential {String} The name of the newly created credential.
  */
  _onCredentialUpdated(credential) {
    // Load the credentials again so that the list will contain the newly
    // added credential.
    this._getCredentials(
      this.props.generateCloudCredentialName(
        this.props.cloud.name, this.props.user, credential));
    this._toggleAdd();
  }

  /**
    Generate the form for adding a credential.

    @method _generateAdd
    @returns {Array} The credential form.
  */
  _generateAdd() {
    if (!this.state.showAdd) {
      return;
    }
    return (
      <DeploymentCredentialAdd
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        cloud={this.props.cloud}
        credentials={this.state.credentials.map(credential =>
          credential.displayName)}
        generateCloudCredentialName={this.props.generateCloudCredentialName}
        getCloudProviderDetails={this.props.getCloudProviderDetails}
        onCancel={
          this.state.credentials.length ? this._toggleAdd.bind(this, true) : null}
        onCredentialUpdated={this._onCredentialUpdated.bind(this)}
        sendAnalytics={this.props.sendAnalytics}
        updateCloudCredential={this.props.updateCloudCredential}
        user={this.props.user}
        validateForm={this.props.validateForm} />);
  }

  /**
    Display the credentials or a spinner if the data is loading.

    @method _generateContent
    @returns {Object} The dom elements.
  */
  _generateContent() {
    if (this.state.credentialsLoading) {
      return (
        <div className="deployment-credential__loading">
          <Spinner />
        </div>);
    }
    return (
      <ExpandingRow
        classes={{'twelve-col': true, 'no-margin-bottom': true}}
        clickable={false}
        expanded={this.state.showAdd}>
        {this._generateSelect()}
        {this._generateAdd()}
      </ExpandingRow>);
  }

  render() {
    return (
      <div className="clearfix">
        {this._generateContent()}
      </div>
    );
  }
};

DeploymentCredential.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  cloud: PropTypes.object,
  controllerIsReady: PropTypes.func.isRequired,
  credential: PropTypes.string,
  editable: PropTypes.bool,
  generateCloudCredentialName: PropTypes.func.isRequired,
  getCloudCredentialNames: PropTypes.func.isRequired,
  getCloudCredentials: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  region: PropTypes.string,
  sendAnalytics: PropTypes.func.isRequired,
  setCredential: PropTypes.func.isRequired,
  setRegion: PropTypes.func.isRequired,
  updateCloudCredential: PropTypes.func.isRequired,
  user: PropTypes.string,
  validateForm: PropTypes.func.isRequired
};

module.exports = DeploymentCredential;
