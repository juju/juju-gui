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

describe('charm token drag and drop', function() {
  var Y, container, outerContainer, CharmToken, token;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'browser-charm-token',
      'juju-tests-utils'
    ],
    function(Y) {
      CharmToken = Y.juju.widgets.browser.CharmToken;
      done();
    });

  });

  beforeEach(function() {
    outerContainer = Y.namespace('juju-tests.utils').makeContainer()
      .addClass('yui3-charmtoken');
    container = Y.namespace('juju-tests.utils').makeContainer();
    outerContainer.append(container);
  });

  afterEach(function() {
    outerContainer.remove().destroy(true);
    if (token) {
      token.destroy();
    }
  });

  it('makes each charm token draggable', function() {
    var cfg = {
      id: 'test',
      name: 'some-charm',
      description: 'some description',
      recent_commit_count: 1,
      recent_download_count: 3,
      tested_providers: ['ec2']
    };
    token = new CharmToken(cfg);
    var draggable = [];
    token._makeDraggable = function(element, dragImage, charmData) {
      draggable.push(Y.JSON.parse(charmData).id);
    };
    token.renderUI(container);
    // Many elements are made draggable for a single token token.
    assert.isTrue(draggable.length > 1);
    // There is only a single token represented by all the draggable elements.
    draggable = Y.Array.dedupe(draggable);
    assert.equal(draggable.length, 1);
    // All of the charm tokens are made draggable.
    assert.deepEqual(draggable, ['test']);
  });

  it('can make an element draggable', function() {
    token = new CharmToken();
    var setAttributeCalled, onCalled;
    var element = {
      setAttribute: function(name, value) {
        assert.equal(name, 'draggable');
        assert.equal(value, 'true');
        setAttributeCalled = true;
      },
      on: function(when, callable) {
        assert.equal(when, 'dragstart');
        onCalled = true;
        return {detach: function() {}};
      }
    };
    var dragImage = {};
    token._makeDragStartHandler = function(dragImage, charmData) {
      assert.equal(element, element);
      assert.equal(dragImage, dragImage);
      assert.equal(charmData, charmData);
    };
    token._makeDraggable(element, dragImage, 'charm-id');
    assert.isTrue(setAttributeCalled);
    assert.isTrue(onCalled);
  });

  it('can set up drag and drop configuration', function() {
    token = new CharmToken();
    var setDataCalled, setDragImageCalled;
    var dragImage = {_node: {id: 'the real drag image'}};
    var charmData = 'data';
    var handler = token._makeDragStartHandler(dragImage, charmData);
    var dragDataSet = [];
    var evt = {
      _event: {
        dataTransfer: {
          setData: function(name, value) {
            dragDataSet.push([name, value]);
            setDataCalled = true;
          },
          setDragImage: function(provideDragImage, x, y) {
            assert.equal(provideDragImage, dragImage._node);
            assert.equal(x, 0);
            assert.equal(y, 0);
            setDragImageCalled = true;
          }
        }
      }
    };
    handler(evt);
    assert.equal(evt._event.dataTransfer.effectAllowed, 'copy');
    assert.equal(Y.JSON.stringify(dragDataSet),
        '[["charmData","data"],["dataType","charm-token-drag-and-drop"]]');
    assert.isTrue(setDataCalled);
    assert.isTrue(setDragImageCalled);
  });

  it('respects the isDraggable switch', function() {
    token = new CharmToken();
    token.set('isDraggable', false);
    var dragEnabled = false;
    token._addDraggability = function() {
      dragEnabled = true;
    }
    token.renderUI(container);
    // Since we set isDraggable to false, _addDraggability was not called.
    assert.isFalse(dragEnabled);
    // If we set isDraggable to true, _addDraggability will be called.
    token.set('isDraggable', true);
    token.renderUI(container);
    assert.isTrue(dragEnabled);
  });

});
