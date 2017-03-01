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
    propTypes: {
      action: React.PropTypes.func,
      children: React.PropTypes.node,
      disabled: React.PropTypes.bool,
      extraClasses: React.PropTypes.string,
      icon: React.PropTypes.string,
      submit: React.PropTypes.bool,
      title: React.PropTypes.string,
      tooltip: React.PropTypes.string,
      type: React.PropTypes.string
    },

    /**
      Returns the classes for the button based on the provided props.
      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        this.props.type ? 'button--' + this.props.type : 'button--neutral',
        {
          'button--disabled': this.props.disabled
        },
        this.props.extraClasses
      );
    },

    /**
      Call the action if not disabled.

      @method _handleClick
      @param {Object} e The click event.
    */
    _handleClick: function(e) {
      // Don't bubble the click the parent.
      e.stopPropagation();
      // If submit is true then typically no action is provided because it
      // is submitting a form.
      if (!this.props.disabled && this.props.action) {
        this.props.action();
      }
      if (this.props.disabled && this.props.submit) {
        e.preventDefault();
      }
    },

    /**
      Generate the label or icon.

      @method _generateContent
    */
    _generateContent: function() {
      // If children are present, the title and icon props are ignored.
      if (this.props.children) {
        return this.props.children;
      } else {
        var title = this.props.title;
        var icon = this.props.icon;
        if (title) {
          return title;
        } else if (icon) {
          return (
            <juju.components.SvgIcon name={icon}
              size="16" />);
        }
      }
    },

    render: function() {
      return (
        <button className={this._generateClasses()}
          title={this.props.tooltip}
          onClick={this._handleClick}
          type={this.props.submit ? 'submit' : 'button'}>
          {this._generateContent()}
        </button>
      );
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
