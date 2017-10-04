/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

/**
  We want the header logo to be a component as we may need to change what
  happens when it's clicked.
*/
class HeaderLogo extends React.Component {
  /**
    Calls the showProfile prop
    @param {Object} e The click event.
  */
  _showProfile(e) {
    if (this.props.gisf) {
      // If we're in gisf then we want to allow the href to
      // continue as normal
      return;
    }
    e.preventDefault();
    this.props.showProfile();
  }

  /**
    Returns the Juju logo SvgIcon component.
    @return {Object} The SvgIcon component of the Juju logo.
  */
  _svg() {
    return (
      <SvgIcon
        className="svg-icon"
        height="35"
        name="juju-logo"
        width="90" />);
  }

  render() {
    return (
      <a href={this.props.homePath}
        onClick={this._showProfile.bind(this)}
        role="button"
        title="Home">
        {this._svg()}
      </a>);
  }
};

HeaderLogo.propTypes = {
  gisf: PropTypes.bool.isRequired,
  homePath: PropTypes.string,
  showProfile: PropTypes.func
};

module.exports = HeaderLogo;
