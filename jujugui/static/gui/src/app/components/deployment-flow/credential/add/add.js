/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const SvgIcon = require('../../../svg-icon/svg-icon');
const InsetSelect = require('../../../inset-select/inset-select');
const GenericInput = require('../../../generic-input/generic-input');
const ButtonRow = require('../../../button-row/button-row');
const FileField = require('../../../file-field/file-field');

class DeploymentCredentialAdd extends React.Component {
  constructor(props) {
    super(props);
    this.DEFAULT_CLOUD_TYPE = 'gce';
    const info = this._getInfo();
    this.state = {
      authType: info && info.forms && Object.keys(info.forms)[0] || ''
    };
  }

  componentWillReceiveProps(nextProps) {
    const oldId = this.props.cloud && this.props.cloud.cloudType;
    const newId = nextProps.cloud && nextProps.cloud.cloudType;
    if (newId !== oldId) {
      const info = this._getInfo(nextProps);
      this.setState(
        {authType: info && info.forms && Object.keys(info.forms)[0]});
    }
  }

  /**
    Generate a full credential object in the expected format.

    @method _generateCredentials
    @returns {Object} The collection of field values.
  */
  _generateCredentials() {
    const info = this._getInfo();
    const fields = {};
    info.forms[this.state.authType].forEach(field => {
      let value = this.refs[field.id].getValue();
      if (field.unescape) {
        value = decodeURIComponent(value.replace(/\\n/g, '\n'));
      }
      fields[field.id] = value;
    });
    return fields;
  }

  /**
    Handling clicking on a cloud option.

    @method _handleCloudClick
  */
  _handleAddCredentials() {
    const props = this.props;
    const info = this._getInfo();
    if (!info || !info.forms) {
      return;
    }
    let fields = info.forms[this.state.authType].map(field => field.id);
    fields.push('credentialName');
    var valid = props.validateForm(fields, this.refs);
    if (!valid) {
      // If there are any form validation errors then stop adding the
      // credentials.
      return;
    }
    const credentialName = this.refs.credentialName.getValue();
    this.props.sendAnalytics(
      'Button click',
      'Add credentials'
    );
    props.updateCloudCredential(
      props.generateCloudCredentialName(
        props.cloud.name, props.user, credentialName),
      this.state.authType,
      this._generateCredentials(),
      this._updateCloudCredentialCallback.bind(this, credentialName));
  }

  /**
    The method to be called once the updateCloudCredential request is
    complete.

    @method _updateCloudCredentialCallback
    @param {String} credential The credential name to select when the
      credential has been added and the list of credentials loaded again.
    @param {String} error An error message, or null if there's no error.
  */
  _updateCloudCredentialCallback(credential, error) {
    if (error) {
      this.props.addNotification({
        title: 'Could not add credential',
        message: `Could not add the credential: ${error}`,
        level: 'error'
      });
      return;
    }
    // Load the credentials again so that the list will contain the newly
    // added credential.
    this.props.getCredentials(
      this.props.generateCloudCredentialName(
        this.props.cloud.name, this.props.user, credential));
    this.props.close();
  }

  /**
    Set the authType state when the select changes.

    @method _handleAuthChange
    @param {String} authType The selected authType.
  */
  _handleAuthChange(authType) {
    this.setState({authType: authType});
  }

  /**
    Generate the form select if the cloud has multiple forms.

    @method _generateAuthSelect
    @returns {Object} The auth type select component or undefined if there is
      only one auth type.
  */
  _generateAuthSelect() {
    const info = this._getInfo();
    if (Object.keys(info.forms).length === 1) {
      return;
    }
    const authOptions = Object.keys(info.forms).map(auth => {
      return {
        label: auth,
        value: auth
      };
    });
    return (
      <InsetSelect
        disabled={this.props.acl.isReadOnly()}
        label="Authentication type"
        onChange={this._handleAuthChange.bind(this)}
        options={authOptions} />);
  }

  /**
    Get the info for a cloud

    @method _getInfo
    @param {Object} props The component props.
    @returns {Object} The cloud info if available.
  */
  _getInfo(props=this.props) {
    const cloud = props.cloud;
    const id = cloud && cloud.cloudType || this.DEFAULT_CLOUD_TYPE;
    return props.getCloudProviderDetails(id);
  }

