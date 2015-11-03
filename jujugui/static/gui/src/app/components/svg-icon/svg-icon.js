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

YUI.add('svg-icon', function() {

  juju.components.SvgIcon = React.createClass({

    /**
      Generates the classes for the icon based on the supplied props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var className = this.props.className;
      return classNames(
        'svg-icon',
        className ? className : ''
      );
    },

    /**
      Generates the styles for the icon based on the supplied props.

      @method _generateStyles
      @returns {Object} The object of styles.
    */
    _generateStyles: function() {
      var size = this.props.size;
      var width = this.props.width ? this.props.width : size;
      var height = this.props.height ? this.props.height : size;
      return {
        width: width + 'px',
        height: height + 'px'
      };
    },

    /**
      Generates the viewbox for the icon based on the supplied props.

      @method _generateViewbox
      @returns {String} The viewbox.
    */
    _generateViewbox: function() {
      var size = this.props.size;
      var width = this.props.width ? this.props.width : size;
      var height = this.props.height ? this.props.height : size;
      return '0 0 ' + width + ' ' + height;
    },

    render: function() {
      return (
        <svg className={this._generateClasses()} viewBox={this._generateViewbox()}
          style={this._generateStyles()}>
          <use xlinkHref={'#' + this.props.name} />
        </svg>
      );
    }

  });

}, '0.1.0', { requires: []});
