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
      action: React.PropTypes.func,
      changeState: React.PropTypes.func.isRequired,
      disabled: React.PropTypes.bool,
      switchModel: React.PropTypes.func.isRequired,
      title: React.PropTypes.string,
      type: React.PropTypes.string
    },

    getDefaultProps: function() {
      return {
        type: 'inline-neutral',
        title: 'Create new'
      };
    },

    _createNewModel: function() {
      const props = this.props;
      if (props.disabled) {
        return;
      }
      // We want to explicitly close the profile when switching to a new
      // model to resolve a race condition with the new model setup.
      props.changeState({profile: null});
      props.switchModel(null);
      if (this.props.action) {
        this.props.action();
      }
    },

    render: function() {
      const disabled = this.props.disabled || false;
      return (
        <div className="create-new-model">
          <juju.components.GenericButton
            action={this._createNewModel}
            disabled={disabled}
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
