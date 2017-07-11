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
      <juju.components.SvgIcon
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
  gisf: React.PropTypes.bool.isRequired,
  homePath: React.PropTypes.string,
  showProfile: React.PropTypes.func
};

YUI.add('header-logo', function() {
  juju.components.HeaderLogo = HeaderLogo;
}, '0.1.0', { requires: [
  'svg-icon'
]});
