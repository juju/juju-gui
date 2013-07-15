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


describe('viewmode controls widgets', function() {
  var Y, container, controls, ViewmodeControls;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['viewmode-controls',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      ViewmodeControls = Y.juju.widgets.ViewmodeControls;
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
    Y.Node.create([
      '<div id="content">',
      '<div id="browser-nav">',
      '<div class="sidebar"></div>',
      '<div class="fullscreen"</div>',
      '</div>'
    ].join('')).appendTo(container);
  });

  afterEach(function() {
    container.remove(true);
    if (controls) {
      controls.destroy();
    }
  });

  it('activates the correct div on init', function() {
    var triggered = false;
    controls = new ViewmodeControls({
      currentViewmode: 'fullscreen'
    });
    controls.render();
    assert.isTrue(container.one('.fullscreen').hasClass('active'));
  });

  it('should fire a fullscreen event when expand clicked', function() {
    var triggered = false;
    controls = new ViewmodeControls();
    controls.render();

    controls.on(controls.EVT_FULLSCREEN, function(ev) {
      triggered = true;
    });

    var toggle = container.one('.fullscreen');
    toggle.simulate('click');
    triggered.should.eql(true);
  });

  it('should fire a sidebar event when expand clicked', function() {
    var triggered = false;
    controls = new ViewmodeControls();
    controls.render();

    controls.on(controls.EVT_SIDEBAR, function(ev) {
      triggered = true;
    });

    var toggle = container.one('.sidebar');
    toggle.simulate('click');
    triggered.should.eql(true);
  });

  it('should fire a toggle viewable event when icon clicked', function() {
    var triggered = false;
    controls = new ViewmodeControls();
    controls.render();

    controls.on(controls.EVT_TOGGLE_VIEWABLE, function(ev) {
      triggered = true;
    });

    // The toggle button is a delegate, so verify it works for a node inserted
    // after the instance of the widget is created.
    container.one('#content').append(Y.Node.create('<a class="bws-icon"/>'));
    var toggle = container.one('.bws-icon');

    toggle.simulate('click');
    triggered.should.eql(true);
  });
});
