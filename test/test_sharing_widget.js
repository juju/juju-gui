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


describe('sharing widget', function() {
  var container, Y;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-sharing-widget',
      'node',
      'node-event-simulate',
      'juju-tests-utils'
    ], function(Y) {
      done();
    });
  });

  beforeEach(function() {
    var utils = Y.namespace('juju-tests.utils');
    container = utils.makeContainer('charm-container');
  });

  afterEach(function() {
    container.remove(true);
  });

  it('renders invisibly', function() {
    var widget = new Y.juju.widgets.browser.SharingWidget({
      button: container
    });
    widget.render(container);
    assert.isFalse(widget.get('visible'));
  });

  it('changes visiblity when the button is clicked', function() {
    var widget = new Y.juju.widgets.browser.SharingWidget({
      button: container
    });
    widget.render(container);
    container.simulate('click');
    assert.isTrue(widget.get('visible'));
    container.simulate('click');
    assert.isFalse(widget.get('visible'));
  });

  it('escapes links for the template', function() {
    var widget =  new Y.juju.widgets.browser.SharingWidget({
      button: container,
      link: 'http://example.com/foo/bar'
    });
    var escaped_link = 'http%3A//example.com/foo/bar';
    var data = widget._getSharingData();
    assert.equal(escaped_link, data.link);
  });

  it('handles clicks on the links', function() {
    var widget =  new Y.juju.widgets.browser.SharingWidget({
      button: container,
      link: 'http://example.com/foo/bar'
    });
    var linkOpened = false;
    widget._openShareLink = function(e) {
      linkOpened = true;
    };
    widget.render(container);
    container.one('a').simulate('click');
    assert.isTrue(linkOpened);
  });
});
