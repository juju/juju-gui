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

YUI.add('generic-button', function() {

  juju.components.GenericButton = React.createClass({

    /**
      Returns the classes for the button based on the provided props.
      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'generic-button',
        this.props.type ? 'generic-button--type-' + this.props.type : '',
        {
          'generic-button--disabled': this.props.disabled
        }
      );
    },

    /**
      Call the action if not disabled.

      @method _handleClick
    */
    _handleClick: function() {
      if (!this.props.disabled) {
        this.props.action();
      }
    },

    render: function() {
      return (
        <button className={this._generateClasses()}
          onClick={this._handleClick}>
          {this.props.title}
        </button>
      );
    }
  });

}, '0.1.0', { requires: []});
