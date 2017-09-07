/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

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
      return <juju.components.EnvList
        acl={this.props.acl}
        user={this.props.user}
        changeState={this.props.changeState}
        clearPostDeployment={this.props.clearPostDeployment}
        handleModelClick={this.handleModelClick.bind(this)}
        humanizeTimestamp={this.props.humanizeTimestamp}
        environmentName={this.props.environmentName}
        envs={this.state.envList}
        switchModel={this.props.switchModel}
      />;
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
    Handle keyup in the model name input.
  */
  _handleInputKeyUp() {
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
      <div className={classes}
        role="navigation"
        aria-label="Model switcher"
        onClick={this.props.modelCommitted ? toggleEnvList : null}
        tabIndex="0">
        <div className={this._toggleClasses()}>
          {this._generateName()}
          <div className="env-switcher__chevron"
            onClick={toggleEnvList}
            onKeyPress={this._handleKeyToggle.bind(this)}
            id="environmentSwitcherToggle"
            role="button"
            tabIndex="0"
            aria-haspopup="true"
            aria-owns="environmentSwitcherMenu"
            aria-controls="environmentSwitcherMenu"
            aria-expanded="false">
            <juju.components.SvgIcon
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
  clearPostDeployment: PropTypes.func.isRequired,
  environmentName: PropTypes.string,
  humanizeTimestamp: PropTypes.func.isRequired,
  listModelsWithInfo: PropTypes.func,
  modelCommitted: PropTypes.bool,
  setModelName: PropTypes.func.isRequired,
  switchModel: PropTypes.func.isRequired,
  user: PropTypes.object
};

YUI.add('env-switcher', function() {
  // Wrap the component to handle clicking outside.
  juju.components.EnvSwitcher = enhanceWithClickOutside(EnvSwitcher);
}, '0.1.0', { requires: [
  'env-list',
  'svg-icon'
] });
