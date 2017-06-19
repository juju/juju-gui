/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

const ModalGUISettings = React.createClass({
  displayName: 'ModalGUISettings',

  propTypes: {
    closeModal: React.PropTypes.func.isRequired,
    localStorage: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
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
    return state;
  },

  /**
    Update the state when an input is changed.

    @param {Object} evt the change event.
  */
  handleChange: function(evt) {
    const target = evt.target;
    const value = target.checked;
    const name = target.name;
    this.setState({
      [name]: value
    });
  },

  /**
    When the save button is pressed, commit to localStorage.
  */
  handleSave: function() {
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
  },

  render: function() {
    return (
      <div className="modal modal--narrow">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Custom GUI Settings</h2>
          <span className="close" tabIndex="0" role="button"
            onClick={this.props.closeModal}>
            <juju.components.SvgIcon name="close_16"
              size="16" />
          </span>
        </div>
        <div className="content">
          <p>
            <label htmlFor="disable-cookie">
              <input type="checkbox" name="disable-cookie"
                id="disable-cookie"
                onChange={this.handleChange}
                defaultChecked={this.state['disable-cookie']} />&nbsp;
                Disable the EU cookie warning.
            </label>
          </p>
          <p>
            <label htmlFor="force-containers">
              <input type="checkbox" name="force-containers"
                id="force-containers"
                onChange={this.handleChange}
                defaultChecked={this.state['force-containers']} />&nbsp;
                Enable container control for this provider.
            </label>
          </p>
          <p>
            <label htmlFor="disable-auto-place">
              <input type="checkbox" name="disable-auto-place"
                id="disable-auto-place"
                onChange={this.handleChange}
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
            name="save-settings" onClick={this.handleSave}
            id="save-settings" value="Save"/>
        </div>
      </div>
    );
  }
});

YUI.add('modal-gui-settings', function() {
  juju.components.ModalGUISettings = ModalGUISettings;
}, '0.1.0', { requires: [
  'svg-icon'
]});
