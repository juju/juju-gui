/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const CreateModelButton = require('../../create-model-button/create-model-button');
const initUtils = require('../../../init/utils');
const {Panel} = require('@canonical/juju-react-components');
const {SvgIcon} = require('@canonical/juju-react-components');

require('./_list.scss');

class EnvList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      envs: this.props.envs
    };
    this.analytics = this.props.analytics.addCategory('Model Switcher');
  }

  componentDidMount() {
    this.analytics.sendEvent(this.props.analytics.VIEW);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({envs: nextProps.envs});
  }

  /**
    Generate the elements for the list of models.
    @return {Object} The JSX elements for the list of models.
  */
  generateModelList() {
    const models = this.state.envs;
    if (!models.length) {
      return false;
    }
    const currentUser = this.props.user ? this.props.user.username : null;
    const sortedModels = models
      .map(model => {
        let name = model.name;
        let owner = model.owner;
        let ownerNoDomain;
        if (owner.indexOf('@') === -1) {
          // Juju does not return domains for local owners when listing models.
          ownerNoDomain = owner;
          owner += '@local';
        } else {
          ownerNoDomain = owner.split('@')[0];
        }
        if (owner !== currentUser) {
          name = `${ownerNoDomain}/${model.name}`;
        }
        let cloud = initUtils.getCloudProviderDetails(model.provider).id;
        return (
          <li
            className="env-list__environment"
            data-id={model.uuid}
            data-name={model.name}
            data-owner={model.owner}
            key={model.uuid}
            onClick={this._handleModelClick.bind(this)}
            role="menuitem"
            tabIndex="0">
            {name}
            <SvgIcon
              className="env-list__environment-icon"
              name={`profile-${cloud}`}
              size="26" />
          </li>
        );
      });
    return sortedModels;
  }

  /**
    Handle clicking on a model.

    @method _handleModelClick
    @param {Object} evt The click event.
  */
  _handleModelClick(evt) {
    const currentTarget = evt.currentTarget;
    this.props.handleModelClick({
      id: currentTarget.getAttribute('data-id'),
      name: currentTarget.getAttribute('data-name'),
      owner: currentTarget.getAttribute('data-owner')
    });
    this.analytics.addCategory('Model').sendEvent(this.props.analytics.CLICK);
  }

  /**
    When creating a new model, the dropdown needs to be closed.

    @method _handleNewModelClick
  */
  _handleNewModelClick() {
    this.props.handleModelClick();
  }

  /**
    Generate the list of models.

    @method _generateModelList
  */
  _generateModels() {
    return (
      <ul
        aria-expanded="true"
        aria-hidden="false"
        aria-labelledby="environmentSwitcherToggle"
        className="env-list"
        id="environmentSwitcherMenu"
        role="menubar">
        {this.generateModelList()}
      </ul>
    );
  }

  render() {
    // TODO frankban: retrieving gisf from the global state is a bad
    // practice and it is only done here as gisf is only required for a bug
    // in the ACL returned by JIMM. Once the bug is fixed, we can remove
    // mentions of gisf here.
    const gisf = window.juju_config && window.juju_config.gisf;
    const canAddModels = !!gisf || this.props.acl.canAddModels();
    const user = this.props.user;
    let createNew;
    if (user) {
      createNew = (
        <CreateModelButton
          action={this._handleNewModelClick.bind(this)}
          analytics={this.analytics}
          changeState={this.props.changeState}
          disabled={!canAddModels}
          modifier="neutral"
          switchModel={this.props.switchModel}
          title="Start a new model" />);
    }
    return (
      <Panel
        instanceName="env-list-panel"
        visible={true}>
        {this._generateModels()}
        {createNew}
      </Panel>
    );
  }
};

EnvList.propTypes = {
  acl: PropTypes.object.isRequired,
  analytics: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  environmentName: PropTypes.string,
  envs: PropTypes.array.isRequired,
  handleModelClick: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  user: PropTypes.object
};

module.exports = EnvList;
