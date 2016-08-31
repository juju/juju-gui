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
      addNotification: React.PropTypes.func.isRequired,
      className: React.PropTypes.string,
      controllerAPI: React.PropTypes.object.isRequired,
      hideConnectingMask: React.PropTypes.func.isRequired,
      showConnectingMask: React.PropTypes.func.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object
    },

    getInitialState: function() {
      return {
        createNewModelActive: false
      };
    },

    getDefaultProps: function() {
      return {
        className: ''
      };
    },

    /**
      Fetches the model name from the modelName ref and then creates a model
      then switches to it.
      @method createAndSwitch
      @param {Object} e The event handler from a form submission.
    */
    createAndSwitch: function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      // The supplied new model name needs to be valid.
      const modelName = this.refs.modelName;
      if (!modelName.validate()) {
        // Only continue if the validation passes.
        return;
      }
      const props = this.props;
      if (!props.controllerAPI) {
        // Only continue if we have a controller API.
        console.error('Controller API is not set.');
        return;
      }
      // Because this will automatically connect to the model lets show
      // the connecting mask right now.
      props.showConnectingMask();
      props.controllerAPI.createModel(
        modelName.getValue(),
        props.user.user,
        data => {
          const err = data.err;
          if (err) {
            props.addNotification({
              title: 'Failed to create new Model',
              message: err,
              level: 'error'
            });
            console.error(err);
            props.hideConnectingMask(false);
            return;
          }
          props.switchModel(data.uuid, data.name);
        });
    },

    /**
      Depending on the existance of jimm this will either switch to a
      disconnected model or open up the UI to allow the user to create a
      new model.
      @method _nextCreateStep
    */
    _nextCreateStep: function() {
      const controllerAPI = this.props.controllerAPI;
      if (controllerAPI && controllerAPI.get('jimmURL')) {
        // Switch to a disconnected model
        this.props.switchModel();
      } else {
        // Open up the UI to specify a model name for the Controller.
        this.setState({ createNewModelActive: true }, () => {
          const input = this.refs.modelName;
          if (input && input.refs.field) {
            input.refs.field.focus();
          }
        });
      }
    },

    /**
      Generates the elements required for the create new button
      @method _generateCreateNew
      @param {String} className The class you'd like to have applied to the
        container.
    */
    render: function() {
      const classes = classNames(
        'user-profile__create-new',
        this.props.className,
        {
          collapsed: !this.state.createNewModelActive
        });
      return (
        <div className={classes}>
          <form onSubmit={this.createAndSwitch}>
            <juju.components.GenericButton
              action={this._nextCreateStep}
              type="inline-neutral first"
              title="Create new" />
            <juju.components.GenericInput
              placeholder="untitled_model"
              required={true}
              ref="modelName"
              validate={[{
                regex: /\S+/,
                error: 'This field is required.'
              }, {
                regex: /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/,
                error: 'This field must only contain upper and lowercase ' +
                  'letters, numbers, and hyphens. It must not start or ' +
                  'end with a hyphen.'
              }]} />
            <juju.components.GenericButton
              action={this.createAndSwitch}
              type="inline-neutral second"
              title="Submit" />
          </form>
        </div>
      );
    },
  });

}, '', {
  requires: [
    'generic-button',
    'generic-input'
  ]
});
