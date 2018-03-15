/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
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
    Handle submitting the form.
    @param evt {Object} The submit event.
  */
  _handleAddCredentials(evt) {
    evt.preventDefault();
    const props = this.props;
    const info = this._getInfo();
    if (!info || !info.forms) {
      return;
    }
    let fields = info.forms[this.state.authType].map(field => field.id);
    // If a credentialName was provided then we're editing credentials so it
    // is ok to have a duplicate.
    if (!props.credentialName) {
      fields.push('credentialName');
    }
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
    this.props.onCredentialUpdated(credential);
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
    if (!info.forms[this.state.authType]) {
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
              ref={field.id}
              required={required} />
          </div>);
      }
      return (
        <GenericInput
          autocomplete={field.autocomplete}
          disabled={isReadOnly}
          key={field.id}
          label={field.title}
          multiLine={field.multiLine}
          ref={field.id}
          required={required}
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
        <div className="deployment-credential-add__notice prepend-one five-col last-col">
          <p className="deployment-credential-add__notice-content">
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
    const props = this.props;
    // If a name was provided then we're editing, not adding.
    const prefix = props.credentialName ? 'Update' : 'Add';
    let buttons = [{
      submit: true,
      title: `${prefix} cloud credential`,
      type: 'inline-positive'
    }];
    if (props.onCancel) {
      buttons.unshift({
        action: props.onCancel.bind(this),
        title: 'Cancel',
        type: 'inline-neutral'
      });
    }
    // If no cloud has been selected we set a default so that the disabled
    // form will display correctly as the next step.
    const cloud = props.cloud;
    const id = cloud && cloud.cloudType || this.DEFAULT_CLOUD_TYPE;
    const info = this._getInfo();
    const title = info && info.title || cloud.name;
    const credentialNameLabel = id === 'gce' ?
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
    const credentials = props.credentials || [];
    if (credentials.length > 0) {
      nameValidators.push({
        check: value => credentials.indexOf(value.toLowerCase()) > -1,
        error: 'You already have a credential with this name.'
      });
    }
    const credentialName = props.credentialName;
    const signupURL = info && info.signupUrl;
    return (
      <div className="deployment-credential-add twelve-col no-margin-bottom">
        <h4>
          {`${credentialName ? 'Update' : 'Create new'} ${title} credential`}
        </h4>
        {credentialName || !signupURL ? null : (
          <div className="twelve-col deployment-credential-add__signup">
            <a className="deployment-credential-add__link" href={signupURL}
              target="_blank">
              Sign up for {title}
              &nbsp;
              <SvgIcon
                name="external-link-16"
                size="12" />
            </a>
          </div>)}
        <form className="twelve-col no-margin-bottom"
          onSubmit={this._handleAddCredentials.bind(this)}>
          <div className="six-col last-col">
            <GenericInput
              disabled={props.acl.isReadOnly() || !!credentialName}
              label={credentialNameLabel}
              ref="credentialName"
              required={true}
              validate={nameValidators}
              value={credentialName} />
          </div>
          <h3 className="deployment-panel__section-title twelve-col">
            Enter credentials
          </h3>
          {this._generateCredentialsFields()}
          <div className={
            'deployment-credential-add__buttons twelve-col last-col no-margin-bottom'}>
            <ButtonRow
              buttons={buttons} />
          </div>
        </form>
      </div>
    );
  }
};

DeploymentCredentialAdd.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  cloud: PropTypes.object,
  credentialName: PropTypes.string,
  credentials: PropTypes.array.isRequired,
  generateCloudCredentialName: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onCredentialUpdated: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  updateCloudCredential: PropTypes.func.isRequired,
  user: PropTypes.string,
  validateForm: PropTypes.func.isRequired
};

module.exports = DeploymentCredentialAdd;
