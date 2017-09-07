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

class CreateModelButton extends React.Component {
  _createNewModel() {
    const props = this.props;
    if (props.disabled) {
      return;
    }
    // We want to explicitly close the profile when switching to a new
    // model to resolve a race condition with the new model setup.
    props.changeState({
      profile: null,
      hash: null
    });
    props.switchModel(null);
    if (this.props.action) {
      this.props.action();
    }
    // Clear the post deployment screen.
    this.props.clearPostDeployment();
  }

  render() {
    const disabled = this.props.disabled || false;
    return (
      <div className="create-new-model">
        <juju.components.GenericButton
          action={this._createNewModel.bind(this)}
          disabled={disabled}
          type={this.props.type}>
          {this.props.title}
        </juju.components.GenericButton>
      </div>
    );
  }
};

CreateModelButton.propTypes = {
  action: PropTypes.func,
  changeState: PropTypes.func.isRequired,
  clearPostDeployment: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  switchModel: PropTypes.func.isRequired,
  title: PropTypes.string,
  type: PropTypes.string
};

CreateModelButton.defaultProps = {
  type: 'inline-neutral',
  title: 'Create new'
};

YUI.add('create-model-button', function() {
  juju.components.CreateModelButton = CreateModelButton;
}, '', {
  requires: [
    'generic-button'
  ]
});
