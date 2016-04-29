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

YUI.add('confirmation-popup', function() {

  juju.components.ConfirmationPopup = React.createClass({
    propTypes: {
      buttons: React.PropTypes.array.isRequired,
      message: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired
    },

    render: function() {
      return (
        <juju.components.Panel
          instanceName="confirmation-popup"
          visible={true}>
          <div className="confirmation-popup__panel">
            <h3 className="confirmation-popup__title">
              {this.props.title}
            </h3>
            <p>{this.props.message}</p>
            <juju.components.ButtonRow
              buttons={this.props.buttons}
              key="buttons" />
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'button-row',
    'panel-component'
  ]
});
