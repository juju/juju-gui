/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const enhanceWithClickOutside = require('../../init/react-click-outside');

const EnvList = require('./list/list');
const SvgIcon = require('../svg-icon/svg-icon');

class EnvSwitcher extends React.Component {
  constructor() {
    super();
    this.state = {
      envList: [],
      hasFocus: false,
      showEnvList: false,
      validName: true
    };
  }

  componentDidMount() {
    this.updateEnvList();
  }

  /**
    Close the switcher when there is a click outside of the component.
    Called by the component wrapper.

    @method handleClickOutside
    @param {Object} e The click event
  */
  handleClickOutside(e) {
    this.setState({showEnvList: false});
  }

  /**
    Calls to the environment to list the active environments.

    @method updateEnvList
  */
  updateEnvList() {
    this.props.listModelsWithInfo(this._updateModelListCallback.bind(this));
  }

  /**
    Sets the state with the supplied data from the
    controllerAPI.listModelsWithInfo call.

    @method _updateModelListCallback
    @param {String} err The possible error from the call, or null.
    @param {Array} models The list of models returned by the call.
  */
  _updateModelListCallback(err, models) {
    if (err) {
      const message = 'unable to retrieve model list';
      this.props.addNotification({
        title: message,
        message: `${message}: ${err}`,
        level: 'error'
      });
      console.error(message, err);
      return;
    }
    const modelList = models.filter(model => {
      return model.isAlive;
    });
    this.setState({envList: modelList});
  }

  /**
    Sets the state of the 'showEnvList' property to the inverse of what
    it was.

    @method _toggleEnvList
    @param {Object} e The click event.
  */
  _toggleEnvList(e) {
    e.preventDefault();
    this.updateEnvList();
    this.setState({ showEnvList: !this.state.showEnvList });
  }

  /**
    Sets the state of the 'showEnvList' property to the inverse of what
    it was when <Enter> or <Space> is clicked.

    @method _handleKeyToggle
  */
  _handleKeyToggle(e) {
    var key = e.which || e.keyCode || 0;
    // key === <Enter> or <Space>
    if (key === 13 || key === 32) {
      this._toggleEnvList(e);
    }
  }

  /**
    Hides the model list and calls the switchModel method with the selected
    model.

    @method handleModelClick
    @param {Object} model The model to switch to, with these attributes:
      - name: the model name;
      - id: the model unique identifier;
      - owner: the user owning the model, like "admin" or "who@external".
  */
  handleModelClick(model) {
    const props = this.props;
    this.setState({showEnvList: false});
    props.switchModel(model);
  }

  /**
    Returns the environment list components if the showEnvList state property
    is truthy.

    @method environmentList
    @return {Function} The EnvList component.
  */
  environmentList() {
    if (this.state.showEnvList) {
      return (
        <EnvList
          acl={this.props.acl}
          changeState={this.props.changeState}
          environmentName={this.props.environmentName}
          envs={this.state.envList}
          handleModelClick={this.handleModelClick.bind(this)}
          humanizeTimestamp={this.props.humanizeTimestamp}
          switchModel={this.props.switchModel}
          user={this.props.user} />);
    }
  }

  /**
    Generate the toggle state classes based on the props.

    @method _toggleClasses
    @return {String} The collection of class names.
  */
  _toggleClasses() {
    return classNames(
      'env-switcher__toggle',
      {
        'editable': !this.props.modelCommitted,
        'editing': this.state.hasFocus,
        'is-active': this.state.showEnvList
      }
    );
  }

  /**
    Handle the model name input receiving focus.

    @param evt {Object} The focus event.
  */
  _handleInputFocus(evt) {
    const range = document.createRange();
    range.selectNodeContents(evt.currentTarget);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    this.setState({hasFocus: true});
  }

  /**
    Handle the model name input losing focus.
  */
  _handleInputBlur() {
    const name = this.refs.name.innerText;
    // Regex for checking that a string only contains lowercase letters,
    // numbers, and hyphens and that it does not start or end with a hyphen.
    const regex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?)?$/;
    let valid = name && regex.test(name) || false;
    this.setState({
      validName: valid,
      hasFocus: false
    });
    if (valid) {
      this.props.setModelName(name);
    }
  }

  /**
    Generate the model name.
  */
  _generateName() {
    if (this.props.modelCommitted) {
      return (
        <span className="env-switcher__name"
          ref="name">
          {this.props.environmentName}
        </span>);
    }
    // If the model is not committed then allow the name to be changed.
    return (
      <div>
        <span className="env-switcher__name"
          contentEditable={true}
          dangerouslySetInnerHTML={{__html: this.props.environmentName}}
          onBlur={this._handleInputBlur.bind(this)}
          onFocus={this._handleInputFocus.bind(this)}
          ref="name" />
        <div className="env-switcher__name-error">
          The model name must only contain lowercase letters, numbers, and
          hyphens. It must not start or end with a hyphen.
        </div>
      </div>);
  }

  render() {
    const toggleEnvList = this._toggleEnvList.bind(this);
    const classes = classNames(
      'env-switcher',
      {'env-switcher--error': !this.state.validName}
    );
    return (
      <div aria-label="Model switcher"
        className={classes}
        onClick={this.props.modelCommitted ? toggleEnvList : null}
        role="navigation"
        tabIndex="0">
        <div className={this._toggleClasses()}>
          {this._generateName()}
          <div aria-controls="environmentSwitcherMenu"
            aria-expanded="false"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            className="env-switcher__chevron"
            id="environmentSwitcherToggle"
            onClick={toggleEnvList}
            onKeyPress={this._handleKeyToggle.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon
              name="chevron_down_16"
              size="16" />
          </div>
        </div>
        {this.environmentList()}
      </div>
    );
  }
};

EnvSwitcher.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  environmentName: PropTypes.string,
  humanizeTimestamp: PropTypes.func.isRequired,
  listModelsWithInfo: PropTypes.func,
  modelCommitted: PropTypes.bool,
  setModelName: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  user: PropTypes.object
};

EnvSwitcher.defaultProps = {
  environmentName: 'untitled-model'
};

module.exports = enhanceWithClickOutside(EnvSwitcher);