  /**
    Generate the fields for entering cloud credentials.

    @method _generateCredentialsFields
  */
  _generateCredentialsFields() {
    var isReadOnly = this.props.acl.isReadOnly();
    const info = this._getInfo();
    if (!info || !info.forms) {
      return;
    }
    const fields = info.forms[this.state.authType].map(field => {
      // If the required parameter is not provided then default it to true.
      const required = field.required === undefined ? true : field.required;
      if (field.json) {
        return (
          <div className="deployment-credential-add__upload"
            key={field.id}>
            <FileField
              accept=".json"
              disabled={isReadOnly}
              key={field.id}
              label={`Upload ${info.title} .json auth-file`}
              required={required}
              ref={field.id} />
          </div>);
      }
      return (
        <GenericInput
          autocomplete={field.autocomplete}
          disabled={isReadOnly}
          key={field.id}
          label={field.title}
          multiLine={field.multiLine}
          required={required}
          ref={field.id}
          type={field.type}
          validate={required ? [{
            regex: /\S+/,
            error: 'This field is required.'
          }] : undefined} />);
    });
    return (
      <div className="deployment-credential-add__credentials">
        <div className="six-col">
          {info.message}
          {this._generateAuthSelect()}
          {fields}
        </div>
        <div className="deployment-flow__notice six-col last-col">
          <p className="deployment-flow__notice-content">
            <SvgIcon
              name="general-action-blue"
              size="16" />
            Credentials are stored securely on our servers and we will
            notify you by email whenever they are changed or deleted.
            You can see where they are used and manage or remove them via
            the account page.
          </p>
        </div>
      </div>);
  }

  render() {
    let buttons = [{
      action: this._handleAddCredentials.bind(this),
      submit: true,
      title: 'Add cloud credential',
      type: 'inline-positive'
    }];
    if (!this.props.hideCancel) {
      buttons.unshift({
        action: () => { this.props.close(true); },
        title: 'Cancel',
        type: 'inline-neutral'
      });
    }
    // If no cloud has been selected we set a default so that the disabled
    // form will display correctly as the next step.
    var isReadOnly = this.props.acl.isReadOnly();
    const cloud = this.props.cloud;
    const id = cloud && cloud.cloudType || this.DEFAULT_CLOUD_TYPE;
    const info = this._getInfo();
    var title = info && info.title || cloud.name;
    var credentialName = id === 'gce' ?
      'Project ID (credential name)' : 'Credential name';
    const nameValidators = [{
      regex: /\S+/,
      error: 'This field is required.'
    }, {
      regex: /^([a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/,
      error: 'This field must only contain upper and lowercase ' +
        'letters, numbers, and hyphens. It must not start or ' +
        'end with a hyphen.'
    }];
    const credentials = this.props.credentials || [];
    if (credentials.length > 0) {
      nameValidators.push({
        check: value => credentials.indexOf(value.toLowerCase()) > -1,
        error: 'You already have a credential with this name.'
      });
    }
    return (
      <div className="deployment-credential-add twelve-col">
        <h4>{`Create new ${title} credential`}</h4>
        <div className="twelve-col deployment-credential-add__signup">
          <a href={info && info.signupUrl}
            target="_blank">
            Sign up for {title}
            &nbsp;
            <SvgIcon
              name="external-link-16"
              size="12" />
          </a>
        </div>
        <form className="twelve-col">
          <div className="six-col last-col">
            <GenericInput
              disabled={isReadOnly}
              label={credentialName}
              required={true}
              ref="credentialName"
              validate={nameValidators} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          {this._generateCredentialsFields()}
        </form>
        <div className={
          'deployment-credential-add__buttons twelve-col last-col'}>
          <ButtonRow
            buttons={buttons} />
        </div>
      </div>
    );
  }
};

DeploymentCredentialAdd.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  cloud: PropTypes.object,
  credentials: PropTypes.array.isRequired,
  generateCloudCredentialName: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  getCredentials: PropTypes.func.isRequired,
  hideCancel: PropTypes.bool,
  sendAnalytics: PropTypes.func.isRequired,
  setCredential: PropTypes.func.isRequired,
  updateCloudCredential: PropTypes.func.isRequired,
  user: PropTypes.string,
  validateForm: PropTypes.func.isRequired
};

module.exports = DeploymentCredentialAdd;
