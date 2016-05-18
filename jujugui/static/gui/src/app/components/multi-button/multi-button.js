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

YUI.add('multi-button', function() {

  var MultiButton = React.createClass({
    propTypes: {
      action: React.PropTypes.func.isRequired,
      defaultValue: React.PropTypes.any.isRequired,
      label: React.PropTypes.string.isRequired,
      options: React.PropTypes.array.isRequired,
      type: React.PropTypes.string.isRequired
    },

    /**
      Generate the initial state of the component.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {showList: false};
    },

    /**
      Close the switcher when there is a click outside of the component.
      Called by the component wrapper.

      @method handleClickOutside
      @param {Object} e The click event
    */
    handleClickOutside: function(e) {
      this.setState({showList: false});
    },

    /**
      Generate the list of options.

      @method _generateList
    */
    _generateList: function() {
      if (!this.state.showList) {
        return;
      }
      var items = [];
      this.props.options.forEach((option, i) => {
        items.push(
          <li className="multi-button__list-item"
            key={option.value + i}
            onClick={this.props.action.bind(null, option.value)}
            role="button"
            tabIndex="0">
            {option.label}
          </li>);
      });
      return (
        <ul className="multi-button__list">
          {items}
        </ul>);
    },

    /**
      toggle the visibility of the list.

      @method _toggleList
    */
    _toggleList: function() {
      this.setState({showList: !this.state.showList});
    },

    render: function() {
      return (
        <div className="multi-button">
          <juju.components.GenericButton
            action={this.props.action.bind(null, this.props.defaultValue)}
            type={this.props.type}
            title={this.props.label} />
          <juju.components.GenericButton
            action={this._toggleList}
            icon="chevron_down_white_16"
            type={this.props.type} />
          {this._generateList()}
        </div>
      );
    }
  });

  juju.components.MultiButton = enhanceWithClickOutside(MultiButton);

}, '0.1.0', { requires: [
  'generic-button',
  'svg-icon'
]});
