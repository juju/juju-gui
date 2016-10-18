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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('Zoom', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('zoom', function() { done(); });
  });

  beforeEach(function() {
  });

  it('can render the zoom component', function() {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Zoom
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
          <juju.components.SvgIcon name="add_16"
            className="import-export__icon"
            size="12" />
        </li>
        <li className="zoom__out link"
          onClick={instance._zoomOut}
          role="button"
          tabIndex="0">
          <juju.components.SvgIcon name="minus_16"
            className="import-export__icon"
            size="12" />
        </li>
      </ul>);
    assert.deepEqual(output, expected);
  });

  it('can zoom in', function() {
    var topo = {
      modules: {
        PanZoomModule: {
          _fire_zoom: sinon.stub()
        }
      },
      get: function() {
        return 1;
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Zoom
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
      get: function() {
        return 1;
      }
    };
    var renderer = jsTestUtils.shallowRender(
      <juju.components.Zoom
        topo={topo} />, true);
    var output = renderer.getRenderOutput();
    output.props.children[1].props.onClick();
    assert.equal(topo.modules.PanZoomModule._fire_zoom.callCount, 1);
  });
});
