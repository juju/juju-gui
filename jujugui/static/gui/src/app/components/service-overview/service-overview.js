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

YUI.add('service-overview', function() {

  juju.components.ServiceOverview = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      clearState: React.PropTypes.func.isRequired,
      destroyService: React.PropTypes.func.isRequired,
      getUnitStatusCounts: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired,
      serviceRelations: React.PropTypes.array.isRequired
    },

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        confirmationOpen: false
      };
    },

    /**
      Fires changeState to update the UI based on the component clicked.

      @method _navigate
      @param {Object} e The click event.
    */
    _navigate: function(e) {
      var title = e.currentTarget.getAttribute('title');
      var activeAction;
      this.state.actions.some((action) => {
        if (action.title === title) {
          activeAction = action;
          return true;
        }
      });
      this.props.changeState(activeAction.state);
    },

    /**
      Returns the actions for the overview view.
      @method _generateActionList
      @returns {Array} The array of overview action components.
    */
    _generateActionList: function(actions) {
      var items = [];
      actions.forEach(function(action) {
        items.push(
            <juju.components.OverviewAction
              key={action.title}
              icon={action.icon}
              action={action.action}
              title={action.title}
              value={action.value}
              valueType={action.valueType}
              linkAction={action.linkAction}
              linkTitle={action.linkTitle} />);
      });
      return items;
    },

    /**
      create the actions based on the provded service.
      @method _generateActions
      @param {Object} service The service object.
      @returns {Array} The array of actions.
    */
    _generateActions: function(service) {
      var serviceId = service.get('id');
      var actions = [];
      var units = service.get('units').toArray();
      var statusCounts = this.props.getUnitStatusCounts(units);
      statusCounts.all = {size: units.length};
      var statuses = [{
        title: 'Units',
        key: 'all',
        icon: 'units'
      }, {
        title: 'Errors',
        key: 'error'
      }, {
        title: 'Pending',
        key: 'pending'
      }, {
        title: 'Uncommitted',
        key: 'uncommitted'
      }];
      statuses.forEach(function(status) {
        var key = status.key;
        var count = statusCounts[key].size;
        if (count > 0 || key === 'all') {
          actions.push({
            title: status.title,
            icon: status.icon,
            value: count,
            valueType: key,
            action: this._navigate,
            state: {
              sectionA: {
                component: 'inspector',
                metadata: {
                  id: serviceId,
                  activeComponent: 'units',
                  unitStatus: key === 'all' ? null : key
                }
              }
            }
          });
        }
      }, this);

      actions.push({
        title: 'Configure',
        icon: 'configure',
        action: this._navigate,
        state: {
          sectionA: {
            component: 'inspector',
            metadata: {
              id: service.get('id'),
              activeComponent: 'config'
            }
          }
        }
      });
      actions.push({
        title: 'Relations',
        icon: 'relations',
        action: this._navigate,
        state: {
          sectionA: {
            component: 'inspector',
            metadata: {
              id: serviceId,
              activeComponent: 'relations'
            }
          }
        }
      });
      actions.push({
        title: 'Expose',
        value: service.get('exposed') ? 'On' : 'Off',
        icon: 'exposed_16',
        action: this._navigate,
        state: {
          sectionA: {
            component: 'inspector',
            metadata: {
              id: serviceId,
              activeComponent: 'expose'
            }
          }
        }
      });
      if (!service.get('pending')) {
        var charmId = service.get('charm');
        actions.push({
          title: 'Change version',
          linkAction: this._viewCharmDetails.bind(this, charmId),
          linkTitle: charmId,
          icon: 'change-version',
          action: this._navigate,
          state: {
            sectionA: {
              component: 'inspector',
              metadata: {
                id: serviceId,
                activeComponent: 'change-version'
              }
            }
          }
        });
      }

      this.state.actions = actions;
    },

    /**
      The callable to view the charm details.

      @method _viewCharmDetails
      @param {String} charmId The charm id.
      @param {Object} e The click event.
    */
    _viewCharmDetails: function(charmId, e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: charmId.replace('cs:', '')
          }
        }
      });
    },

    /**
      Set the confirmation state to open.
      @method _showConfirmation
    */
    _showConfirmation: function() {
      this.setState({confirmationOpen: true});
    },

    /**
      Set the confirmation state to closed.
      @method _hideConfirmation
    */
    _hideConfirmation: function() {
      this.setState({confirmationOpen: false});
    },

    /**
      Handle destroying the service from the button click.

      @method _destroyService
    */
    _destroyService: function() {
      this._hideConfirmation();
      // db, env, and service have already been bound to this function in
      // the app.js definition.
      this.props.destroyService();
      // Fire the clearState event to cancel relation building to destroyed
      // services.
      this.props.clearState();
      // Navigate back to the list of services now that this service has been
      // removed.
      this.props.changeState({
        sectionA: {
          component: 'applications'
        }});
    },

    render: function() {
      this._generateActions(this.props.service);
      var buttons = [{
        title: 'Destroy',
        action: this._showConfirmation
      }];
      var confirmMessage = 'Are you sure you want to destroy the application? '
        + 'This cannot be undone.';
      var confirmButtons = [{
        title: 'Cancel',
        action: this._hideConfirmation
      }, {
        title: 'Confirm',
        type: 'destructive',
        action: this._destroyService
      }];
      return (
        <div className="service-overview">
          <ul className="service-overview__actions">
            {this._generateActionList(this.state.actions)}
          </ul>
          <juju.components.ButtonRow
            buttons={buttons} />
          <juju.components.InspectorConfirm
            buttons={confirmButtons}
            message={confirmMessage}
            open={this.state.confirmationOpen} />
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'button-row',
  'inspector-confirm',
  'overview-action'
]});
