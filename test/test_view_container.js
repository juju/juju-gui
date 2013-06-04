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

describe('View Container', function() {
  var Y, juju, viewContainer, utils, container;

  var fakeController = function() { /* noop */ };

  before(function(done) {
    YUI(GlobalConfig).use([
      'juju-view-container',
      'juju-templates',
      'juju-tests-utils'],
    function(y) {
      Y = y;
      juju = y.namespace('juju');
      utils = Y['juju-tests'].utils;
      done();
    });
  });

  beforeEach(function() {
    var generateDOM = function(model, key) {
      return {
        name: key,
        template: Y.Lang.sub(this.template, {
          name: key
        })
      };
    };
    container = utils.makeContainer();

    viewContainer = new Y.juju.ViewContainer({
      viewlets: {
        serviceConfig: {
          template: {
            value: '<div class="viewlet">{name}</div>'
          },
          generateDOM: {
            value: generateDOM
          }
        },
        constraints: {
          template: {
            value: '<div class="viewlet">{name}</div>'
          },
          generateDOM: {
            value: generateDOM
          }
        }
      },
      template: juju.views.Templates['view-container'],
      controller: fakeController,
      container: container
    });
  });

  afterEach(function(done) {
    // destroy is async
    viewContainer.after('destroy', function() {
      done();
    });
    viewContainer.destroy();
    container.remove().destroy(true);
  });

  it('should set up a viewlet instance property', function() {
    assert.equal(typeof viewContainer.viewlets, 'object');
  });

  it('should set up a view template instance property', function() {
    assert.equal(typeof viewContainer.template, 'function');
  });

  it('should instantiate and set up a new controller instance property',
    function() {
      assert.equal(
          viewContainer.controller instanceof fakeController, true);
    });

  it('should generate viewlet instances based on the config', function() {
    var vl = viewContainer.viewlets,
        vlKeys = ['serviceConfig', 'constraints'];
    vlKeys.forEach(function(key) {
      assert.equal(typeof vl[key], 'object');
    });
  });

  it('allows you to define your own DOM generation method', function() {
    var vl = viewContainer.viewlets,
        vlKeys = ['serviceConfig', 'constraints'];
    vlKeys.forEach(function(key) {
      assert.deepEqual(vl[key].generateDOM(null, key), {
        name: key,
        template: '<div class="viewlet">' + key + '</div>'
      });
    });
  });

  it('should render its container into the DOM', function() {
    viewContainer.render();
    assert.notEqual(container.one('.view-container-wrapper'), null);
  });

  it('should render all viewlets into the DOM', function() {
    viewContainer.render();
    assert.notEqual(container.one('.view-container-wrapper'), null);
    assert.equal(container.all('.viewlet-container').size(), 2);
    assert.equal(container.all('.viewlet').size(), 2);
  });

  it('should switch the visible viewlet on request', function() {
    var vlKeys = ['serviceConfig', 'constraints'];
    viewContainer.render();
    vlKeys.forEach(function(key) {
      viewContainer.showViewlet(key);
        assert.equal(container.one('[data-viewlet=' + key + ']').getStyle('display'), 'block');
    });
  });

});
