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
/*
  This component can be used to add in-page links to ids e.g. it could be used
  within a readme heading to link to .../#readme.
 */
class HashLink extends React.Component {
  /**
    Update the hash state.
  */
  _handleClick() {
    this.props.changeState({hash: this.props.hash});
  }

  render() {
    return (
      <div className="hash-link"
        onClick={this._handleClick.bind(this)}>
        <juju.components.SvgIcon
          name="anchor_16"
          size="16" />
      </div>
    );
  }
};

HashLink.propTypes = {
  changeState: React.PropTypes.func.isRequired,
  hash: React.PropTypes.string.isRequired
};

YUI.add('hash-link', function() {
  juju.components.HashLink = HashLink;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
