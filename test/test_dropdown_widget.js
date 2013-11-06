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


describe('dropdown widget', function() {
  var Y, container, dropdown, Dropdown;

  before(function(done) {
    Y = YUI(GlobalConfig).use(['dropdown',
                               'juju-tests-utils',
                               'event-simulate',
                               'node-event-simulate',
                               'node'], function(Y) {
      Dropdown = Y.juju.widgets.Dropdown;
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
    Y.Node.create([
      '<div id="dropdown">',
      '<a href="" class="menu-link"></a>',
      '<div class="dropdown"></div>',
      '</div>'
    ].join('')).appendTo(container);

    dropdown = new Dropdown({
      node: Y.one('#dropdown')
    });
    dropdown.render();
  });

  afterEach(function() {
    container.remove(true);
    if (dropdown) {
      dropdown.destroy();
    }
  });

  it('should attach to the correct node', function() {
    assert.isTrue(container.one('#dropdown').hasClass('dropdown-menu'));
  });

  it('should open when the link is clicked', function() {
    container.one('.menu-link').simulate('click');
    assert.isTrue(container.one('#dropdown').hasClass('open'));
  });

  it('should close when clicking outside the widget', function() {
    container.one('.menu-link').simulate('click');
    assert.isTrue(container.one('#dropdown').hasClass('open'));

    Y.one('body').simulate('click');
    assert.isFalse(container.one('#dropdown').hasClass('open'));
  });

});
