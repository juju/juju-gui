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
      Generate the update controls.

      @method _generateUpdate
    */
    _generateUpdate: function() {
      if (this.props.localType !== 'update') {
        return;
      }
      var buttons = [{
        title: 'Cancel',
        action: this._backCallback
      }, {
        title: 'Upgrade',
        action: this._handleUpload,
        type: 'confirm'
      }];
      var services = this.props.services.toArray();
      var items = [];
      services.forEach(function(service) {
        items.push(
          <li key={service.get('id')}>
            {service.get('name')}
          </li>
        );
      });
      return (
        <div>
          <div className="inspector-content local-inspector__section">
            <h3>Upgrade services</h3>
          </div>
          <ul>
            {items}
          </ul>
          <juju.components.ButtonRow
            buttons={buttons} />
        </div>
      );
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
      // var file = this.props.file;
      var file = {
        name: 'archive.zip',
        size: '75009'
      };
      var size = (file.size / 1024).toFixed(2);
      var buttons = [{
        title: 'Cancel',
        action: this._backCallback
      }, {
        title: 'Upload',
        action: this._handleUpload,
        type: 'confirm'
      }];
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._backCallback}
            title="Deploy local charm" />
          <div className="inspector-content local-inspector__section">
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
          <juju.components.ButtonRow
            buttons={buttons} />
          {this._generateUpdate()}
        </div>
      );
    }

  });

}, '0.1.0', {requires: [
  'button-row'
]});
