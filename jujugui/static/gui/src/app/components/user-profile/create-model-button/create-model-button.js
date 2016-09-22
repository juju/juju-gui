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
      cloud: React.PropTypes.string,
      controllerAPI: React.PropTypes.object.isRequired,
      getCloudCredentialNames: React.PropTypes.func.isRequired,
      getCloudCredentials: React.PropTypes.func.isRequired,
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
      const name = modelName.getValue();
      const user = props.user.user;
      // XXX Jeff - Everything below here around creating models is only here
      // until the new deployment flow exists and we use the much better
      // written code for creating models with the proper credentials.
      // This is just a temporary fix for the 2.1.13 release. If you see this
      // after 2.2.0 it should probably be deleted.
      const notify = msg => {
        props.addNotification({
          title: 'Failed to create new model',
          message: msg,
          level: 'error'
        });
      };
      props.getCloudCredentialNames([[user, props.cloud]], (err, names) => {
        if (err) {
          notify(err);
          return;
        }
        const nameList = names.length && names[0].names || [];
        this.props.getCloudCredentials(nameList, (err, credentials) => {
          if (err) {
            notify(err);
            return;
          }
          const credentialList = Object.keys(credentials);
          if (!credentialList.length) {
            notify('No valid credentials found');
            return;
          }
          const attrs = {
            credential: credentialList[0],
            cloud: props.cloud
          };
          props.controllerAPI.createModel(name, user, attrs, (err, data) => {
            props.hideConnectingMask(false);
            if (err) {
              notify(err);
              return;
            }
            props.switchModel(data.uuid, data.name);
          });
        });
      });
    },

    /**
      Depending on if we're using the blues flag this will either switch to a
      disconnected model or open up the UI to allow the user to create a
      new model.
      @method _nextCreateStep
    */
    _nextCreateStep: function() {
      // XXX: When the blues flag is removed the ability to set a name should be
      // removed and it should always take you to the disconnected model state.
      if (window.flags && window.flags.blues) {
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
