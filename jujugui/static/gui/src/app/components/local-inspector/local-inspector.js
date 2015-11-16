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

YUI.add('local-inspector', function() {

  juju.components.LocalInspector = React.createClass({

    /**
      Get the current state of the local inspector.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      return this.generateState(this.props);
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    /**
      Change the state to reflect the chosen component.

      @method _changeActiveComponent
      @param {String} newComponent The component to switch to.
    */
    _changeActiveComponent: function(newComponent) {
      var nextProps = this.state;
      nextProps.activeComponent = newComponent;
      this.setState(this.generateState(nextProps));
    },

    /**
      Generates the state for the inspector based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var state = {
        activeComponent: nextProps.activeComponent || nextProps.localType ||
          this.props.localType
      };
      switch (state.activeComponent) {
        case 'new':
          var file = this.props.file;
          var size = (file.size / 1024).toFixed(2);
          state.activeChild = {
            component: (
              <div>
                <p>
                  File: {file.name}{' '}
                  <span className="local-inspector__size">
                    ({size}kb)
                  </span>
                </p>
                <p>Deploy with series:</p>
                <select ref="series" defaultValue="trusty">
                  <option value="precise">precise</option>
                  <option value="quantal">quantal</option>
                  <option value="raring">raring</option>
                  <option value="saucy">saucy</option>
                  <option value="trusty">trusty</option>
                  <option value="utopic">utopic</option>
                  <option value="vivid">vivid</option>
                  <option value="win2012hvr2">win2012hvr2</option>
                  <option value="win2012hv">win2012hv</option>
                  <option value="win2012r2">win2012r2</option>
                  <option value="win2012">win2012</option>
                  <option value="win7">win7</option>
                  <option value="win8">win8</option>
                  <option value="win81">win81</option>
                </select>
              </div>
            ),
            buttons: [{
              title: 'Cancel',
              action: this._backCallback
            }, {
              title: 'Upload',
              action: this._handleUpload,
              type: 'confirm'
            }]
          };
          break;
        case 'update':
          state.activeChild = {
            component: (
              <ul>
                {this._generateServiceList()}
              </ul>
            ),
            buttons: [{
              title: 'Cancel',
              action: this._backCallback
            }, {
              title: 'Upgrade',
              action: this._handleUpload,
              type: 'confirm'
            }]
          };
          break;
      }
      return state;
    },

    /**
      Generate a list of services

      @method _generateServiceList
    */
    _generateServiceList: function() {
      var services = this.props.services.toArray();
      if (services.length === 0) {
        return <li>No existing services</li>;
      }
      var items = [];
      services.forEach(function(service) {
        var serviceId = service.get('id');
        items.push(
          <li key={serviceId}>
            <label>
              <input type="radio" name={serviceId}
                ref={'service-' + serviceId} />
              {service.get('name')}
            </label>
          </li>
        );
      });
      return items;
    },

    /**
      Handle closing the local inspector.

      @method _backCallback
    */
    _backCallback: function() {
      this.props.changeState({
        sectionA: {
          component: 'services',
          metadata: null
        }});
    },

    /**
      Handle uploading the charm.

      @method _handleUpload
    */
    _handleUpload: function() {
      this.props.uploadLocalCharm(this.refs.series.value, this.props.file);
    },

    render: function() {
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._backCallback}
            title="Local charm" />
          <div className="inspector-content local-inspector__section">
            <label>
              <input type="radio" name="action" defaultChecked={true}
                onChange={this._changeActiveComponent.bind(this, 'new')} />
              Deploy new charm
            </label>
            <label>
              <input type="radio" name="action"
                onChange={this._changeActiveComponent.bind(this, 'update')} />
              Upgrade existing charm(s)
            </label>
            {this.state.activeChild.component}
          </div>
          <juju.components.ButtonRow
            buttons={this.state.activeChild.buttons} />
        </div>
      );
    }

  });

}, '0.1.0', {requires: [
  'button-row'
]});
