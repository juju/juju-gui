/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');

const DeploymentCloud = require('../deployment-flow/cloud/cloud');
const DeploymentCredentialAdd = require('../deployment-flow/credential/add/add');
const Button = require('../shared/button/button');
const Spinner = require('../spinner/spinner');

// List, add and remove cloud credentials in the account page.
class CredentialAddEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clouds: [],
      cloud: null,
      loading: false
    };
  }

  componentWillMount() {
    this._getClouds();
  }

  /**
    Retrieve the list of clouds.
  */
  _getClouds() {
    this.setState({loading: true}, () => {
      this.props.controllerAPI.listClouds((error, clouds) => {
        if (error) {
          const message = 'Unable to list clouds';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        this.setState({
          clouds: clouds,
          loading: false
        });
      });
    });
  }

  /**
    Store the selected cloud in state.
    @param {String} cloud The selected cloud.
  */
  _setCloud(cloud) {
    this.setState({cloud: cloud});
  }

  /**
    Generates the cloud selection form.
    @returns {Object} React component for DeploymentCloud.
  */
  _generateChooseCloud() {
    return (
      <DeploymentCloud
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        cloud={this.state.cloud}
        controllerIsReady={this.props.controllerIsReady}
        key="deployment-cloud"
        listClouds={this.props.controllerAPI.listClouds}
        setCloud={this._setCloud.bind(this)}
      />
    );
  }

  /**
    Generate the add credentials UI with any supplied overrides depending
    on where it is to be rendered.
    @returns {Object} React component for DeploymentCredentialAdd
  */
  _generateCredentialForm() {
    const credential = this.props.credential;
    return (
      <DeploymentCredentialAdd
        acl={this.props.acl}
        addNotification={this.props.addNotification}
        cloud={
          credential && credential.cloud
            ? this.state.clouds[credential.cloud]
            : this.state.cloud
        }
        credentialName={(credential && (credential.name || credential.displayName)) || null}
        credentials={this.props.credentials}
        key="deployment-credential-add"
        onCancel={this.props.onCancel}
        onCredentialUpdated={this.props.onCredentialUpdated}
        sendAnalytics={this.props.sendAnalytics}
        updateCloudCredential={this.props.controllerAPI.updateCloudCredential}
        user={this.props.username}
      />
    );
  }

  /**
    Generate the change cloud button.
    @returns {Object} The button JSX.
  */
  _generateChangeCloud() {
    if (Object.keys(this.state.clouds).length < 2) {
      return null;
    }
    return (
      <div className="credential-add-edit__choose-cloud">
        <Button action={this._setCloud.bind(this, null)} type="inline-neutral">
          Change cloud
        </Button>
      </div>
    );
  }

  /**
    Generate a form to add or edit credentials.
    @returns {Object} The content JSX.
  */
  _generateContent() {
    if (this.state.loading) {
      return <Spinner />;
    } else if (this.props.credential) {
      return this._generateCredentialForm();
    } else if (!this.state.cloud) {
      return this._generateChooseCloud();
    } else {
      return (
        <div>
          {this._generateChangeCloud()}
          {this._generateChooseCloud()}
          {this._generateCredentialForm()}
        </div>
      );
    }
  }

  render() {
    return <div className="credential-add-edit">{this._generateContent()}</div>;
  }
}

CredentialAddEdit.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  controllerAPI: shapeup.shape({
    listClouds: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    updateCloudCredential: PropTypes.func.isRequired
  }).isRequired,
  controllerIsReady: PropTypes.func.isRequired,
  credential: PropTypes.object,
  credentials: PropTypes.arrayOf(PropTypes.string.isRequired),
  onCancel: PropTypes.func,
  onCredentialUpdated: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired
};

module.exports = CredentialAddEdit;
