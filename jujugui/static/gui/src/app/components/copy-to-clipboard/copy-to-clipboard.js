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

YUI.add('copy-to-clipboard', function() {

  juju.components.CopyToClipboard = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      value: React.PropTypes.string,
    },

    getDefaultProps: function() {
      return {
        value: ''
      }
    },

    render: function() {
      return (
        <div className="copy-to-clipboard">
          <input className="copy-to-clipboard__input"
                 readOnly="true"
                 value={this.props.value}/>
          <button className="copy-to-clipboard__btn"
                  data-clipboard-target=".copy-to-clipboard__input">
            <img src="assets/clippy.svg" alt="Copy to clipboard"/>
          </button>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
