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

YUI.add('create-model-button', function() {

  juju.components.CreateModelButton = React.createClass({
    propTypes: {
      switchModel: React.PropTypes.func.isRequired,
      title: React.PropTypes.string,
      type: React.PropTypes.string,
    },

    getDefaultProps: function() {
      return {
        type: 'inline-neutral',
        title: 'Create new'
      };
    },

    render: function() {
      return (
        <div className="user-profile__create-new">
          <juju.components.GenericButton
            action={this.props.switchModel}
            type={this.props.type}
            title={this.props.title} />
        </div>
      );
    },
  });

}, '', {
  requires: [
    'generic-button'
  ]
});
