/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

class Zoom extends React.Component {
  /**
    Fires the zoom function with an increased zoom value

    @method _zoomIn
  */
  _zoomIn() {
    var topo = this.props.topo;
    var panZoomModule = topo.modules.PanZoomModule;
    var currentScale = topo.getScale();
    var newScale = currentScale + this.props.scaleJump;
    panZoomModule._fire_zoom(newScale);
  }

  /**
    Fires the zoom function with an decreased zoom value

    @method _zoomOut
  */
  _zoomOut() {
    var topo = this.props.topo;
    var panZoomModule = topo.modules.PanZoomModule;
    var currentScale = topo.getScale();
    var newScale = currentScale - this.props.scaleJump;
    panZoomModule._fire_zoom(newScale);
  }

  render() {
    return (
      <ul className="zoom">
        <li className="zoom__in link"
          onClick={this._zoomIn.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-in__icon"
            name="add_16"
            size="12" />
        </li>
        <li className="zoom__out link"
          onClick={this._zoomOut.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-out__icon"
            name="minus_16"
            size="12" />
        </li>
      </ul>
    );
  }
};

Zoom.propTypes = {
  scaleJump: PropTypes.number,
  topo: PropTypes.object.isRequired
};

Zoom.defaultProps = {
  scaleJump: .2
};

module.exports = Zoom;
