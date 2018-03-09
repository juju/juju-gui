/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

class ModelActions extends React.Component {
  /**
    Export the env when the button is clicked.
  */
  _handleExport() {
    this.props.exportEnvironmentFile();
  }

  /**
    Open a file picker when the button is clicked.
  */
  _handleImportClick() {
    var input = this.refs['file-input'];
    if (input) {
      input.click();
    }
  }

  /**
    When file is submitted the drag over animation is triggered and the file
    is passed to the utils function.
  */
  _handleImportFile() {
    var inputFile = this.refs['file-input'].files[0];
    if (inputFile) {
      this.props.renderDragOverNotification(false);
      this.props.importBundleFile(inputFile);
      setTimeout(() => {
        this.props.hideDragOverNotification();
      }, 600);
    }
  }

  /**
    Handle the user clicking the show-terminal button.
  */
  _handleTerminalClick() {
    this.props.changeState({
      terminal: true
    });
  }

  /**
    Returns the classes for the button based on the provided props.
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    const props = this.props;
    const currentState = props.appState.current;
    const isDisabled = (
      currentState.profile ||
      currentState.root === 'account' ||
      props.loadingModel
    );
    return classNames(
      'model-actions', {'model-actions--loading-model': isDisabled});
  }

  render() {
    const props = this.props;
    // Disable sharing if the user is anonymous or we're creating a new
    // model.
    const sharingEnabled = props.userIsAuthenticated &&
      props.appState.current.root !== 'new';
    let shareAction = null;
    if (sharingEnabled) {
      const shareClasses = classNames(
        'model-actions__share',
        'model-actions__button'
      );
      shareAction = (
        <span className={shareClasses}
          onClick={props.sharingVisibility}
          role="button"
          tabIndex="0">
          <SvgIcon className="model-actions__icon"
            name="share_16"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              Share
            </span>
          </span>
        </span>
      );
    }

    let terminalAction = null;
    if (props.displayTerminalButton) {
      terminalAction = (
        <span className="model-actions__import model-actions__button"
          onClick={this._handleTerminalClick.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon className="model-actions__icon"
            name="code-snippet_24"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              Juju shell
            </span>
          </span>
        </span>);
    }
    const isReadOnly = props.acl.isReadOnly();
    return (
      <div className={this._generateClasses()}>
        <div className="model-actions__buttons">
          <span className="model-actions__export model-actions__button"
            onClick={this._handleExport.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon className="model-actions__icon"
              name="export_16"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Export
              </span>
            </span>
          </span>
          <span className="model-actions__import model-actions__button"
            onClick={!isReadOnly && this._handleImportClick.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon className="model-actions__icon"
              name="import_16"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Import
              </span>
            </span>
          </span>
          {shareAction}
          {terminalAction}
        </div>
        <input accept=".zip,.yaml,.yml"
          className="model-actions__file"
          onChange={isReadOnly ? null : this._handleImportFile.bind(this)}
          ref="file-input"
          type="file" />
      </div>
    );
  }
};

ModelActions.propTypes = {
  acl: PropTypes.object.isRequired,
  appState: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  displayTerminalButton: PropTypes.bool.isRequired,
  exportEnvironmentFile: PropTypes.func.isRequired,
  hideDragOverNotification: PropTypes.func.isRequired,
  importBundleFile: PropTypes.func.isRequired,
  loadingModel: PropTypes.bool,
  renderDragOverNotification: PropTypes.func.isRequired,
  sharingVisibility: PropTypes.func.isRequired,
  userIsAuthenticated: PropTypes.bool
};

ModelActions.defaultProps = {
  sharingVisibility: () => {
    console.log('No sharingVisibility function was provided.');
  },
  loadingModel: false,
  userIsAuthenticated: false
};

module.exports = ModelActions;
