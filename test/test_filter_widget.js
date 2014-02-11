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

describe('filter widget', function() {
  var container, handle, instance, utils, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use(
        ['browser-filter-widget',
          'juju-tests-utils',
          'node-event-simulate'], function(Y) {
          utils = Y.namespace('juju-tests.utils');
          done();
        });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    instance = new Y.juju.widgets.browser.Filter({
      filters: {
        text: 'foo',
        type: ['approved'],
        categories: ['databases', 'app-servers']
      }
    });
  });

  afterEach(function() {
    if (handle) {
      handle.detach();
    }
    if (instance) {
      instance.destroy();
    }
  });

  it('initializes correctly', function() {
    assert.isObject(instance.get('filters'));

    instance.get('categories')[0].value.should.eql('app-servers');
    instance.get('categories')[0].name.should.eql('App Servers');
    instance.get('categories')[0].checked.should.eql(true);

    instance.get('type')[0].name.should.eql('Reviewed Charms');
    instance.get('type')[0].value.should.eql('approved');
    instance.get('type')[0].checked.should.eql(true);
  });

  it('renders provided filters', function() {
    instance.render(container);

    var checked = container.all('input[checked="checked"]');
    assert(checked.size() === 3);
  });

  it('checking an input fires a search changed event', function(done) {

    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('type');
      ev.change.value.should.eql([]);
      done();
    });

    var ftype = container.one('input[value="approved"]');
    ftype.simulate('click');
  });

  it('checking input not in current filters fires correctly', function(done) {

    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('series');
      ev.change.value.should.eql(['precise']);
      done();
    });

    var ftype = container.one('input[value="precise"]');
    ftype.simulate('click');
  });

  it('unchecking an input fires a search changed event', function(done) {
    instance.render(container);

    handle = instance.on(instance.EV_FILTER_CHANGED, function(ev) {
      assert.isObject(ev.change);
      ev.change.field.should.eql('categories');
      ev.change.value.should.eql(['app-servers']);
      done();
    });

    var ftype = container.one('input[value="databases"]');
    ftype.simulate('click');
  });

});
