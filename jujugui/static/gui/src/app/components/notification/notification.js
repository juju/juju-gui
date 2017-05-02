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

YUI.add('notification', function() {

  juju.components.Notification = React.createClass({

    propTypes: {
      content: React.PropTypes.object.isRequired,
      dismiss: React.PropTypes.func,
      extraClasses: React.PropTypes.string,
      // Types: positive, caution, negative
      type: React.PropTypes.string
    },

    /**
      Generate classes based on 'type' and extra classes.

      @return {string} The class string.
    */
    _generateClasses: function() {
      let classes = 'p-notification';
      if (this.props.type) {
        classes = `${classes}--${this.props.type}`;
      }
      if (this.props.extraClasses) {
        classes = `${classes} ${this.props.extraClasses}`;
      }
      return classes;
    },

    /**
      Generates the dismiss button if a dismiss function is provided.
      The parent is tasked with calling the correct dismiss functionality as
      it will be on a per use basis.

      @return {object} React Button node.
    */
    _generateDismiss: function() {
      if (this.props.dismiss) {
        return (
          <button
            className="p-notification__action"
            onClick={this.props.dismiss}>
              <window.juju.components.SvgIcon
              name="close_16" size="16" />
          </button>);
      }
      return;
    },

    render: function() {
      return (
        <div className={this._generateClasses()}>
          <p className="p-notification__response">
            {this.props.content}
            {this._generateDismiss()}
          </p>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
