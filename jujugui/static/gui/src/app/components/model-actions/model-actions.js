/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');
const Terminal = require('../terminal/terminal');

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
        this.props.hideDragOverNotification();}, 600);
    }
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
          <SvgIcon name="share_16"
            className="model-actions__icon"
            size="16" />
          <span className="tooltip__tooltip--below">
            <span className="tooltip__inner tooltip__inner--up">
              Share
            </span>
          </span>
        </span>
      );
    }
    const isReadOnly = props.acl.isReadOnly();
    return (
      <div className={this._generateClasses()}>
        <div className="model-actions__buttons">
          <span className="model-actions__export model-actions__button"
            onClick={this._handleExport.bind(this)}
            role="button"
            tabIndex="0">
            <SvgIcon name="export_16"
              className="model-actions__icon"
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
            <SvgIcon name="import_16"
              className="model-actions__icon"
              size="16" />
            <span className="tooltip__tooltip--below">
              <span className="tooltip__inner tooltip__inner--up">
                Import
              </span>
            </span>
          </span>
          {shareAction}
          <Terminal
            address={props.address}
            creds={props.creds} />
        </div>
        <input className="model-actions__file"
          type="file"
          onChange={isReadOnly ? null : this._handleImportFile.bind(this)}
          accept=".zip,.yaml,.yml"
          ref="file-input" />
      </div>
    );
  }
};

ModelActions.propTypes = {
  acl: PropTypes.object.isRequired,
  address: PropTypes.string,
  appState: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
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
