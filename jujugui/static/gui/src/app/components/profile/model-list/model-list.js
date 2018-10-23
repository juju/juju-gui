/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../shared/basic-table/basic-table');
const CreateModelButton = require('../../create-model-button/create-model-button');
const DateDisplay = require('../../date-display/date-display');
const Popup = require('../../popup/popup');
const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

/**
  Model list React component used to display a list of the users models in
  their profile.
*/
class ProfileModelList extends React.Component {
  constructor() {
    super();
    this.state = {
      loadingModels: false,
      models: null,
      notification: null
    };
  }

  componentDidMount() {
    this._fetchModels();
  }

  /**
    Makes a request of the controller to fetch the user's availble models.
  */
  _fetchModels() {
    this.setState({loadingModels: true}, () => {
      this.props.modelManager.listModelSummaries(null, this._fetchModelsCallback.bind(this));
    });
  }

  /**
    Callback for the controller listModelSummaries call.
    @param {String} err The error from the request, or null.
    @param {Array} modelList The list of models.
  */
  _fetchModelsCallback(err, modelList) {
    this.setState({loadingModels: false}, () => {
      if (err) {
        const message = 'Cannot load models';
        console.error(message, err);
        this.props.addNotification({
          title: message,
          message: `${message}: ${err}`,
          level: 'error'
        });
        return;
      }
      this.setState({models: modelList.results});
    });
  }

  /**
    Destroys a model once confirmed by the user.
    @param {Object} string The UUID of the model to destroy.
  */
  _confirmDestroy(modelUUID) {
    this.setState({notification: null});
    this.props.destroyModel(modelUUID, (errors, data) => {
      if (errors) {
        errors.forEach(error => {
          this.props.addNotification({
            title: 'Error destroying model',
            message: error,
            level: 'error'
          });
        });
      }
      this._fetchModels();
    }, false);
  }

  /**
    Shows the confirmation modal for destroying a model.
    @param {Object} model The model data.
  */
  _showConfirmation(model) {
    const buttons = [{
      title: 'Cancel',
      action: () => this.setState({notification: null}),
      type: 'inline-neutral'
    }, {
      title: 'Destroy',
      action: this._confirmDestroy.bind(this, model.uuid),
      type: 'destructive'
    }];
    const message =
      `Are you sure you want to destroy ${model.name}?` +
      ' All the applications, units and storage used by the model will be' +
      ' destroyed. This action cannot be undone.';
    this.setState({
      notification: (
        <Popup
          buttons={buttons}
          title="Destroy model">
          <p>{message}</p>
        </Popup>)
    });
  }

  /**
    Calls to destroy the supplied model.
    @param {Object} model The model object.
    @param {String} bdRef The ref index of the button dropdown component.
    @param {Object} e The click event.
  */
  _destroyModel(model, bdRef, e) {
    e.preventDefault();
    e.stopPropagation();
    if (model.isController) {
      this.props.addNotification({
        title: 'Cannot destroy model',
        message: 'The controller model cannot be destroyed.',
        level: 'error'
      });
      return;
    }
    this._showConfirmation(model);
  }

  /**
    Navigate to a credential.
    @param credential {String} The credential name.
  */
  _handleCredentialClick(credential) {
    this.props.changeState({
      hash: `credentials/${credential}`
    });
  }

