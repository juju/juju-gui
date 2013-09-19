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

describe('charm container widget', function() {
  var container, Y, charm_container, TokenContainer, cleanIconHelper, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'array',
      'juju-tests-utils',
      'browser-charm-container',
      'browser-charm-token',
      'node-event-simulate'],
    function(Y) {
      utils = Y.namespace('juju-tests.utils');
      cleanIconHelper = utils.stubCharmIconPath();
      TokenContainer = Y.juju.widgets.browser.TokenContainer;
      done();
    });
  });

  beforeEach(function() {
    container = Y.namespace('juju-tests.utils').makeContainer('container');
  });

  afterEach(function() {
    if (charm_container) {
      charm_container.destroy();
    }
    container.remove().destroy(true);
  });

  after(function() {
    cleanIconHelper();
  });

  it('sets up values according to children and its cutoff', function() {
    charm_container = new Y.juju.widgets.browser.TokenContainer({
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    assert.equal(3, charm_container.get('cutoff'));
    assert.equal(1, charm_container.get('extra'));
  });

  it('only shows items up to the cutoff at first', function() {
    charm_container = new Y.juju.widgets.browser.TokenContainer({
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);
    var charms = container.all('.yui3-token'),
        shown_charms = charms.slice(0, 3),
        hidden_charms = charms.slice(3, 4);
    Y.Array.each(shown_charms, function(charm) {
      assert.isFalse(charm.hasClass('yui3-token-hidden'));
    });
    Y.Array.each(hidden_charms, function(charm) {
      assert.isTrue(charm.hasClass('yui3-token-hidden'));
    });
  });

  it('renders', function() {
    charm_container = new Y.juju.widgets.browser.TokenContainer({
      name: 'Popular',
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);
    var headingText = container.one('h3 a').get('text').replace(/\s/g, '');
    assert.equal('Popular(4)', headingText);
    assert.isFalse(container.one('.more').hasClass('hidden'));
    assert.isTrue(container.one('.less').hasClass('hidden'));
  });

  it('toggles between all or just a few items being shown', function() {
    var hidden;
    charm_container = new Y.juju.widgets.browser.TokenContainer({
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);

    container.one('.expandToggle').simulate('click');
    hidden = container.all('.yui3-token-hidden');
    assert.equal(
        0, hidden.size(),
        'Hidden items after all items should be visible.');
    assert.isFalse(container.one('.less').hasClass('hidden'));
    assert.isTrue(container.one('.more').hasClass('hidden'));

    container.one('.expandToggle').simulate('click');
    hidden = container.all('.yui3-token-hidden');
    assert.equal(
        1, hidden.size(),
        'No hidden items after extra items should be hidden.');
    assert.isTrue(container.one('.less').hasClass('hidden'));
    assert.isFalse(container.one('.more').hasClass('hidden'));
  });

  it('handles having no charm tokens', function() {
    charm_container = new Y.juju.widgets.browser.TokenContainer({name: 'Foo'});
    charm_container.render(container);
    var rendered = container.one('.yui3-tokencontainer');
    assert.equal(
        'Foo(0)',
        rendered.one('h3').get('text').replace(/\s/g, ''));
  });

  it('handles having less charms tokens than its cutoff', function() {
    charm_container = new Y.juju.widgets.browser.TokenContainer({
      name: 'Popular',
      cutoff: 6,
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      },{
        name: 'baz'
      },{
        name: 'hob'
      }]
    });
    charm_container.render(container);

    var rendered = container.one('.yui3-tokencontainer');
    assert.equal(
        'Popular(4)',
        rendered.one('h3').get('text').replace(/\s/g, ''));
    assert.equal(4, container.all('.yui3-token').size());
    assert.equal(0, container.all('.yui3-token-hidden').size());
    assert.equal(1, charm_container._events.length);
    assert.isNull(rendered.one('.expand'));
  });

  it('allows setting the size on all charms it contains', function() {
    charm_container = new TokenContainer({
      name: 'Popular',
      cutoff: 6,
      children: [{
        name: 'foo'
      },{
        name: 'bar'
      }],
      additionalChildConfig: {
        size: 'large'
      }
    });

    charm_container.render(container);
    var tokens = container.all('.charm-token');

    tokens.size().should.equal(2);
    Y.Array.each(tokens, function(token) {
      token.hasClass('large').should.equal(true);
    });
  });
});
