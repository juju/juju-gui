/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Zoom = require('./zoom');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Zoom', function() {

  it('can render the zoom component', function() {
    var renderer = jsTestUtils.shallowRender(
      <Zoom
        topo={{}}
        zoomInCanvas={sinon.stub()}
        zoomOutCanvas={sinon.stub()} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <ul className="zoom">
        <li className="zoom__in link"
          onClick={instance._zoomIn}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-in__icon"
            name="add_16"
            size="12" />
        </li>
        <li className="zoom__out link"
          onClick={instance._zoomOut}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-out__icon"
            name="minus_16"
            size="12" />
        </li>
      </ul>);
    expect(output).toEqualJSX(expected);
  });

  it('can zoom in', function() {
    var topo = {
      modules: {
        PanZoomModule: {
          _fire_zoom: sinon.stub()
        }
      },
      getScale: sinon.stub().returns(1)
    };
    var renderer = jsTestUtils.shallowRender(
      <Zoom
        topo={topo} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[0].props.onClick();
    assert.equal(topo.modules.PanZoomModule._fire_zoom.callCount, 1);
  });

  it('can zoom out', function() {
    var topo = {
      modules: {
        PanZoomModule: {
          _fire_zoom: sinon.stub()
        }
      },
      getScale: sinon.stub().returns(1)
    };
    var renderer = jsTestUtils.shallowRender(
      <Zoom
        topo={topo} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.onClick();
    assert.equal(topo.modules.PanZoomModule._fire_zoom.callCount, 1);
  });
});
