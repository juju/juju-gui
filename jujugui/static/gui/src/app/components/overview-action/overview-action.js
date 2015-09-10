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

YUI.add('overview-action', function() {

  juju.components.OverviewAction = React.createClass({

    /**
      Returns the supplied classes with the 'hidden' class applied if the
      value is falsey.
      @method _valueClasses
      @returns {String} The collection of class names.
    */
    _valueClasses: function() {
      return classNames(
        'overview-action__value',
        this.props.valueType ?
            'overview-action__value--type-' + this.props.valueType : '',
        {
          hidden: !this.props.value
        }
      );
    },

    /**
      Returns the supplied classes with the 'hidden' class applied if the
      value is falsey.
      @method _linkClasses
      @returns {String} The collection of class names.
    */
    _linkClasses: function() {
      return classNames(
        'overview-action__link',
        {
          hidden: !this.props.link
        }
      );
    },

    render: function() {
      return (
        <li className="overview-action"
          onClick={this.props.callback} tabIndex="0" role="button">
          <span dangerouslySetInnerHTML={{__html: this.props.icon}}
            className="overview-action__icon" />
          <span className="overview-action__title">
            {this.props.title}
          </span>
          <a href={this.props.link} className={this._linkClasses()}
            target="_blank">
            {this.props.linkTitle}
          </a>
          <span className={this._valueClasses()}>
            {this.props.value}
          </span>
        </li>
      );
    }

  });

}, '0.1.0', { requires: []});
