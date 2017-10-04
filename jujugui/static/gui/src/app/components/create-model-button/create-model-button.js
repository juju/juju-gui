/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');

class CreateModelButton extends React.Component {
  _createNewModel() {
    const props = this.props;
    if (props.disabled) {
      return;
    }
    // We want to explicitly close the profile when switching to a new
    // model to resolve a race condition with the new model setup.
    props.changeState({
      profile: null,
      hash: null,
      postDeploymentPanel: null
    });
    props.switchModel(null);
    if (this.props.action) {
      this.props.action();
    }
  }

  render() {
    const disabled = this.props.disabled || false;
    return (
      <div className="create-new-model">
        <GenericButton
          action={this._createNewModel.bind(this)}
          disabled={disabled}
          type={this.props.type}>
          {this.props.title}
        </GenericButton>
      </div>
    );
  }
};

CreateModelButton.propTypes = {
  action: PropTypes.func,
  changeState: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  switchModel: PropTypes.func.isRequired,
  title: PropTypes.string,
  type: PropTypes.string
};

CreateModelButton.defaultProps = {
  type: 'inline-neutral',
  title: 'Create new'
};

module.exports = CreateModelButton;
