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

describe('more menu widget', function() {
  var container, handle, instance, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['more-menu',
          'juju-tests-utils',
          'node-event-simulate'], function(Y) {
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    instance = new Y.juju.widgets.MoreMenu({
      items: [
        {label: 'First item', callback: function() {
          return 'first callback';
        }},
        {label: 'Second item', callback: function() {
          return 'second callback';
        }}
      ]
    });
  });

  afterEach(function() {
    if (instance) {
      instance.destroy();
    }
  });

  it('renders to the container', function() {
    instance.render(container);
    assert.equal(container.one('div').hasClass('yui3-moremenu'), true);
  });

  it('renders the menu items', function() {
    instance.render(container);
    var menuItem = container.one('.menu li');
    assert.equal(menuItem.hasClass('moreMenuItem-0'), true);
    assert.equal(menuItem.get('text').trim(), 'First item');
  });

  it('closes when an item is clicked', function() {
    instance.render(container);
    instance.showMenu();
    var moreMenu = container.one('.yui3-moremenu');
    assert.equal(moreMenu.hasClass('open'), true);
    container.one('li').simulate('click');
    assert.equal(moreMenu.hasClass('open'), false);
  });

  it('closes when clicks are outside the menu', function() {
    instance.render(container);
    instance.showMenu();
    var moreMenu = container.one('.yui3-moremenu');
    assert.equal(moreMenu.hasClass('open'), true);
    Y.one('body').simulate('click');
    assert.equal(moreMenu.hasClass('open'), false);
  });

  it('fires the callback when an item is clicked on', function() {
    var eventFired = false;
    instance = new Y.juju.widgets.MoreMenu({
      items: [
        {label: 'First item', callback: function() {
          eventFired = true;
        }},
        {label: 'Second item', callback: function() {
          return 'second callback';
        }}
      ]
    });
    instance.render(container);
    instance.showMenu();
    container.one('.yui3-moremenu li').simulate('click');
    assert.equal(eventFired, true);
  });

  it('passes the event with the callback', function(done) {
    var event;
    instance = new Y.juju.widgets.MoreMenu({
      items: [
        {label: 'First item', callback: function(e) {
          event = e;
          done();
        }}
      ]
    });
    instance.render(container);
    instance.showMenu();
    container.one('.yui3-moremenu li').simulate('click');
    assert.equal(event.type, 'click');
  });

  it('can disable items', function() {
    var items = [
      {label: 'First item', callback: function() {}},
      {label: 'Second item', callback: function() {}}
    ];
    instance = new Y.juju.widgets.MoreMenu({
      items: items
    });
    instance.setItemDisabled('First item', true);
    assert.equal(items[0].disabled, true);
    assert.equal(items[1].disabled, undefined);
  });

  it('can re-enable items', function() {
    var items = [
      {label: 'First item', disabled: true, callback: function() {}}
    ];
    instance = new Y.juju.widgets.MoreMenu({
      items: items
    });
    instance.setItemDisabled('First item', false);
    assert.equal(items[0].disabled, false);
  });

  it('shows that items are disabled', function() {
    instance = new Y.juju.widgets.MoreMenu({
      items: [{ label: 'First item', disabled: true, callback: function() {} }]
    });
    instance.render(container);
    var item = container.one('.yui3-moremenu li');
    assert.equal(item.hasClass('disabled'), true);
  });

  it('shows that items are disabled after render', function() {
    instance = new Y.juju.widgets.MoreMenu({
      items: [{ label: 'First item', callback: function() {} }]
    });
    instance.render(container);
    instance.setItemDisabled('First item', true);
    var item = container.one('.yui3-moremenu li');
    assert.equal(item.hasClass('disabled'), true);
  });

  it('does not fire the callback when a disabled item is clicked on',
      function() {
        var eventFired = false;
        instance = new Y.juju.widgets.MoreMenu({
          items: [
            {label: 'First item', disabled: true, callback: function() {
              eventFired = true;
            }}
          ]
        });
        instance.render(container);
        instance.showMenu();
        container.one('.yui3-moremenu li').simulate('click');
        assert.equal(eventFired, false);
      }
  );

});
