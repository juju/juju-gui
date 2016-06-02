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

YUI.add('inspector-relations-item', function() {

  juju.components.InspectorRelationsItem = React.createClass({
    propTypes: {
      whenChanged: React.PropTypes.func.isRequired
    },

    /**
      Generate the initial state for the component.

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
      Handle navigating to a relation details when it is clicked.

      @method _handleRelationClick
    */
    _handleRelationClick: function() {
      // Cast to string to pass state null check
      var index = this.props.index + '';
      this.props.changeState({
        sectionA: {
          component: 'inspector',
          metadata: {
            activeComponent: 'relation',
            unit: index
          }
        }
      });
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
        whenChanged(checked);
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
      Returns the id if the item is not a navigation element.

      @method _generateId
      @param {String} id The id of the checkbox.
      @returns {String} The id of the element or a blank string.
    */
    _generateId: function(id) {
      return this.props.relation ? '' : id;
    },

    /**
      Returns the action function if the item is a navigation element.

      @method _generateClick
      @returns {Function} The onClick action
    */
    _generateClick: function() {
      return this.props.relation ? this._handleRelationClick : null;
    },

    render: function() {
      var id = this.props.label + '-relation';
      var label = this.props.label;
      return (
        <li className="inspector-relations-item"
          onClick={this._generateClick()}
          tabIndex="0" role="button">
          <label htmlFor={this._generateId(id)}>
            <input
              type="checkbox"
              id={id}
              onClick={this._stopBubble}
              onChange={this._handleChange}
              checked={this.state.checked} />
            <span className="inspector-relations-item__label">
              {label}
            </span>
          </label>
        </li>
      );
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
