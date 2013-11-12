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


describe('dropdown view extension', function() {
  var Y, container, view, View;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['view-dropdown-extension',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {

      View = Y.Base.create('dropdown', Y.View, [
          Y.juju.Dropdown,
          Y.Event.EventTracker
        ], {
          template: '<a href="" class="menu-link"></a>' +
                    '<div class="dropdown"></div>',

          render: function() {
            this.get('container').setHTML(this.template);
            this._addDropdownFunc();
            return this;
          }
      });
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer();
    view = new View({ container: container }).render();
  });

  afterEach(function() {
    view.destroy();
    container.remove().destroy(true);
  });

  it('should add the dropdown-menu class to the views container', function() {
    assert.isTrue(container.hasClass('dropdown-menu'));
  });

  it('should open when the primary link is clicked', function(done) {
    var link = container.one('.menu-link');
    link.after('click', function() {
      assert.isTrue(container.hasClass('open'));
      done();
    });
    link.simulate('click');
  });

  it('should close when clicking outside the view', function() {
    container.one('.menu-link').simulate('click');
    assert.isTrue(container.hasClass('open'));

    Y.one('body').simulate('click');
    assert.isFalse(container.hasClass('open'));
  });

});
