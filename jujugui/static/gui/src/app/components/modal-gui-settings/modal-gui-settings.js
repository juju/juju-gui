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

YUI.add('modal-gui-settings', function() {

  juju.components.ModalGUISettings = React.createClass({

    propTypes: {
      disableAutoPlace: React.PropTypes.bool,
      disableCookie: React.PropTypes.bool,
      forceContainers: React.PropTypes.bool,
      localStorage: React.PropTypes.object.required
    },

    getInitialState: function() {
      let state = {
        visible: false
      };
      state['disable-cookie'] = this.props.disableCookie;
      state['disable-auto-place'] = this.props.disableAutoPlace;
      state['force-containers'] = this.props.forceContainers;
      return state;
    },

    /**
      Makes the modal visible.
    */
    show: function() {
      this.setState({
        visible: true
      });
    },

    /**
      Makes the modal invisble, like a spy.
    */
    hide: function() {
      this.setState({
        visible: false
      });
    },

    /**
      If it's visible, make it invisible. If it's invisible, make it visible.
    */
    toggle: function() {
      this.setState({
        visible: !this.state.visible
      });
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
      Object.keys(this.state).forEach(function (key) {
        if (key !== 'visible') {
          if (this.state[key] === true) {
            this.props.localStorage.setItem(key, true);
          } else {
            this.props.localStorage.removeItem(key);
          }
        }
      }.bind(this));
    },

    render: function() {
      if (!this.state.visible) {
        return (<div id="#shortcut-settings"></div>);
      }
      return (
        <div id="#shortcut-settings">
          <div className="twelve-col no-margin-bottom">
            <h2 className="bordered">Custom GUI Settings</h2>
            <span className="close" tabIndex="0" role="button"
              onClick={this.hide}>
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

}, '0.1.0', { requires: [
  'svg-icon'
]});
