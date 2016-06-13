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

YUI.add('inspector-confirm', function() {

  juju.components.InspectorConfirm = React.createClass({

    propTypes: {
      buttons: React.PropTypes.array.isRequired,
      message: React.PropTypes.string,
      open: React.PropTypes.bool,
    },

    /**
      Get the current state of the confirmation.
      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        open: this.props.open
      };
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({open: nextProps.open});
    },

    /**
      Returns the classes for the confirmation based on the provided props.
      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'inspector-confirm',
        this.props.open ? 'inspector-confirm--open' : ''
      );
    },

    /**
      Returns the classes for the message which will be hidden if there is
      no message.
      @method _messageClasses
      @returns {String} The collection of class names.
    */
    _messageClasses: function() {
      return classNames(
        'inspector-confirm__message',
        {
          hidden: !this.props.message
        }
      );
    },

    render: function() {
      return (
        <div className={this._generateClasses()}>
          <p className={this._messageClasses()}>
            {this.props.message}
          </p>
          <juju.components.ButtonRow
            buttons={this.props.buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row'
]});
