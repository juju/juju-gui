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
YUI.add('header-logo', function() {

  juju.components.HeaderLogo = React.createClass({

    propTypes: {
      gisf: React.PropTypes.bool.isRequired,
      homePath: React.PropTypes.string,
      showProfile: React.PropTypes.func
    },

    /**
      Calls the showProfile prop
      @param {Object} e The click event.
    */
    _showProfile: function(e) {
      if (this.props.gisf) {
        // If we're in gisf then we want to allow the href to
        // continue as normal
        return;
      }
      e.preventDefault();
      this.props.showProfile();
    },

    /**
      Returns the Juju logo SvgIcon component.
      @return {Object} The SvgIcon component of the Juju logo.
    */
    _svg: function() {
      return (<juju.components.SvgIcon name="juju-logo"
        className="svg-icon"
        width="90" height="35" />);
    },

    render: function() {
      return (
        <a href={this.props.homePath}
           onClick={this._showProfile}
           role="button"
           title="Home">
          {this._svg()}
        </a>);
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
