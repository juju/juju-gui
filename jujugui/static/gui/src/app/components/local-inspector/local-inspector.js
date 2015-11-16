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
    SERIES: [
      'precise',
      'quantal',
      'raring',
      'saucy',
      'trusty',
      'utopic',
      'vivid',
      'win2012hvr2',
      'win2012hv',
      'win2012r2',
      'win2012',
      'win7',
      'win8',
      'win81',
    ],

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
      Generates the state for the local inspector based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      return {
        activeComponent: nextProps.activeComponent || nextProps.localType ||
          this.props.localType
      };
    },

    /**
      Generates the active component based on the state.

      @method _generateComponent
      @param {Object} activeComponent The component to display.
      @return {Object} A generated component.
    */
    _generateComponent: function(activeComponent) {
      var component;
      switch (activeComponent) {
        case 'new':
          var file = this.props.file;
          var size = (file.size / 1024).toFixed(2);
          var seriesOptions = this.SERIES.map((series) => {
            return <option value={series} key={series}>{series}</option>;
          });
          component = (
            <div>
              <p>
                File: {file.name}{' '}
                <span className="local-inspector__size">
                  ({size}kb)
                </span>
              </p>
              <p>Deploy with series:</p>
              <select ref="series" defaultValue="trusty">
                {seriesOptions}
              </select>
            </div>
          );
          break;
        case 'update':
          component = (
            <ul className="local-inspector__list">
              {this._generateServiceList()}
            </ul>
          );
          break;
      }
      return component;
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
              <input type="checkbox" data-id={serviceId}
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

      @method _close
    */
    _close: function() {
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

    /**
      Handle updating services.

      @method _handleUpdate
    */
    _handleUpdate: function() {
      var refs = this.refs;
      var services = this.props.services;
      var selectedServices = Object.keys(refs).filter((ref) => {
        var input = refs[ref];
        if (ref.split('-')[0] === 'service' && input.checked) {
          return true;
        }
        return false;
      });
      if (selectedServices.length > 0) {
        var serviceList = selectedServices.map((serviceId) => {
          return services.getById(serviceId.split('-')[1]);
        });
        this.props.upgradeServiceUsingLocalCharm(serviceList, this.props.file);
        this._close();
      }
    },

    /**
      Handle uploading the charm.

      @method _handleUpload
      @param {Object} activeComponent The component to display.
      @returns {Array} A list of buttons.
    */
    _generateButtons: function(activeComponent) {
      var buttons = [{
        title: 'Cancel',
        action: this._close
      }];
      switch (activeComponent) {
        case 'new':
          buttons.push({
            title: 'Upload',
            action: this._handleUpload,
            type: 'confirm'
          });
          break;
        case 'update':
          buttons.push({
            title: 'Upgrade',
            action: this._handleUpdate,
            type: 'confirm'
          });
          break;
      }
      return buttons;
    },

    render: function() {
      var localType = this.props.localType;
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._close}
            title="Local charm" />
          <div className="inspector-content local-inspector__section">
            <ul className="local-inspector__list">
              <li>
                <label>
                  <input type="radio" name="action"
                    defaultChecked={localType === 'new'}
                    onChange={this._changeActiveComponent.bind(this, 'new')} />
                  Deploy new charm
                </label>
              </li>
              <li>
                <label>
                  <input type="radio" name="action"
                    defaultChecked={localType === 'update'}
                    onChange={
                      this._changeActiveComponent.bind(this, 'update')} />
                  Upgrade existing charm(s)
                </label>
              </li>
            </ul>
            {this._generateComponent(this.state.activeComponent)}
          </div>
          <juju.components.ButtonRow
            buttons={this._generateButtons(this.state.activeComponent)} />
        </div>
      );
    }

  });

}, '0.1.0', {requires: [
  'button-row'
]});
