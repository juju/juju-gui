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

YUI.add('inspector-component', function() {

  juju.components.Inspector = React.createClass({

    /**
      Callback for when the header back is clicked.

      @method _backCallback
    */
    _backCallback: function() {
      var state = {
        sectionA: {
          component: 'services'
        }
      };
      this.props.changeState(state);
    },

    render: function() {
      var childComponent = '';
      var activeComponent = this.props.getAppState(
          'current', 'sectionA', 'metadata').activeComponent;
      switch (activeComponent) {
        case undefined:
          childComponent = (
            <juju.components.ServiceOverview
              changeState={this.props.changeState}
              service={this.props.service} />);
        break;
        case 'units':

        break;
      }
      return (
        <div className="inspector-view">
          <juju.components.InspectorHeader
            backCallback={this._backCallback}
            title={this.props.service.get('name')} />
          <div className="inspector-content">
            {childComponent}
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'inspector-header',
    'service-overview'
    ]
});
