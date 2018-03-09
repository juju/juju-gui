/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

const enhanceWithClickOutside = require('../../init/react-click-outside');

class ModalShortcuts extends React.Component {

  handleClickOutside() {
    this.props.closeModal();
  }

  /**
  @return {Array} An array of the bindings to create ul.
  */
  _generateBindings() {
    let bindings = [];
    Object.keys(this.props.keybindings).forEach(key => {
      const binding = this.props.keybindings[key];
      if (binding.help && (binding.condition === undefined ||
        binding.condition.call(this) === true)) {
        bindings.push({
          key: key,
          label: binding.label || key,
          help: binding.help
        });
      }
    });

    return bindings;
  }

  /**
    Generate list of keybindings for help modal

    @return {Array} An array of React li elements.
  */
  _generateList() {
    const bindings = this._generateBindings();
    const components = bindings.map(binding => {
      return(
        <div key={binding.label}>
          <div className="two-col">
            {binding.label}
          </div>
          <div className="four-col last-col">
            {binding.help}
          </div>
        </div>);
    });
    return components;
  }

  render() {
    return (
      <div className="modal">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Keyboard Shortcuts</h2>
          <span className="close" onClick={this.props.closeModal} role="button"
            tabIndex="0">
            <SvgIcon name="close_16"
              size="16" />
          </span>
        </div>
        <div className="twelve-col">
          <div className="content">
            {this._generateList()}
          </div>
        </div>
        <div className="twelve-col">
          <div className="content">
            Juju GUI version {this.props.guiVersion}
          </div>
        </div>
      </div>
    );
  }
};

ModalShortcuts.propTypes = {
  closeModal: PropTypes.func.isRequired,
  guiVersion: PropTypes.string.isRequired,
  keybindings: PropTypes.object.isRequired
};

module.exports = enhanceWithClickOutside(ModalShortcuts);
