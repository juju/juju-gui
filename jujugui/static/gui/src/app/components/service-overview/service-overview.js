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
    icons: {
      all: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16px" height="16px" viewBox="0 0 16 16"><path fillrule="evenodd" class="inspector-list__list-item-image" d="M 14.83 16C 14.83 16 10.17 16 10.17 16 9.53 16 9 15.47 9 14.83 9 14.83 9 10.17 9 10.17 9 9.53 9.53 9 10.17 9 10.17 9 14.83 9 14.83 9 15.47 9 16 9.53 16 10.17 16 10.17 16 14.83 16 14.83 16 15.47 15.47 16 14.83 16ZM 15 10.17C 15 10.07 14.93 10 14.83 10 14.83 10 10.17 10 10.17 10 10.07 10 10 10.07 10 10.17 10 10.17 10 14.83 10 14.83 10 14.93 10.07 15 10.17 15 10.17 15 14.83 15 14.83 15 14.93 15 15 14.93 15 14.83 15 14.83 15 10.17 15 10.17ZM 14.83 7C 14.83 7 10.17 7 10.17 7 9.53 7 9 6.47 9 5.83 9 5.83 9 1.17 9 1.17 9 0.53 9.53 0 10.17 0 10.17 0 14.83 0 14.83 0 15.47 0 16 0.53 16 1.17 16 1.17 16 5.83 16 5.83 16 6.47 15.47 7 14.83 7ZM 15 1.17C 15 1.07 14.93 1 14.83 1 14.83 1 10.17 1 10.17 1 10.07 1 10 1.07 10 1.17 10 1.17 10 5.83 10 5.83 10 5.93 10.07 6 10.17 6 10.17 6 14.83 6 14.83 6 14.93 6 15 5.93 15 5.83 15 5.83 15 1.17 15 1.17ZM 5.83 16C 5.83 16 1.17 16 1.17 16 0.53 16 0 15.47 0 14.83 0 14.83 0 10.17 0 10.17 0 9.53 0.53 9 1.17 9 1.17 9 5.83 9 5.83 9 6.47 9 7 9.53 7 10.17 7 10.17 7 14.83 7 14.83 7 15.47 6.47 16 5.83 16ZM 6 10.17C 6 10.07 5.93 10 5.83 10 5.83 10 1.17 10 1.17 10 1.07 10 1 10.07 1 10.17 1 10.17 1 14.83 1 14.83 1 14.93 1.07 15 1.17 15 1.17 15 5.83 15 5.83 15 5.93 15 6 14.93 6 14.83 6 14.83 6 10.17 6 10.17Z" fill="rgb(147,161,161)"></path></svg>', // eslint-disable-line max-len
      configure: '<svg width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"><path class="inspector-list__list-item-image" d="M1.42,8.28 L0,8.03 L0.44,5.43 L1.87,5.69 C1.99,5.39 2.12,5.09 2.29,4.8 C2.45,4.52 2.64,4.25 2.84,4 L1.92,2.9 L3.92,1.19 L3.92,1.19 L4.86,2.31 C5.43,2 6.04,1.78 6.68,1.65 L6.68,0.39 L9.31,0 L9.31,1.66 C9.94,1.79 10.55,2.01 11.12,2.32 L12.05,1.21 L14.08,2.89 L14.08,2.89 L13.14,4.01 C13.55,4.52 13.87,5.09 14.11,5.69 L15.53,5.44 L16,8.03 L16,8.03 L14.57,8.28 C14.56,8.93 14.45,9.57 14.24,10.2 L15.48,10.91 L14.18,13.21 L14.17,13.21 L12.91,12.48 C12.48,12.97 11.98,13.39 11.43,13.73 L11.92,15.08 L9.46,16 L8.96,14.63 C8.64,14.68 8.32,14.71 8,14.71 C7.67,14.71 7.35,14.68 7.02,14.63 L6.53,15.98 L4.05,15.09 L4.55,13.72 C3.99,13.37 3.49,12.95 3.07,12.48 L1.82,13.2 L0.49,10.92 L1.76,10.19 C1.55,9.58 1.44,8.93 1.42,8.28 L1.42,8.28 Z M5.83,11.86 C6.49,12.24 7.24,12.45 8,12.45 C9.54,12.45 10.98,11.62 11.74,10.28 C12.94,8.21 12.22,5.55 10.15,4.35 C9.49,3.97 8.74,3.77 7.99,3.77 C6.44,3.77 5.01,4.6 4.24,5.93 C3.05,8 3.76,10.66 5.83,11.86 L5.83,11.86 Z" id="Shape" fill="#93A1A1" sketch:type="MSShapeGroup"></path></g></svg>',  // eslint-disable-line max-len
      relations: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16px" height="16px" viewBox="0 0 16 16"><path fillrule="evenodd" class="inspector-list__list-item-image" d="M 14.83 0C 14.83 0 12.17 0 12.17 0 11.53 0 11 0.53 11 1.17 11 1.17 11 3.83 11 3.83 11 3.97 11.04 4.09 11.08 4.21 11.08 4.21 9.01 6.29 9.01 6.29 8.71 6.11 8.37 6 8 6 6.9 6 6 6.9 6 8 6 8.37 6.11 8.71 6.29 9.01 6.29 9.01 4.21 11.08 4.21 11.08 4.09 11.04 3.97 11 3.83 11 3.83 11 1.17 11 1.17 11 0.53 11 0 11.53 0 12.17 0 12.17 0 14.83 0 14.83 0 15.47 0.53 16 1.17 16 1.17 16 3.83 16 3.83 16 4.47 16 5 15.47 5 14.83 5 14.83 5 12.17 5 12.17 5 12.03 4.97 11.91 4.92 11.79 4.92 11.79 6.99 9.72 6.99 9.72 7.29 9.89 7.63 10 8 10 9.1 10 10 9.1 10 8 10 7.63 9.89 7.29 9.71 6.99 9.71 6.99 11.79 4.92 11.79 4.92 11.91 4.97 12.03 5 12.17 5 12.17 5 14.83 5 14.83 5 15.47 5 16 4.47 16 3.83 16 3.83 16 1.17 16 1.17 16 0.53 15.47 0 14.83 0ZM 4 14.83C 4 14.93 3.93 15 3.83 15 3.83 15 1.17 15 1.17 15 1.07 15 1 14.93 1 14.83 1 14.83 1 12.17 1 12.17 1 12.07 1.07 12 1.17 12 1.17 12 3.83 12 3.83 12 3.93 12 4 12.07 4 12.17 4 12.17 4 14.83 4 14.83ZM 15 3.83C 15 3.93 14.93 4 14.83 4 14.83 4 12.17 4 12.17 4 12.07 4 12 3.93 12 3.83 12 3.83 12 1.17 12 1.17 12 1.07 12.07 1 12.17 1 12.17 1 14.83 1 14.83 1 14.93 1 15 1.07 15 1.17 15 1.17 15 3.83 15 3.83Z" fill="rgb(147,161,161)"></path></svg>',  // eslint-disable-line max-len
      actions: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#93A1A1" class="inspector-list__list-item-image"></circle></svg>',  // eslint-disable-line max-len
      expose: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#93A1A1" class="inspector-list__list-item-image"></circle></svg>',  // eslint-disable-line max-len
      version: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="13" viewBox="0 0 16 13"><path d="M15.07 11.48l-1-.86c-1.11 1.48-2.84 2.33-4.65 2.33-.5 0-1-.06-1.5-.2-2.54-.68-4.31-3.01-4.31-5.66H5.7c0 1.7 1.13 3.19 2.76 3.63 1.52.41 3.11-.2 4-1.47l-1-.86s2.2-1.09 4.53-1.68H16c-.24 2.53-.93 4.77-.93 4.77zm-7.5-8.87c-1.5-.41-3.08.17-3.98 1.41l1.05.9S2.4 6.04 0 6.65v-.01c.25-2.59.95-4.88.95-4.88l1.05.9C3.42.82 5.83-.03 8.11.58c2.55.69 4.33 3.02 4.33 5.68h-2.08c0-1.71-1.15-3.21-2.79-3.65z" fill="#93A1A1" class="inspector-list__list-item-image"></path></svg>' // eslint-disable-line max-len
    },

    /**
      Get the current state of the inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return {
        confirmationOpen: this.props.confirmationOpen
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
              link={action.link}
              linkTitle={action.linkTitle} />);
      });
      return items;
    },

      /**
        Parses the supplied unit data to return the status number.

        @method _parseStatusData
        @param {Array} units An array of units.
      */
      _parseStatusData: function(units) {
        var unitStatuses = {
          all: units.length,
          uncommitted: 0,
          pending: 0,
          error: 0,
        };
        var agentState;
        units.forEach(function(unit) {
          agentState = unit.agent_state || 'uncommitted';
          // Show started units as uncommitted.
          if (agentState === 'started') {
            agentState = 'uncommitted';
          }
          unitStatuses[agentState] += 1;
        });
        return unitStatuses;
      },

    /**
      create the actions based on the provded service.
      @method _generateActions
      @param {Object} service The service object.
      @returns {Array} The array of actions.
    */
    _generateActions: function(service) {
      var unitStatuses = this._parseStatusData(service.get('units').toArray());
      var actions = [{
        title: 'Units',
        value: unitStatuses.all,
        icon: this.icons.all,
        action: this._navigate,
        state: {
          sectionA: {
            component: 'inspector',
            metadata: {
              id: service.get('id'),
              activeComponent: 'units'
            }
          }
        }
      }];

      if (unitStatuses.error > 0) {
          actions.push({
            title: 'Errors',
            value: unitStatuses.error,
            valueType: 'error',
          });
      }

      if (unitStatuses.pending > 0) {
          actions.push({
            title: 'Pending',
            value: unitStatuses.pending,
            valueType: 'pending',
          });
      }

      if (unitStatuses.uncommitted > 0) {
          actions.push({
            title: 'Uncommitted',
            value: unitStatuses.uncommitted,
            valueType: 'uncommitted',
          });
      }

      actions.push({
          title: 'Configure',
          icon: this.icons.configure
        },
        {
          title: 'Relations',
          icon: this.icons.relations
        },
        {
          title: 'Actions',
          icon: this.icons.actions
        },
        {
          title: 'Expose',
          value: 'Off',
          icon: this.icons.expose
        },
        {
          title: 'Change version',
          link: 'https://jujucharms.com/mediawiki/',
          linkTitle: 'cs:precise/mediawiki-18',
          icon: this.icons.version
        });

      this.state.actions = actions;
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

    render: function() {
      this._generateActions(this.props.service);
      var buttons = [{
        title: 'Destroy',
        action: this._showConfirmation
        }];
      var confirmMessage = 'Are you sure you want to destroy the service? ' +
        'This cannot be undone.';
      var confirmButtons = [
        {
          title: 'Cancel',
          action: this._hideConfirmation
          },
        {
          title: 'Confirm',
          type: 'confirm'
          }
        ];
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
