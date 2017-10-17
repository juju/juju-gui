/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class DateDisplay extends React.Component {
  constructor() {
    super();
    this.timer = null;
  }

  componentDidMount() {
    if (this.props.relative) {
      this._startTimer();
    }
  }

  componentDidUpdate() {
    this._stopTimer();
    if (this.props.relative) {
      this._startTimer();
    }
  }

  componentWillUnmount() {
    this._stopTimer();
  }

  /**
    Rerender the component so that the relative dates update.

    @method _rerender
  */
  _rerender() {
    // Force the component to rerender even though the props or state haven't
    // been updated. This will make the component recalculate the relative
    // times.
    this.forceUpdate();
  }

  /**
    Start the update timer.

    @method _startTimer
  */
  _startTimer() {
    // Rerender relative times every minute.
    this.timer = setInterval(this._rerender.bind(this), 60000);
  }

  /**
    Stop the update timer.

    @method _stopTimer
  */
  _stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
    Get the current time. This is done in a method so that it can be
    overriden in tests.

    @method _getNow
    @returns {Object} The current date.
  */
  _getNow() {
    return new Date();
  }

  /**
    Get a date object from the supplied date.

    @method _getParsedDate
    @returns {Object} The parsed date.
  */
  _getParsedDate() {
    return new Date(Date.parse(this.props.date));
  }

  /**
    Generate the date.

    @method _generateDate
    @returns {String} The date.
  */
  _generateDate() {
    var date = this._getParsedDate();
    var year = date.getUTCFullYear();
    var month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    var day = ('0' + date.getUTCDate()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  /**
    Generate a relative date.

    @method _generateRelativeDate
    @returns {String} The relative date.
  */
  _generateRelativeDate() {
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
  }

  /**
    Generate the title when displaying a relative date.

    @method _generateTitle
    @returns {String} The title.
  */
  _generateTitle() {
    var date = this._getParsedDate();
    var hour = ('0' + date.getUTCHours()).slice(-2);
    var minute = ('0' + date.getUTCMinutes()).slice(-2);
    return `${this._generateDate()} ${hour}:${minute}`;
  }

  /**
    Generate the date or relative date.

    @method _generateContent
    @returns {String} The date or relative date.
  */
  _generateContent() {
    if (this.props.relative) {
      return this._generateRelativeDate();
    }
    return this._generateDate();
  }

  render() {
    // Validate that the string passed in is actually a date; if it isn't,
    // just return it without any date-parsing fun.
    if (!isNaN(Date.parse(this.props.date))) {
      return (
        <time dateTime={this._generateDate()}
          title={this._generateTitle()}>
          {this._generateContent()}
        </time>
      );
    } else {
      return (
        <span>{this.props.date}</span>
      );
    }
  }
};

DateDisplay.propTypes = {
  date: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  relative: PropTypes.bool
};

module.exports = DateDisplay;
