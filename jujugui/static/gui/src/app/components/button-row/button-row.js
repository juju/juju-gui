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

YUI.add('button-row', function() {

  juju.components.ButtonRow = React.createClass({

    /**
      Returns the classes for the footer based on the provided props.
      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var classes = {};
      var buttonsLength = this.props.buttons.length;
      classes['button-row--multiple'] = buttonsLength > 0;
      classes['button-row--count-' + buttonsLength] = true;
      return classNames(
        'button-row',
        classes
      );
    },

    /**
      Creates the buttons based on the provided props.
      @method _generateButtons
      @param {Array} buttons The properties of the buttons to generate.
      @returns {Array} Collection of buttons.
    */
    _generateButtons: function(buttons) {
      var components = [];
      buttons.forEach((button) => {
        components.push(
          <juju.components.GenericButton
            key={button.title}
            title={button.title}
            action={button.action}
            disabled={button.disabled}
            submit={button.submit}
            type={button.type} />);
      });
      return components;
    },

    render: function() {
      var buttons = this._generateButtons(this.props.buttons);
      return (
        <div className={this._generateClasses()}>
          {buttons}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'generic-button'
]});
