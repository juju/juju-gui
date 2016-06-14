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

YUI.add('check-list-item', function() {

  juju.components.CheckListItem = React.createClass({

    propTypes: {
      action: React.PropTypes.func,
      aside: React.PropTypes.string,
      className: React.PropTypes.string,
      id: React.PropTypes.string,
      label: React.PropTypes.string.isRequired,
      whenChanged: React.PropTypes.func.isRequired
    },

    /**
      Returns the classes for the item based on the provided props.

      @method _valueClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var className = this.props.className;
      return classNames(
        'check-list-item',
        className ? 'check-list-item--' + className : '',
        {'check-list-item--nav': this.props.action}
      );
    },

    /**
      Returns the id if the item is not a navigation element.

      @method _valueClasses
      @param {String} id The id of the checkbox.
      @returns {String} The id of the element or a blank string.
    */
    _generateId: function(id) {
      return this.props.action ? '' : id;
    },

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        checked: false
      };
    },

    /**
      Handles the checkbox change action by either calling the parent supplied
      whenChanged method and by setting the local checked state.

      @method _handleChange
      @param {Object} The change event from the checkbox.
    */
    _handleChange: function(e) {
      var whenChanged = this.props.whenChanged;
      var checked = e.currentTarget.checked;
      this.setState({checked: checked}, () => {
        // When whenChanged is set by the list parent and is used to (de)select
        // all checkboxes. It is called in the setState callback so that the
        // updated state is available if we inspect it from whenChanged.
        if (whenChanged) {
          whenChanged(checked);
        }
      });
    },

    /**
      Don't bubble the click event to the parent.

      @method _stopBubble
      @param {Object} The click event from the checkbox.
    */
    _stopBubble: function(e) {
      e.stopPropagation();
    },

    /**
      Display the aside if it is available.

      @method _generateAside
    */
    _generateAside: function() {
      var aside = this.props.aside;
      if (aside) {
        return (
          <span className="check-list-item__aside">
            {aside}
          </span>);
      }
    },

    render: function() {
      var id = this.props.label + '-item';
      return (
        <li className={this._generateClasses()}
          data-id={this.props.id}
          onClick={this.props.action} tabIndex="0" role="button">
          <label htmlFor={this._generateId(id)}>
            <input
              type="checkbox"
              id={id}
              onClick={this._stopBubble}
              onChange={this._handleChange}
              checked={this.state.checked} />
            <span className="check-list-item__label">
              {this.props.label}
            </span>
            {this._generateAside()}
          </label>
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
