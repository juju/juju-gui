/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

class ModalGUISettings extends React.Component {
  constructor(props) {
    super(props);
    let state = {};
    const localStorage = this.props.localStorage;
    // We have to check for the 'true' string. Because localStorage is all
    // about the strings.
    state['disable-cookie'] = localStorage.
      getItem('disable-cookie') === 'true';
    state['disable-auto-place'] = localStorage.
      getItem('disable-auto-place') === 'true';
    state['force-containers'] = localStorage.
      getItem('force-containers') === 'true';
    this.state = state;
  }

  /**
    Update the state when an input is changed.

    @param {Object} evt the change event.
  */
  _handleChange(evt) {
    const target = evt.target;
    const value = target.checked;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  /**
    When the save button is pressed, commit to localStorage.
  */
  _handleSave() {
    Object.keys(this.state).forEach(key => {
      if (key !== 'visible') {
        if (this.state[key] === true) {
          this.props.localStorage.setItem(key, true);
        } else {
          this.props.localStorage.removeItem(key);
        }
      }
    });

    this.props.closeModal();
  }

  render() {
    return (
      <div className="modal modal--narrow">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
          <span className="close" tabIndex="0" role="button"
            onClick={this.props.closeModal}>
            <SvgIcon name="close_16"
              size="16" />
          </span>
        </div>
        <div className="content">
          <p>
            <label htmlFor="disable-cookie">
              <input type="checkbox" name="disable-cookie"
                id="disable-cookie"
                onChange={this._handleChange.bind(this)}
                defaultChecked={this.state['disable-cookie']} />&nbsp;
                Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input type="checkbox" name="force-containers"
                id="force-containers"
                onChange={this._handleChange.bind(this)}
                defaultChecked={this.state['force-containers']} />&nbsp;
                Enable container control for this provider.
            </label>
          </p>
          <p>
            <label htmlFor="disable-auto-place">
              <input type="checkbox" name="disable-auto-place"
                id="disable-auto-place"
                onChange={this._handleChange.bind(this)}
                defaultChecked={this.state['disable-auto-place']} />&nbsp;
                Default to not automatically place units on commit.
            </label>
          </p>
          <p>
            <small>
              NOTE: You will need to reload for changes to take effect.
            </small>
          </p>
          <input type="button" className="button--positive"
            name="save-settings" onClick={this._handleSave.bind(this)}
            id="save-settings" value="Save"/>
        </div>
      </div>
    );
  }
};

ModalGUISettings.propTypes = {
  closeModal: PropTypes.func.isRequired,
  localStorage: PropTypes.object.isRequired
};

module.exports = ModalGUISettings;