  /**
    Generates the list of models that are owned by the active user.
    @return {Object} The model list as JSX.
  */
  _generateModels() {
    const icons = new Map([
      ['read', 'show_16'],
      ['write', 'edit_16'],
      ['admin', 'user_16']
    ]);
    const models = this.state.models || [];
    return (
      models.reduce((modelList, item, index) => {
        const model = item.result;
        // Keep only the models that aren't currently in the destroy cycle.
        if (model.life !== 'alive') {
          return modelList;
        }
        // It is possible that the user is a superuser with no models but has
        // access to all of the models. In this case we don't want to display
        // all the models. In the future we will add a filter to display these
        // models.
        if (model.userAccess === 'superuser') {
          return modelList;
        }
        const bdRef = `mymodel-button-dropdown-${index}`;
        const owner = model.ownerTag.replace('@external', '').replace('user-', '');
        const path = `${this.props.baseURL}u/${owner}/${model.name}`;
        const userIsAdmin = model.userAccess === 'admin';
        const username = owner === this.props.userName ? 'Me' : owner;
        const region = model.cloudRegion ? '/' + model.cloudRegion : '';
        const cloud = model.cloudTag ? model.cloudTag.replace('cloud-', '') : null;
        const nameContent = (
          <a
            href={path}
            onClick={this.switchToModel.bind(this, {
              name: model.name,
              id: model.uuid,
              owner
            })}>
            {model.name}
          </a>
        );
        const regionContent = (
          <React.Fragment>
            <span className="profile-model-list__machine-number">{model.numMachines}</span>
            {cloud || model.providerType}
            {region}
          </React.Fragment>
        );
        const accessContent = (
          <span className="profile-model-list__access tooltip">
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">{model.userAccess}</span>
            </span>
            <SvgIcon
              name={icons.get(model.userAccess)}
              size="16" />
          </span>
        );
        const dateContent = (
          <DateDisplay
            date={model.lastConnection || '--'}
            relative={true} />
        );
        const destroyContent =
          userIsAdmin && !model.isController ? (
            <a onClick={this._destroyModel.bind(this, model, bdRef)}>
              <SvgIcon
                name="delete_16"
                size="16" />
            </a>
          ) : null;
        let expandedContent;
        if (owner === this.props.userName) {
          expandedContent = (
            <a
              className="profile-model-list__link u-no-padding--bottom"
              onClick={this._handleCredentialClick.bind(this, model.credential)}
              role="button"
              tabIndex="0">
              {model.credentialName}
            </a>
          );
        } else {
          expandedContent = (
            <p className="col-12">No additional information available on shared model.</p>
          );
        }
        modelList.push({
          columns: [
            {
              content: nameContent
            }, {
              content: username,
              classes: ['u-hide--small']
            }, {
              content: regionContent
            }, {
              content: accessContent
            }, {
              content: dateContent,
              classes: ['u-hide--small']
            }, {
              content: destroyContent
            }
          ],
          expandedContent: (
            <React.Fragment>
              <td>{nameContent}</td>
              <td>{username}</td>
              <td>
                {regionContent}
                {expandedContent}
              </td>
              <td>{accessContent}</td>
              <td>{dateContent}</td>
              <td>{destroyContent}</td>
            </React.Fragment>
          ),
          key: model.name
        });
        return modelList;
      }, []) || []
    );
  }

  /**
    Call the switchModel prop to switch a model passing it the necessary
    model data. Prevents default and propagation.
    @param {Object} model The model data necessary for the switchModel call.
    @param {Object} e The click event.
  */
  switchToModel(model, e) {
    e.preventDefault();
    e.stopPropagation(); // Required to avoid react error about root DOM node.
    // We call a changeState here to close the profile even though the util
    // switchModel calls its own version of changeState. This is because
    // switchModel does nothing if you're already connected to the model.
    // This is the correct thing to do but we still want to close the profile
    // in this case.
    this.props.changeState({profile: null});
    this.props.switchModel(model);
  }

  _generateNotification() {
    if (!this.state.notification) {
      return;
    }
    return this.state.notification;
  }

  render() {
    if (this.state.loadingModels) {
      return (
        <div className="profile-model-list">
          <Spinner />
        </div>);
    }
    const rowData = this._generateModels();
    return (
      <div className="profile-model-list">
        <div className="profile-model-list__header">
          <h4 className="profile__title">
            Models
            <span className="profile__title-count">({rowData.length})</span>
          </h4>
          <CreateModelButton
            changeState={this.props.changeState}
            switchModel={this.props.switchModel}
            title="Start a new model" />
        </div>
        {!rowData.length ? null : (
          <BasicTable
            headers={[
              {
                content: 'Name'
              }, {
                content: 'Owner'
              }, {
                content: 'Machines, cloud/region'
              }, {
                content: ''
              }, {
                content: 'Last accessed'
              }, {
                content: ''
              }
            ]}
            rows={rowData} />
        )}
        {this._generateNotification()}
      </div>);
  }
}

ProfileModelList.propTypes = {
  acl: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  destroyModel: PropTypes.func.isRequired,
  modelManager: PropTypes.object.isRequired,
  models: PropTypes.array,
  switchModel: PropTypes.func.isRequired,
  userName: PropTypes.string
};

module.exports = ProfileModelList;
