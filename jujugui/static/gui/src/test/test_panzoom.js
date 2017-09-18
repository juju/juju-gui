/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

describe('pan zoom module', function() {
  var db, models, utils, view, viewContainer, views, pz, topo, vis;

  before(function(done) {
    YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-tests-utils',
      'juju-view-environment'],
    function(Y) {
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    view = new views.environment({
      container: viewContainer,
      db: db,
      state: {changeState: sinon.stub()}
    });
    view.render();
    view.rendered();
    pz = view.topo.modules.PanZoomModule;
    topo = pz.get('component');
    vis = topo.vis;
  });

  afterEach(function() {
    db.destroy();
    view.destroy();
    viewContainer.remove();
  });

  // Test the zoom calculations.
  it('should handle fractional values within the limit for rescale',
    function() {
      // Floor is used so the scale will round down.
      var evt =
           { scale: 0.609,
             translate: [0, 0]};
      pz.rescale(evt);
      topo.get('scale').should.equal(0.609);
      var translate = evt.translate;
      var expected = 'translate(' + translate + ') scale(0.609)';
      vis.attr('transform').should.equal(expected);
    });

  it('should set an upper limit for rescale',
    function() {
      var evt =
           { scale: 2.1,
             translate: [0, 0]};
      pz.rescale(evt);
      topo.get('scale').should.equal(2.0);
      var translate = evt.translate;
      var expected = 'translate(' + translate + ') scale(2)';
      vis.attr('transform').should.equal(expected);
    });

  it('should set a lower limit for rescale',
    function() {
      var evt =
           { scale: 0.2,
             translate: [0, 0]};
      pz.rescale(evt);
      topo.get('scale').should.equal(0.25);
      var translate = evt.translate;
      var expected = 'translate(' + translate + ') scale(0.25)';
      vis.attr('transform').should.equal(expected);
    });

  it('must be able to handle zoom in/out events', function() {
    const svg = viewContainer.querySelector('.the-canvas g');
    // We're not rendering the app so the events aren't available, so just test
    // the methods directly.
    pz.zoom_in();
    let attr = svg.getAttribute('transform');
    // Ensure that, after simulating the zoom in, that the
    // scale portion of the transform attribute of the svg
    // element has been upped by 0.2.  The transform attribute
    // also contains translate, so test via a regex.
    /scale\(1\.2\)/.test(attr).should.equal(true);
    pz.zoom_out();
    attr = svg.getAttribute('transform');
    /scale\(1\)/.test(attr).should.equal(true);
  });
});
