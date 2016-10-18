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

YUI.add('zoom', function() {

  juju.components.Zoom = React.createClass({
    propTypes: {
      scaleJump: React.PropTypes.number,
      topo: React.PropTypes.object.isRequired
    },

    getDefaultProps: function() {
      return {scaleJump: .2};
    },

    /**
      Fires the zoom function with an increased zoom value

      @method _zoomIn
    */
    _zoomIn: function() {
      var topo = this.props.topo;
      var panZoomModule = topo.modules.PanZoomModule;
      var currentScale = topo.get('scale');
      var newScale = currentScale + this.props.scaleJump;
      panZoomModule._fire_zoom(newScale);
    },

    /**
      Fires the zoom function with an decreased zoom value

      @method _zoomOut
    */
    _zoomOut: function() {
      var topo = this.props.topo;
      var panZoomModule = topo.modules.PanZoomModule;
      var currentScale = topo.get('scale');
      var newScale = currentScale - this.props.scaleJump;
      panZoomModule._fire_zoom(newScale);
    },

    render: function() {
      return (
        <ul className="zoom">
          <li className="zoom__in link"
            onClick={this._zoomIn}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon name="add_16"
              className="import-export__icon"
              size="12" />
          </li>
          <li className="zoom__out link"
            onClick={this._zoomOut}
            role="button"
            tabIndex="0">
            <juju.components.SvgIcon name="minus_16"
              className="import-export__icon"
              size="12" />
          </li>
        </ul>
      );
    }
  });

}, '0.1.0', { requires: []});
