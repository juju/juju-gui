/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('date-display', function() {

  juju.components.DateDisplay = React.createClass({

    propTypes: {
      date: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.string
      ]),
      relative: React.PropTypes.bool
    },

    /**
      Get the current time. This is done in a method so that it can be
      overriden in tests.

      @method _getNow
      @returns {Object} The current date.
    */
    _getNow: function() {
      return new Date();
    },

    /**
      Get a date object from the supplied date.

      @method _getParsedDate
      @returns {Object} The parsed date.
    */
    _getParsedDate: function() {
      return new Date(Date.parse(this.props.date));
    },

    /**
      Generate the date.

      @method _generateDate
      @returns {String} The date.
    */
    _generateDate: function() {
      var date = this._getParsedDate();
      var year = date.getUTCFullYear();
      var month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
      var day = ('0' + date.getUTCDate()).slice(-2);
      return `${day}/${month}/${year}`;
    },

    /**
      Generate a relative date.

      @method _generateRelativeDate
      @returns {String} The relative date.
    */
    _generateRelativeDate: function() {
      // Get the diff in milliseconds.
      var date = this._getParsedDate();
      var diff = this._getNow().getTime() - date.getTime();
      var seconds = diff / 1000;
      var minutes = seconds / 60;
      var hours = minutes / 60;
      var days = hours / 24;
      var weeks = days / 7;
      // As this is just for a relative date display we can probably get away
      // with assuming a month has 30 days.
      var months = days / 30;
      var years = days / 365;
      var time;
      var unit;
      if (seconds < 60) {
        return 'just now';
      } else if (minutes < 60) {
        unit = 'minute';
        time = minutes;
      } else if (hours < 24) {
        unit = 'hour';
        time = hours;
      } else if (days < 7) {
        unit = 'day';
        time = days;
      } else if (months < 1) {
        unit = 'week';
        time = weeks;
      } else if (years < 1) {
        unit = 'month';
        time = months;
      } else if (years > 1) {
        return this._generateDate();
      }
      time = Math.floor(time);
      // Not using the pluralize util here so that it doesn't have to be passed
      // through every component.
      var plural = time === 1 ? '' : 's';
      return `${time} ${unit}${plural} ago`;
    },

    /**
      Generate the title when displaying a relative date.

      @method _generateTitle
      @returns {String} The title.
    */
    _generateTitle: function() {
      var date = this._getParsedDate();
      var hour = ('0' + date.getUTCHours()).slice(-2);
      var minute = ('0' + date.getUTCMinutes()).slice(-2);
      return `${this._generateDate()} ${hour}:${minute}`;
    },

    /**
      Generate the date or relative date.

      @method _generateContent
      @returns {String} The date or relative date.
    */
    _generateContent: function() {
      if (this.props.relative) {
        return this._generateRelativeDate();
      }
      return this._generateDate();
    },

    render: function() {
      return (
        <time datetime={this._generateDate()}
          title={this._generateTitle()}>
          {this._generateContent()}
        </time>
      );
    }

  });

}, '', {requires: []});
