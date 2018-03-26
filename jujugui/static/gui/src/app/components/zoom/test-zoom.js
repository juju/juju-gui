/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Zoom = require('./zoom');
const SvgIcon = require('../svg-icon/svg-icon');

describe('Zoom', function() {
  let topo;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Zoom
      topo={options.topo || topo}
      zoomInCanvas={options.zoomInCanvas || sinon.stub()}
      zoomOutCanvas={options.zoomOutCanvas || sinon.stub()} />
  );

  beforeEach(() => {
    topo = {
      modules: {
        PanZoomModule: {
          _fire_zoom: sinon.stub()
        }
      },
      getScale: sinon.stub().returns(1)
    };
  });

  it('can render the zoom component', function() {
    const wrapper = renderComponent();
    var expected = (
      <ul className="zoom">
        <li className="zoom__in link"
          onClick={wrapper.find('.zoom__in').prop('onClick')}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-in__icon"
            name="add_16"
            size="12" />
        </li>
        <li className="zoom__out link"
          onClick={wrapper.find('.zoom__out').prop('onClick')}
          role="button"
          tabIndex="0">
          <SvgIcon className="zoom-out__icon"
            name="minus_16"
            size="12" />
        </li>
      </ul>);
    assert.compareJSX(wrapper, expected);
  });

  it('can zoom in', function() {
    const wrapper = renderComponent();
    wrapper.find('.zoom__in').simulate('click');
    assert.equal(topo.modules.PanZoomModule._fire_zoom.callCount, 1);
  });

  it('can zoom out', function() {
    const wrapper = renderComponent();
    wrapper.find('.zoom__out').simulate('click');
    assert.equal(topo.modules.PanZoomModule._fire_zoom.callCount, 1);
  });
});
