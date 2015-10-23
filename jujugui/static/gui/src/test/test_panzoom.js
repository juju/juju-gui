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
  var db, juju, models, utils, view, viewContainer, views, Y, pz, topo, vis;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['node',
      'juju-models',
      'juju-views',
      'juju-gui',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {
      juju = Y.namespace('juju');
      models = Y.namespace('juju.models');
      views = Y.namespace('juju.views');
      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    viewContainer = utils.makeContainer(this);
    db = new models.Database();
    view = new views.environment({container: viewContainer, db: db});
    view.render();
    view.rendered();
    pz = view.topo.modules.PanZoomModule;
    topo = pz.get('component');
    vis = topo.vis;
  });

  afterEach(function() {
    db.destroy();
    view.destroy();
    viewContainer.destroy();
  });

  function fixTranslate(translate) {
    if (Y.Lang.isArray(translate) &&
        translate[0] === 0 &&
        translate[1] === 0 &&
        Y.UA.ie) {
      return 0;
    }
    return translate;
  }

  // Test the zoom calculations.
  it('should handle fractional values within the limit for rescale',
     function() {
       // Floor is used so the scale will round down.
       var evt =
           { scale: 0.609,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(0.609);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(0.609)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });

  it('should set an upper limit for rescale',
     function() {
       var evt =
           { scale: 2.1,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(2.0);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(2)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });

  it('should set a lower limit for rescale',
     function() {
       var evt =
           { scale: 0.2,
             translate: [0, 0]};
       var rescaled = false;
       topo.once('rescaled', function() {
         rescaled = true;
       });
       pz.rescale(evt);
       topo.get('scale').should.equal(0.25);
       var translate = fixTranslate(evt.translate);
       var expected = 'translate(' + translate + ') scale(0.25)';
       vis.attr('transform').should.equal(expected);
       assert.isTrue(rescaled);
     });
});
